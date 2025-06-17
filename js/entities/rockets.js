import { random } from '../utils.js';
import { Flare } from './playerAbilities.js';
import { Rocket as BaseRocket } from './rockets.js'; // For MirvRocket's split
import { Drone as BaseDrone } from './rockets.js'; // For SwarmerRocket's split

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

// A rocket that requires multiple hits to destroy
export class ArmoredRocket extends Rocket {
    constructor(width, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, random(-0.5, 0.5), random(1, 1.5), width, sizeMultiplier * 1.8, speedMultiplier * 0.7);
        this.type = 'armored'; this.health = 3; this.maxHealth = 3;
        this.color = '#c0c0c0'; this.trailColor = 'rgba(192, 192, 192, 0.5)';
        this.radius *= 1.8;
    }
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    draw(ctx) {
        super.draw(ctx);
        const barWidth = this.radius * 2; const barHeight = 5;
        const barX = this.x - this.radius; const barY = this.y - this.radius - 10;
        ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barWidth, barHeight);
        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = healthPercentage > 0.6 ? '#43a047' : healthPercentage > 0.3 ? '#fdd835' : '#e53935';
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// A rocket that flickers in and out of visibility
export class StealthRocket extends Rocket {
    constructor(width, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        this.type = 'stealth'; this.color = '#ae00ff';
        this.trailColor = 'rgba(174, 0, 255, 0.4)'; this.isVisible = true;
    }
    update() {
        super.update();
        if (this.life % 30 === 0) { this.isVisible = !this.isVisible; }
    }
    draw(ctx) { if (this.isVisible) { super.draw(ctx); } }
}

// A small, fast-moving projectile spawned by a Swarmer
export class Drone extends Rocket {
    constructor(startX, startY, targetVx, targetVy, width, speedMultiplier = 1) {
        super(startX, startY, targetVx, targetVy, width, 0.6, speedMultiplier * 1.5);
        this.type = 'drone'; this.radius = 2;
        this.trailColor = 'rgba(255, 255, 0, 0.5)'; this.color = 'yellow';
    }
}

// A rocket that splits into a swarm of Drones
export class SwarmerRocket extends Rocket {
    constructor(width, height, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier * 1.5, speedMultiplier * 0.8);
        this.width = width; this.type = 'swarmer'; this.radius *= 1.5;
        this.color = '#32cd32'; this.trailColor = 'rgba(50, 205, 50, 0.5)';
        this.splitHeight = random(height * 0.3, height * 0.6); this.hasSplit = false;
        this.speedMultiplier = speedMultiplier;
    }
    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) { this.hasSplit = true; }
    }
    split() {
        const childDrones = []; const childCount = 6;
        for (let i = 0; i < childCount; i++) {
            const angle = random(0, Math.PI * 2); const speed = random(1, 3);
            const newVx = Math.cos(angle) * speed; const newVy = Math.sin(angle) * speed;
            childDrones.push(new BaseDrone(this.x, this.y, newVx, newVy, this.width, this.speedMultiplier));
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
            const newVx = this.vx + random(-1.5, 1.5); const newVy = this.vy + random(-0.5, 0.5);
            childRockets.push(new BaseRocket(this.x, this.y, newVx, newVy, this.width, childSizeMultiplier, this.speedMultiplier));
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

// A rocket that deploys flares to act as decoys
export class FlareRocket extends Rocket {
    constructor(width, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        this.type = 'flare'; this.color = '#00ced1'; this.trailColor = 'rgba(0, 206, 209, 0.5)';
        this.flareCooldown = 0; this.flareDeployInterval = 90;
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