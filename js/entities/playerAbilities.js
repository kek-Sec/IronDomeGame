import { random } from '../utils.js';
import { Rocket } from './rockets.js';
import { HiveCarrier } from './bosses.js';

// Represents the player's interceptor missile
export class Interceptor {
    constructor(startX, startY, target, speed, blastRadius, type = 'standard') {
        this.x = startX; this.y = startY; this.target = target;
        this.radius = type === 'nuke' ? 10 : 3; this.speed = speed;
        this.blastRadius = type === 'nuke' ? 150 : blastRadius;
        this.type = type; this.trail = []; this.isHoming = !!target;
        this.hasBeenDistracted = false;
        this.vx = 0;
        this.vy = -speed;
    }
    update(rockets, flares, boss) {
        // If it has a target, check the target still exists
        if (this.isHoming && this.target) {
            const targetIsRocket = this.target instanceof Rocket && !rockets.find(r => r.id === this.target.id);
            const targetIsFlare = this.target instanceof Flare && !flares.find(f => f.id === this.target.id);
            const targetIsBoss = this.target instanceof HiveCarrier && !boss;
            if (targetIsRocket || targetIsFlare || targetIsBoss) {
                this.isHoming = false; // Target is gone
            }
        }
        
        // If it has a target that's a rocket (not a flare), check for flare distractions
        if (this.isHoming && !this.hasBeenDistracted && this.target instanceof Rocket) {
            for (const flare of flares) {
                if (Math.hypot(this.x - flare.x, this.y - flare.y) < 100) {
                    this.target = flare; 
                    this.hasBeenDistracted = true;
                    break;
                }
            }
        }

        // Home in on the target
        if (this.isHoming && this.target) {
            const targetX = this.target.x;
            const targetY = this.target.y;
            const angle = Math.atan2(targetY - this.y, targetX - this.x);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }

        // Update position
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 25) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
    }
    draw(ctx) {
        ctx.beginPath();
        if (this.trail.length > 0) {
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = this.type === 'nuke' ? `rgba(255, 100, 0, 0.7)` :`rgba(0, 255, 255, 0.5)`; 
        ctx.lineWidth = this.type === 'nuke' ? 5 : 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; ctx.fill();
        ctx.shadowColor = this.type === 'nuke' ? 'orange' : 'cyan'; 
        ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0;
    }
}

// A decoy projectile to confuse interceptors
export class Flare {
    constructor(x, y) {
        this.x = x; this.y = y; this.vx = random(-2, 2); this.vy = random(-1, 1);
        this.radius = 5; this.life = 120; this.id = random(0, 1000000);
    }
    update() { this.x += this.vx; this.y += this.vy; this.life--; }
    draw(ctx) {
        const alpha = this.life / 120;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
        ctx.shadowColor = `rgba(255, 215, 0, 1)`; ctx.shadowBlur = 15;
        ctx.fill(); ctx.shadowBlur = 0;
    }
}

// C-RAM projectile
export class TracerRound {
    constructor(startX, startY, angle, speed) {
        this.x = startX; this.y = startY;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.radius = 2; this.life = 60; this.color = 'rgba(255, 100, 0, 1)'; this.trail = [];
    }
    update() {
        this.trail.push({ x: this.x, y: this.y }); if (this.trail.length > 5) this.trail.shift();
        this.x += this.vx; this.y += this.vy; this.life--;
    }
    draw(ctx) {
        if (this.trail.length > 0) {
             ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y);
             for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
             ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)'; ctx.lineWidth = this.radius * 2; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.shadowColor = 'red'; ctx.shadowBlur = 10;
        ctx.fill(); ctx.shadowBlur = 0;
    }
}

// A defensive mine that launches to intercept a single rocket
export class HomingMine {
    constructor(x, y) {
        this.x = x; this.y = y; this.vy = 0;
        this.radius = 8; this.armingTime = 120; // 2 seconds to arm
        this.isArmed = false; this.isLaunching = false;
        this.target = null; this.range = 250;
    }
    update(rockets) {
        if (!this.isArmed) {
            this.armingTime--;
            if (this.armingTime <= 0) { this.isArmed = true; }
            return false; // Not destroyed
        }
        if (this.isArmed && !this.isLaunching) {
            for (const rocket of rockets) {
                if (Math.hypot(this.x - rocket.x, this.y - rocket.y) < this.range) {
                    this.isLaunching = true;
                    this.target = rocket;
                    this.vy = -8; // Initial launch speed
                    break;
                }
            }
        }
        if (this.isLaunching) {
            this.y += this.vy;
            this.vy *= 1.05; // Accelerate
            if (this.target && Math.hypot(this.x - this.target.x, this.y - this.target.y) < this.radius + this.target.radius) {
                return true; // Hit target
            }
        }
        return this.y < 0; // Destroyed if it goes off-screen
    }
    draw(ctx) {
        ctx.save();
        if (this.isLaunching) {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff9800'; ctx.fill();
            ctx.shadowColor = '#ff9800'; ctx.shadowBlur = 15; ctx.fill();
        } else {
            ctx.fillStyle = '#424242'; ctx.fillRect(this.x - 10, this.y - 5, 20, 5);
            ctx.beginPath(); ctx.arc(this.x, this.y - 5, this.radius, Math.PI, 0);
            ctx.fillStyle = '#616161'; ctx.fill();
            if (this.isArmed && Math.floor(this.armingTime / 15) % 2 === 0) {
                ctx.beginPath(); ctx.arc(this.x, this.y - 8, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#e53935'; ctx.fill();
                ctx.shadowColor = '#e53935'; ctx.shadowBlur = 10; ctx.fill();
            }
        }
        ctx.restore();
    }
}

// Represents the clickable EMP Power-up
export class EMP {
    constructor(x, y, width, height) {
        this.x = x ?? random(width * 0.2, width * 0.8);
        this.y = y ?? random(height * 0.2, height * 0.6);
        this.radius = 20; this.life = 600; this.time = 0;
    }
    update() { this.life--; this.time++; }
    draw(ctx) {
        ctx.save();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 150, 255, 0.7)'; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + Math.sin(this.time * 0.1) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)'; ctx.stroke();
        ctx.restore();
    }
}