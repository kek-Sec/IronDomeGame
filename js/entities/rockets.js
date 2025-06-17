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
        this.radius = 5 * sizeMultiplier; // Increased radius slightly for new shape
        this.trail = []; this.type = 'standard'; this.color = 'red';
        this.trailColor = 'rgba(255, 100, 100, 0.6)'; this.life = 0;
        this.id = random(0, 1000000);
        this.angle = 0;
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
        this.angle = Math.atan2(this.vy, this.vx) - Math.PI / 2;
        this.life++;
    }

    // NEW: Generic trail drawing method
    _drawTrail(ctx) {
        if (!this.trail[0]) return;
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            const point = this.trail[i];
            const nextPoint = this.trail[i + 1] || point;
            const xc = (point.x + nextPoint.x) / 2;
            const yc = (point.y + nextPoint.y) / 2;
            ctx.quadraticCurveTo(point.x, point.y, xc, yc);
        }
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = 3 * (this.radius / 5);
        ctx.stroke();
    }

    // Main draw method calls trail and head drawing
    draw(ctx) {
        this._drawTrail(ctx);
        this._drawHead(ctx);
    }
    
    // NEW: Reworked head drawing for a more missile-like shape
    _drawHead(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius;
        const h = this.radius * 3;

        // Fins
        ctx.fillStyle = '#6c757d';
        ctx.beginPath();
        ctx.moveTo(-w, h * 0.3);
        ctx.lineTo(-w * 1.5, h * 0.5);
        ctx.lineTo(-w, h * 0.5);
        ctx.moveTo(w, h * 0.3);
        ctx.lineTo(w * 1.5, h * 0.5);
        ctx.lineTo(w, h * 0.5);
        ctx.fill();

        // Body
        const gradient = ctx.createLinearGradient(0, -h/2, 0, h/2);
        gradient.addColorStop(0, '#dee2e6');
        gradient.addColorStop(0.5, '#adb5bd');
        gradient.addColorStop(1, '#6c757d');
        ctx.fillStyle = gradient;
        ctx.fillRect(-w/2, -h/2, w, h);

        // Nose cone
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.6);
        ctx.lineTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, -h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
    }
}

