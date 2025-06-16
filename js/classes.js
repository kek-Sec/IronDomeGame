/**
 * classes.js
 * * Defines all the object classes used in the game.
 * Each class represents a blueprint for a game entity, such as a rocket or a particle.
 */
import { random } from './utils.js';

// Represents a city to be defended
export class City {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.isDestroyed = false;
        // Generate windows for the building for a more detailed look
        this.windows = [];
        for (let i = 0; i < 20; i++) {
            this.windows.push({
                x: random(0, w - 4),
                y: random(0, h - 4),
                alpha: random(0.3, 1)
            });
        }
    }
    draw(ctx, height) {
        if (this.isDestroyed) {
            // Draw more detailed rubble instead of a flat box
            ctx.fillStyle = '#4a2a2a'; 
            ctx.beginPath();
            ctx.moveTo(this.x, height);
            ctx.lineTo(this.x + this.width * 0.2, height - this.height * 0.3);
            ctx.lineTo(this.x + this.width * 0.5, height);
            ctx.lineTo(this.x + this.width * 0.6, height - this.height * 0.2);
            ctx.lineTo(this.x + this.width, height);
            ctx.closePath();
            ctx.fill();
            return;
        };

        // Create a futuristic gradient for the building
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#0f3443');
        gradient.addColorStop(0.5, '#34e89e');
        gradient.addColorStop(1, '#0f3443');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw glowing windows that flicker
        ctx.fillStyle = `rgba(0, 221, 255, 0.8)`;
        this.windows.forEach(win => {
            if (Math.random() < 0.995) { // Flicker effect
                 ctx.globalAlpha = win.alpha;
                 ctx.fillRect(this.x + win.x, this.y + win.y, 4, 4);
            }
        });
        ctx.globalAlpha = 1; // Reset alpha
        
        ctx.strokeStyle = 'rgba(0, 221, 255, 0.7)';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    repair() {
        this.isDestroyed = false;
    }
}

// Base class for all enemy rockets
export class Rocket {
    constructor(startX, startY, targetVx, targetVy, width) {
        this.x = startX ?? random(width * 0.1, width * 0.9);
        this.y = startY ?? 0;
        this.vx = targetVx ?? random(-1, 1);
        this.vy = targetVy ?? random(1.5, 2.5);
        this.radius = 4;
        this.trail = [];
        this.type = 'standard';
        this.color = 'red';
        this.trailColor = 'rgba(255, 77, 77, 0.5)';
        this.life = 0; // for time-based animations
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
        this.life++;
    }
    draw(ctx) {
        this._drawTrail(ctx);
        this._drawHead(ctx);
    }
    _drawTrail(ctx) {
        if (!this.trail[0]) return;
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    _drawHead(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// A special rocket that splits into multiple smaller rockets
export class MirvRocket extends Rocket {
    constructor(width, height) {
        super(undefined, undefined, undefined, undefined, width);
        this.width = width;
        this.type = 'mirv';
        this.radius = 7;
        this.color = 'magenta';
        this.trailColor = 'rgba(255, 0, 255, 0.5)';
        this.splitHeight = random(height * 0.2, height * 0.5);
        this.hasSplit = false;
    }
    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) {
            this.hasSplit = true;
        }
    }
    split() {
        const childRockets = [];
        const childCount = 3;
        for (let i = 0; i < childCount; i++) {
            const newVx = this.vx + random(-1.5, 1.5);
            const newVy = this.vy + random(-0.5, 0.5);
            childRockets.push(new Rocket(this.x, this.y, newVx, newVy, this.width));
        }
        return childRockets;
    }
    // Override trail drawing for a pulsating effect
    _drawTrail(ctx) {
        if (!this.trail[0]) return;
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        ctx.strokeStyle = this.trailColor;
        // Pulsating line width using a sine wave
        ctx.lineWidth = 3 + Math.sin(this.life * 0.5) * 2;
        ctx.stroke();
    }
}

// Represents the player's interceptor missile
export class Interceptor {
    constructor(startX, startY, targetX, targetY, width, height, speed) {
        this.x = startX; 
        this.y = startY;
        this.targetX = targetX; 
        this.targetY = targetY;
        this.radius = 3;
        this.speed = speed;
        this.trail = [];
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }
    update() {
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
        ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Represents a single particle in an explosion effect
export class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.radius = random(1, 4);
        this.life = random(60, 100);
        this.initialLife = this.life;
        this.color = `hsla(${color}, 100%, 70%, 1)`;
        const angle = random(0, Math.PI * 2);
        const speed = random(1, 6);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.05;
    }
    update() {
        this.life--;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
    }
    draw(ctx) {
        const alpha = this.life / this.initialLife;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('1)', `${alpha})`);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Represents an automated defense turret
export class AutomatedTurret {
    constructor(x, y, range, fireRate) {
        this.x = x;
        this.y = y;
        this.range = range;
        this.fireRate = fireRate;
        this.fireCooldown = 0;
        this.angle = -Math.PI / 2; // Pointing up initially
    }

    update(rockets) {
        if (this.fireCooldown > 0) {
            this.fireCooldown--;
        }

        const target = this.findTarget(rockets);
        if (target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.fireCooldown <= 0) {
                this.fireCooldown = this.fireRate;
                return target; // Return the target to fire at
            }
        }
        return null; // No target or still on cooldown
    }

    findTarget(rockets) {
        let closestTarget = null;
        let minDistance = this.range;

        for (const rocket of rockets) {
            const distance = Math.hypot(this.x - rocket.x, this.y - rocket.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = rocket;
            }
        }
        return closestTarget;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw base
        ctx.fillStyle = '#6c757d';
        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(15, 10);
        ctx.lineTo(10, 0);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();

        // Draw turret barrel
        ctx.rotate(this.angle);
        ctx.fillStyle = '#adb5bd';
        ctx.fillRect(0, -3, 20, 6);
        ctx.fillStyle = '#00ddff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
