/**
 * classes.js
 * * Defines all the object classes used in the game.
 * Each class represents a blueprint for a game entity, such as a rocket or a particle.
 */
import { random } from './utils.js';

// Represents a city/base to be defended
export class City {
    constructor(x, y, w, h, isArmored = false) {
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.isDestroyed = false;
        this.structureType = Math.floor(random(0, 3));
        this.isArmored = isArmored; // NEW
    }
    draw(ctx, height) {
        ctx.save();
        if (this.isDestroyed) { this.drawRubble(ctx, height); } 
        else {
            switch (this.structureType) {
                case 0: this.drawBunker(ctx); break;
                case 1: this.drawDome(ctx, height); break;
                case 2: this.drawCommsTower(ctx); break;
            }
            // Draw armor shield if active
            if (this.isArmored) {
                ctx.beginPath();
                ctx.rect(this.x - 5, this.y - 5, this.width + 10, this.height + 5);
                ctx.strokeStyle = 'rgba(0, 221, 255, 0.8)';
                ctx.lineWidth = 3;
                ctx.shadowColor = 'cyan';
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
        ctx.restore();
    }
    drawBunker(ctx) {
        const h = this.height * 0.6;
        const y = this.y + (this.height - h);
        ctx.fillStyle = '#6c757d'; ctx.fillRect(this.x, y, this.width, h);
        ctx.fillStyle = '#495057'; ctx.fillRect(this.x, y, this.width, h * 0.3);
        ctx.strokeStyle = '#343a40'; ctx.lineWidth = 2; ctx.strokeRect(this.x, y, this.width, h);
    }
    drawDome(ctx, height) {
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, height, this.width / 2, Math.PI, 0);
        const gradient = ctx.createRadialGradient(this.x + this.width/2, height, 5, this.x + this.width/2, height, this.width/2);
        gradient.addColorStop(0, '#e0e0e0'); gradient.addColorStop(1, '#686868');
        ctx.fillStyle = gradient; ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1; ctx.stroke();
    }
    drawCommsTower(ctx) {
        const towerWidth = this.width * 0.3;
        const towerX = this.x + (this.width - towerWidth) / 2;
        ctx.fillStyle = '#8d99ae'; ctx.fillRect(towerX, this.y, towerWidth, this.height);
        ctx.beginPath(); ctx.arc(towerX + towerWidth / 2, this.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#ef233c'; ctx.fill();
        if (Math.random() > 0.5) {
            ctx.shadowColor = '#ef233c'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
        }
    }
    drawRubble(ctx, height) {
        ctx.fillStyle = '#4a2a2a'; ctx.beginPath();
        switch(this.structureType) {
            case 1:
                ctx.moveTo(this.x, height); ctx.lineTo(this.x + this.width * 0.3, height - this.width * 0.1);
                ctx.lineTo(this.x + this.width * 0.5, height); ctx.lineTo(this.x + this.width * 0.8, height - this.width * 0.2);
                ctx.lineTo(this.x + this.width, height); break;
            default:
                ctx.moveTo(this.x, height); ctx.lineTo(this.x + this.width * 0.2, height - this.height * 0.3);
                ctx.lineTo(this.x + this.width * 0.5, height); ctx.lineTo(this.x + this.width * 0.6, height - this.height * 0.2);
                ctx.lineTo(this.x + this.width, height); break;
        }
        ctx.closePath(); ctx.fill();
    }
    repair() { this.isDestroyed = false; }
}

// Base class for all enemy projectiles
export class Rocket {
    constructor(startX, startY, targetVx, targetVy, width, sizeMultiplier = 1, speedMultiplier = 1) {
        this.x = startX ?? random(width * 0.1, width * 0.9);
        this.y = startY ?? 0;
        this.vx = (targetVx ?? random(-1, 1)) * speedMultiplier;
        this.vy = (targetVy ?? random(1.5, 2.5)) * speedMultiplier;
        this.radius = 4 * sizeMultiplier;
        this.trail = []; this.type = 'standard'; this.color = 'red';
        this.trailColor = 'rgba(255, 77, 77, 0.5)'; this.life = 0;
        this.id = random(0, 1000000);
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
        this.life++;
    }
    draw(ctx) { this._drawTrail(ctx); this._drawHead(ctx); }
    _drawTrail(ctx) {
        if (!this.trail[0]) return;
        ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        ctx.strokeStyle = this.trailColor; ctx.lineWidth = 2 * (this.radius / 4); ctx.stroke();
    }
    _drawHead(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; ctx.fill();
        ctx.shadowColor = this.color; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
    }
}

// A rocket that flickers in and out of visibility
export class StealthRocket extends Rocket {
    constructor(width, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        this.type = 'stealth';
        this.color = '#ae00ff';
        this.trailColor = 'rgba(174, 0, 255, 0.4)';
        this.isVisible = true;
    }
    update() {
        super.update();
        if (this.life % 30 === 0) {
            this.isVisible = !this.isVisible;
        }
    }
    draw(ctx) {
        if (this.isVisible) {
            super.draw(ctx);
        }
    }
}

// A small, fast-moving projectile spawned by a Swarmer
export class Drone extends Rocket {
    constructor(startX, startY, targetVx, targetVy, width, speedMultiplier = 1) {
        super(startX, startY, targetVx, targetVy, width, 0.6, speedMultiplier * 1.5);
        this.type = 'drone';
        this.radius = 2;
        this.trailColor = 'rgba(255, 255, 0, 0.5)';
        this.color = 'yellow';
    }
}

// A rocket that splits into a swarm of Drones
export class SwarmerRocket extends Rocket {
    constructor(width, height, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier * 1.5, speedMultiplier * 0.8);
        this.width = width;
        this.type = 'swarmer';
        this.radius *= 1.5;
        this.color = '#32cd32';
        this.trailColor = 'rgba(50, 205, 50, 0.5)';
        this.splitHeight = random(height * 0.3, height * 0.6);
        this.hasSplit = false;
        this.speedMultiplier = speedMultiplier;
    }
    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) { this.hasSplit = true; }
    }
    split() {
        const childDrones = []; const childCount = 6;
        for (let i = 0; i < childCount; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(1, 3);
            const newVx = Math.cos(angle) * speed;
            const newVy = Math.sin(angle) * speed;
            childDrones.push(new Drone(this.x, this.y, newVx, newVy, this.width, this.speedMultiplier));
        }
        return childDrones;
    }
}


