/**
 * classes.js
 * * Defines all the object classes used in the game.
 * Each class represents a blueprint for a game entity, such as a rocket or a particle.
 */
import { random } from './utils.js';

// Represents a city/base to be defended
export class City {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.isDestroyed = false;
        this.structureType = Math.floor(random(0, 3));
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

// Base class for all enemy rockets
export class Rocket {
    constructor(startX, startY, targetVx, targetVy, width, sizeMultiplier = 1) {
        this.x = startX ?? random(width * 0.1, width * 0.9);
        this.y = startY ?? 0;
        this.vx = targetVx ?? random(-1, 1);
        this.vy = targetVy ?? random(1.5, 2.5);
        this.radius = 4 * sizeMultiplier;
        this.trail = []; this.type = 'standard'; this.color = 'red';
        this.trailColor = 'rgba(255, 77, 77, 0.5)'; this.life = 0;
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

// A tougher rocket that requires multiple hits.
export class ArmoredRocket extends Rocket {
    constructor(width, sizeMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier);
        this.type = 'armored';
        this.radius = 6 * sizeMultiplier;
        this.health = 2;
        this.color = '#ff9a00';
        this.trailColor = 'rgba(255, 154, 0, 0.6)';
    }
    _drawHead(ctx) {
        super._drawHead(ctx);
        if (this.health < 2) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - this.radius, this.y - this.radius);
            ctx.lineTo(this.x + this.radius, this.y + this.radius);
            ctx.stroke();
        }
    }
}

// A special rocket that splits into multiple smaller rockets
export class MirvRocket extends Rocket {
    constructor(width, height, sizeMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier);
        this.width = width; this.type = 'mirv'; this.radius = 7 * sizeMultiplier;
        this.color = 'magenta'; this.trailColor = 'rgba(255, 0, 255, 0.5)';
        this.splitHeight = random(height * 0.2, height * 0.5); this.hasSplit = false;
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
            childRockets.push(new Rocket(this.x, this.y, newVx, newVy, this.width, childSizeMultiplier));
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

// Represents the player's interceptor missile
export class Interceptor {
    constructor(startX, startY, targetX, targetY, speed, blastRadius) {
        this.x = startX; this.y = startY;
        this.targetX = targetX; this.targetY = targetY;
        this.radius = 3; this.speed = speed; this.blastRadius = blastRadius;
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
        ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; ctx.fill();
        ctx.shadowColor = 'cyan'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
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
        ctx.shadowColor = this.color; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
    }
}

// Represents an automated defense turret
export class AutomatedTurret {
    constructor(x, y, range, fireRate) {
        this.x = x; this.y = y; this.range = range;
        this.fireRate = fireRate; this.fireCooldown = 0; this.angle = -Math.PI / 2;
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
        let closestTarget = null; let minDistance = this.range;
        for (const rocket of rockets) {
            const distance = Math.hypot(this.x - rocket.x, this.y - rocket.y);
            if (distance < minDistance) {
                minDistance = distance; closestTarget = rocket;
            }
        }
        return closestTarget;
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
        this.life = 600; // Lasts for 10 seconds on screen
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
        // Pulsating outer ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + Math.sin(this.time * 0.1) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.stroke();
        ctx.restore();
    }
}
