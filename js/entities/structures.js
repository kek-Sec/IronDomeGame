import { random } from '../utils.js';
import { TracerRound } from './playerAbilities.js';

// Represents a city/base to be defended
export class City {
    constructor(x, y, w, h, isArmored = false) {
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.isDestroyed = false;
        this.structureType = Math.floor(random(0, 3));
        this.isArmored = isArmored;
        this.rubbleShape = null; // To hold the static shape of the rubble
        this.isSmoking = false; // To trigger the smoke effect
    }
    draw(ctx, height) {
        ctx.save();
        if (this.isDestroyed) {
            this.drawRubble(ctx, height);
        } else {
            // Draw the structure based on its type
            switch (this.structureType) {
                case 0: this.drawBunker(ctx); break;
                case 1: this.drawDome(ctx, height); break;
                case 2: this.drawCommsTower(ctx); break;
            }
            // Draw the energy shield if armored
            if (this.isArmored) {
                this.drawEnergyShield(ctx);
            }
        }
        ctx.restore();
    }

    drawBunker(ctx) {
        const h = this.height * 0.7;
        const y = this.y + (this.height - h);
        
        // Main structure with gradient
        const gradient = ctx.createLinearGradient(this.x, y, this.x, y + h);
        gradient.addColorStop(0, '#8d99ae');
        gradient.addColorStop(1, '#6c757d');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, y, this.width, h);

        // Details - vents, panels
        ctx.fillStyle = '#343a40';
        ctx.fillRect(this.x + this.width * 0.1, y + h * 0.2, this.width * 0.8, h * 0.1);
        ctx.fillRect(this.x + this.width * 0.3, y + h * 0.5, this.width * 0.4, h * 0.15);
        
        // Border
        ctx.strokeStyle = '#212529';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, y, this.width, h);
    }

    drawDome(ctx, height) {
        const centerX = this.x + this.width / 2;
        const radius = this.width / 1.8;

        // Dome structure with a glowing gradient
        ctx.beginPath();
        ctx.arc(centerX, height, radius, Math.PI, 0);
        const gradient = ctx.createRadialGradient(centerX, height - radius * 0.5, radius * 0.2, centerX, height, radius);
        gradient.addColorStop(0, 'rgba(173, 216, 230, 0.8)'); // Light blue center
        gradient.addColorStop(0.7, 'rgba(0, 191, 255, 0.6)');   // Deep sky blue
        gradient.addColorStop(1, 'rgba(70, 130, 180, 0.3)');    // Steel blue transparent
        ctx.fillStyle = gradient;
        ctx.fill();

        // Geodesic pattern
        ctx.save();
        ctx.strokeStyle = 'rgba(173, 216, 230, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 7; i++) {
            // Vertical lines
            ctx.moveTo(centerX + (i * radius / 4) - radius, height);
            ctx.lineTo(centerX + (i * radius / 4) - radius, height - 100);
            ctx.moveTo(centerX - (i * radius / 4) + radius, height);
            ctx.lineTo(centerX - (i * radius / 4) + radius, height - 100);
            // Diagonal lines
            ctx.moveTo(this.x, height);
            ctx.lineTo(this.x + this.width, height - 20 * i);
            ctx.moveTo(this.x + this.width, height);
            ctx.lineTo(this.x, height - 20 * i);
        }
        ctx.clip(); // Clip the lines to the dome shape
        ctx.stroke();
        ctx.restore();
    }

    drawCommsTower(ctx) {
        const towerWidth = this.width * 0.2;
        const towerX = this.x + (this.width - towerWidth) / 2;
        
        // Main mast with gradient
        const gradient = ctx.createLinearGradient(towerX, this.y, towerX + towerWidth, this.y);
        gradient.addColorStop(0, '#adb5bd');
        gradient.addColorStop(0.5, '#f8f9fa');
        gradient.addColorStop(1, '#adb5bd');
        ctx.fillStyle = gradient;
        ctx.fillRect(towerX, this.y, towerWidth, this.height);

        // Antenna segments
        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const segY = this.y + this.height * (0.2 * i);
            ctx.strokeRect(towerX - towerWidth * 0.5, segY, towerWidth * 2, 2);
        }

        // Blinking light and dish
        const dishY = this.y + 10;
        ctx.beginPath();
        ctx.arc(towerX + towerWidth / 2, dishY, towerWidth * 1.5, Math.PI * 1.2, Math.PI * 1.8);
        ctx.strokeStyle = '#e9ecef';
        ctx.stroke();

        if (Math.random() > 0.5) {
            ctx.fillStyle = '#ff4d4d';
            ctx.shadowColor = '#ff4d4d';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(towerX + towerWidth / 2, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawEnergyShield(ctx) {
        ctx.save();
        const shieldPadding = 8;
        const shieldX = this.x - shieldPadding;
        const shieldY = this.y - shieldPadding;
        const shieldW = this.width + shieldPadding * 2;
        const shieldH = this.height + shieldPadding;
        
        // Create a shimmering effect with multiple layers
        const layers = 3;
        for (let i = 0; i < layers; i++) {
            ctx.beginPath();
            ctx.rect(shieldX - i, shieldY - i, shieldW + i*2, shieldH + i*2);
            ctx.lineWidth = 1 + i;
            ctx.strokeStyle = `rgba(0, 221, 255, ${0.4 - i * 0.1})`;
            ctx.shadowColor = 'cyan';
            ctx.shadowBlur = 10 + i * 2;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawRubble(ctx, height) {
        if (!this.rubbleShape) return;

        this.rubbleShape.forEach(shape => {
            ctx.fillStyle = shape.color;
            const x = this.x + shape.xOffset;
            const y = height - shape.h - shape.yOffset;
            
            ctx.beginPath();
            ctx.moveTo(x + shape.points[0].x * shape.w, y + shape.points[0].y * shape.h);
            for(let i = 1; i < shape.points.length; i++) {
                ctx.lineTo(x + shape.points[i].x * shape.w, y + shape.points[i].y * shape.h);
            }
            ctx.closePath();
            ctx.fill();
        });
    }

    destroy() {
        this.isDestroyed = true;
        this.isSmoking = true;
        this.rubbleShape = []; // Initialize the array
        const rubbleColors = ['#495057', '#343a40', '#6c757d', '#5a5a5a'];

        for (let i = 0; i < 8; i++) {
            this.rubbleShape.push({
                w: random(this.width * 0.2, this.width * 0.6),
                h: random(this.height * 0.1, this.height * 0.5),
                xOffset: random(0, this.width * 0.4),
                yOffset: random(-this.height * 0.1, this.height * 0.2),
                color: rubbleColors[i % rubbleColors.length],
                points: [ // Pre-calculate jagged points for a static shape
                    {x: 0, y: 1}, {x: random(0.1, 0.3), y: random(0.1, 0.3)},
                    {x: random(0.7, 0.9), y: random(0.1, 0.3)}, {x: 1, y: 1}
                ]
            });
        }
    }

    repair() { 
        this.isDestroyed = false; 
        this.isSmoking = false;
        this.rubbleShape = null;
    }
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