// A rocket that requires multiple hits to destroy
export class ArmoredRocket extends Rocket {
    constructor(width, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, random(-0.5, 0.5), random(1, 1.5), width, sizeMultiplier * 1.5, speedMultiplier * 0.7);
        this.type = 'armored'; this.health = 3; this.maxHealth = 3;
        this.color = '#c0c0c0'; this.trailColor = 'rgba(192, 192, 192, 0.5)';
        this.hitFlashTimer = 0; // NEW: Timer for hit flash effect
    }
    update() {
        super.update();
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer--;
        }
    }
    takeDamage(amount) {
        this.health -= amount;
        this.hitFlashTimer = 10; // Activate flash on hit
        return this.health <= 0;
    }
    draw(ctx) {
        // Draw the base rocket first
        this._drawTrail(ctx);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius;
        const h = this.radius * 3;

        // Base rocket body (drawn again for layering)
        this._drawHead(ctx);

        // Armor Plating
        ctx.fillStyle = '#495057';
        ctx.fillRect(-w * 0.7, -h * 0.3, w * 1.4, h * 0.6);
        ctx.strokeStyle = '#212529';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w * 0.7, -h * 0.3, w * 1.4, h * 0.6);
        
        // NEW: Hit flash effect
        if (this.hitFlashTimer > 0) {
            const alpha = (this.hitFlashTimer / 10) * 0.8;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.restore();

        // Health bar
        const barWidth = this.radius * 3; const barHeight = 5;
        const barX = this.x - barWidth / 2; const barY = this.y - this.radius * 3;
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
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier * 0.8, speedMultiplier * 1.2);
        this.type = 'stealth'; this.color = '#ae00ff';
        this.trailColor = 'rgba(174, 0, 255, 0.4)'; this.isVisible = true;
    }
    update() {
        super.update();
        if (this.life % 45 === 0) { this.isVisible = !this.isVisible; }
    }
    // Override draw for stealth effect
    draw(ctx) {
        if (this.isVisible) {
            super.draw(ctx);
        } else {
            // Draw a faint distortion effect when cloaked
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            const w = this.radius;
            const h = this.radius * 3;
            ctx.strokeStyle = 'rgba(200, 200, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(-w/2, -h/2, w, h);
            ctx.restore();
        }
    }
    // Reworked head for a more angular "stealth" look
    _drawHead(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius * 1.2;
        const h = this.radius * 3;

        // Angled body
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.moveTo(0, -h/2); // Tip
        ctx.lineTo(w, h/4);
        ctx.lineTo(w/2, h/2);
        ctx.lineTo(-w/2, h/2);
        ctx.lineTo(-w, h/4);
        ctx.closePath();
        ctx.fill();

        // Cockpit glow
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.1);
        ctx.lineTo(w * 0.4, h * 0.2);
        ctx.lineTo(-w * 0.4, h * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// A small, fast-moving projectile spawned by a Swarmer or Boss
export class Drone extends Rocket {
    constructor(startX, startY, targetVx, targetVy, width, speedMultiplier = 1) {
        super(startX, startY, targetVx, targetVy, width, 0.6, speedMultiplier * 1.5);
        this.type = 'drone';
        this.radius = 3;
        this.trailColor = 'rgba(255, 255, 0, 0.5)'; this.color = 'yellow';
    }
    // Drones get a simpler, more "energetic" look
    _drawHead(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const r = this.radius;

        // Main body
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, -r * 2);
        ctx.lineTo(r, r);
        ctx.lineTo(-r, r);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, r * 0.5, r/2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// A rocket that splits into a swarm of Drones
export class SwarmerRocket extends Rocket {
    constructor(width, height, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier * 1.5, speedMultiplier * 0.8);
        this.width = width; this.type = 'swarmer'; this.radius *= 1.2;
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
    _drawHead(ctx) {
        super._drawHead(ctx); // Draw the base missile shape
        // Add swarmer-specific details over the top
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const w = this.radius;
        const h = this.radius * 3;
        // Draw "pods" on the side
        ctx.fillStyle = '#1e6a21';
        ctx.fillRect(-w * 0.8, -h * 0.2, w * 0.3, h * 0.4);
        ctx.fillRect(w * 0.5, -h * 0.2, w * 0.3, h * 0.4);
        ctx.restore();
    }
}


// A rocket that splits into multiple standard rockets
export class MirvRocket extends Rocket {
    constructor(width, height, sizeMultiplier = 1, speedMultiplier = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        this.width = width; this.type = 'mirv'; this.radius = 8 * sizeMultiplier;
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
        const childSizeMultiplier = (this.radius / 8);
        for (let i = 0; i < childCount; i++) {
            const newVx = this.vx + random(-1.5, 1.5); const newVy = this.vy + random(-0.5, 0.5);
            childRockets.push(new BaseRocket(this.x, this.y, newVx, newVy, this.width, childSizeMultiplier, this.speedMultiplier));
        }
        return childRockets;
    }
    // Make MIRV fatter and more menacing
    _drawHead(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius;
        const h = this.radius * 2.5;

        // Body
        ctx.fillStyle = '#adb5bd';
        ctx.beginPath();
        ctx.moveTo(0, -h/2);
        ctx.bezierCurveTo(w, -h/4, w, h/4, 0, h/2);
        ctx.bezierCurveTo(-w, h/4, -w, -h/4, 0, -h/2);
        ctx.fill();

        // Seam lines
        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -h/2);
        ctx.lineTo(0, h/2);
        ctx.stroke();

        // Nose cone
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, -h/2, w/2, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
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