// A rocket that splits into multiple standard rockets
export class MirvRocket extends Rocket {
    constructor(width, height, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        this.width = width; this.type = 'mirv'; this.radius = 7 * sizeMultiplier;
        this.color = 'magenta'; this.trailColor = 'rgba(255, 0, 255, 0.5)';
        this.splitHeight = random(height * 0.2, height * 0.5); this.hasSplit = false;
        this.speedMultiplier = speedMultiplier;
    }
    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) { this.hasSplit = true; }
    }
    split() {
        const childRockets = []; const childCount = 3;
        const childSizeMultiplier = (this.radius / 7);
        for (let i = 0; i < childCount; i++) {
            const newVx = this.vx + random(-1.5, 1.5);
            const newVy = this.vy + random(-0.5, 0.5);
            childRockets.push(new Rocket(this.x, this.y, newVx, newVy, this.width, childSizeMultiplier, this.speedMultiplier));
        }
        return childRockets;
    }
    _drawTrail(ctx) {
        if (!this.trail[0]) return;
        ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = (3 + Math.sin(this.life * 0.5) * 2) * (this.radius / 7);
        ctx.stroke();
    }
}

// A decoy projectile to confuse interceptors
export class Flare {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = random(-2, 2);
        this.vy = random(-1, 1);
        this.radius = 5;
        this.life = 120;
        this.id = random(0, 1000000);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(ctx) {
        const alpha = this.life / 120;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
        ctx.shadowColor = `rgba(255, 215, 0, 1)`;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// A rocket that deploys flares to act as decoys
export class FlareRocket extends Rocket {
    constructor(width, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        this.type = 'flare';
        this.color = '#00ced1';
        this.trailColor = 'rgba(0, 206, 209, 0.5)';
        this.flareCooldown = 0;
        this.flareDeployInterval = 90;
    }
    update(flares) {
        super.update();
        this.flareCooldown--;
        if (this.flareCooldown <= 0) {
            flares.push(new Flare(this.x, this.y));
            this.flareCooldown = this.flareDeployInterval;
        }
    }
}


// Represents the player's interceptor missile
export class Interceptor {
    constructor(startX, startY, target, speed, blastRadius, type = 'standard') {
        this.x = startX; this.y = startY;
        this.target = target;
        this.radius = type === 'nuke' ? 10 : 3;
        this.speed = speed;
        this.blastRadius = type === 'nuke' ? 150 : blastRadius;
        this.type = type;
        this.trail = [];
        this.isHoming = !!target;
        this.hasBeenDistracted = false;
    }
    update(rockets, flares) {
        if (this.isHoming && !rockets.find(r => r.id === this.target.id) && !flares.find(f => f.id === this.target.id)) {
            this.isHoming = false;
        }

        if (this.isHoming && !this.hasBeenDistracted) {
            for (const flare of flares) {
                if (Math.hypot(this.x - flare.x, this.y - flare.y) < 100) {
                    this.target = flare;
                    this.hasBeenDistracted = true;
                    break;
                }
            }
        }

        if (this.isHoming) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }
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
        ctx.lineWidth = this.type === 'nuke' ? 5 : 2; 
        ctx.stroke();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; ctx.fill();
        ctx.shadowColor = this.type === 'nuke' ? 'orange' : 'cyan'; 
        ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0;
    }
}

// Represents a single particle in an explosion effect
export class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.radius = random(1, 4);
        this.life = random(60, 100); this.initialLife = this.life;
        this.color = `hsla(${color}, 100%, 70%, 1)`;
        const angle = random(0, Math.PI * 2); const speed = random(1, 6);
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.gravity = 0.05;
    }
    update() { this.life--; this.vy += this.gravity; this.x += this.vx; this.y += this.vy; }
    draw(ctx) {
        const alpha = this.life / this.initialLife;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('1)', `${alpha})`);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Represents an automated defense turret
export class AutomatedTurret {
    constructor(x, y, range, fireRate) {
        this.x = x; this.y = y; this.range = range;
        this.baseFireRate = fireRate;
        this.fireRate = fireRate;
        this.fireCooldown = 0; this.angle = -Math.PI / 2;
    }
    update(rockets) {
        if (this.fireCooldown > 0) { this.fireCooldown--; }
        const target = this.findTarget(rockets);
        if (target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.fireCooldown <= 0) {
                this.fireCooldown = this.fireRate; return target;
            }
        }
        return null;
    }
    findTarget(rockets) {
        const inRange = rockets.filter(r => Math.hypot(this.x - r.x, this.y - r.y) < this.range);
        if (inRange.length === 0) return null;

        const highPriority = inRange.filter(r => r.type === 'swarmer' || r.type === 'stealth' || r.type === 'mirv' || r.type === 'flare');
        if (highPriority.length > 0) return highPriority[0];
        
        return inRange.reduce((closest, current) => {
            const closestDist = Math.hypot(this.x - closest.x, this.y - closest.y);
            const currentDist = Math.hypot(this.x - current.x, this.y - current.y);
            return currentDist < closestDist ? current : closest;
        });
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.fillStyle = '#6c757d'; ctx.beginPath();
        ctx.moveTo(-15, 10); ctx.lineTo(15, 10); ctx.lineTo(10, 0); ctx.lineTo(-10, 0);
        ctx.closePath(); ctx.fill();
        ctx.rotate(this.angle); ctx.fillStyle = '#adb5bd'; ctx.fillRect(0, -3, 20, 6);
        ctx.fillStyle = '#00ddff'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// Represents the clickable EMP Power-up
export class EMP {
    constructor(x, y, width, height) {
        this.x = x ?? random(width * 0.2, width * 0.8);
        this.y = y ?? random(height * 0.2, height * 0.6);
        this.radius = 20;
        this.life = 600;
        this.time = 0;
    }
    update() {
        this.life--;
        this.time++;
    }
    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 150, 255, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + Math.sin(this.time * 0.1) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.stroke();
        ctx.restore();
    }
}