import { random } from '../utils.js';
import { TracerRound } from './playerAbilities.js';

// Represents a city/base to be defended
export class City {
    constructor(x, y, w, h, isArmored = false) {
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.isDestroyed = false;
        this.structureType = Math.floor(random(0, 3));
        this.isArmored = isArmored;
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

// Represents an automated defense turret (C-RAM)
export class AutomatedTurret {
    constructor(x, y, range, fireRate) {
        this.x = x;
        this.y = y;
        this.range = range;
        this.fireRate = fireRate; // Now used as cooldown between targets
        this.fireCooldown = 0;
        this.angle = -Math.PI / 2;
        this.radarAngle = 0;
        this.currentTarget = null;
        this.isFiring = false;
        this.shotTimer = 0;
        this.delayBetweenShots = 2; // Fires much faster
    }

    update(rockets) {
        const tracerSpeed = 25; // Faster projectiles
        const newTracers = [];
        if (this.fireCooldown > 0) this.fireCooldown--;

        // Target validation: Check if current target is still valid
        if (this.currentTarget) {
            const targetExists = rockets.some(r => r.id === this.currentTarget.id);
            const targetInRange = targetExists && Math.hypot(this.x - this.currentTarget.x, this.y - this.currentTarget.y) < this.range;
            if (!targetExists || !targetInRange) {
                this.currentTarget = null; // Target is gone, find a new one
                this.isFiring = false;
            }
        }

        // Target acquisition: If no target, find one
        if (!this.currentTarget && this.fireCooldown <= 0) {
            this.isFiring = false;
            this.currentTarget = this.findTarget(rockets);
            if(this.currentTarget) {
                this.fireCooldown = this.fireRate; // Cooldown before switching to another target
            }
        }

        // Firing logic
        if (this.currentTarget) {
            // Predictive Targeting
            const dist = Math.hypot(this.x - this.currentTarget.x, this.y - this.currentTarget.y);
            const timeToImpact = dist / tracerSpeed;
            const predictedX = this.currentTarget.x + this.currentTarget.vx * timeToImpact;
            const predictedY = this.currentTarget.y + this.currentTarget.vy * timeToImpact;

            // Aim at the predicted position
            this.angle = Math.atan2(predictedY - this.y, predictedX - this.x);
            
            this.isFiring = true;
            this.shotTimer++;
            if (this.shotTimer % this.delayBetweenShots === 0) {
                // Add slight inaccuracy
                const fireAngle = this.angle + (random(-0.5, 0.5) * 0.02);
                newTracers.push(new TracerRound(this.x, this.y, fireAngle, tracerSpeed));
            }
        } else {
            // If no target, scan with radar
            this.radarAngle += 0.02;
        }

        return newTracers;
    }

    findTarget(rockets) {
        const inRange = rockets.filter(r => Math.hypot(this.x - r.x, this.y - r.y) < this.range && r.y < this.y);
        if (inRange.length === 0) return null;

        // Prioritize more dangerous rockets
        const highPriority = inRange.filter(r => r.type === 'swarmer' || r.type === 'stealth' || r.type === 'mirv' || r.type === 'flare' || r.type === 'armored');
        if (highPriority.length > 0) {
             return highPriority.sort((a, b) => a.y - b.y)[0]; // Target the highest one
        }

        // Otherwise, target the closest one
        return inRange.reduce((closest, current) => {
            const closestDist = Math.hypot(this.x - closest.x, this.y - closest.y);
            const currentDist = Math.hypot(this.x - current.x, this.y - current.y);
            return currentDist < closestDist ? current : closest;
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Base
        ctx.fillStyle = '#6c757d';
        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(15, 10);
        ctx.lineTo(10, 0);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();

        // Radar dish (scans when not firing)
        if (!this.isFiring) {
            ctx.save();
            ctx.rotate(this.radarAngle);
            ctx.fillStyle = '#adb5bd';
            ctx.fillRect(0, -1.5, 15, 3);
            ctx.restore();
        }

        // Rotate turret assembly
        ctx.rotate(this.angle);

        // Muzzle flash (more intense)
        if (this.isFiring) {
            ctx.fillStyle = `rgba(255, ${random(180,220)}, 0, ${random(0.5,1)})`;
            ctx.beginPath();
            const flashLength = random(20, 40);
            const flashWidth = random(8, 12);
            ctx.moveTo(20, 0);
            ctx.lineTo(20 + flashLength, -flashWidth / 2);
            ctx.lineTo(20 + flashLength, flashWidth / 2);
            ctx.closePath();
            ctx.fill();
        }

        // Gun barrel
        ctx.fillStyle = '#495057';
        ctx.fillRect(0, -4, 25, 8);

        // Turret pivot
        ctx.fillStyle = '#00ddff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}