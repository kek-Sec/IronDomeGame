// ts/entities/rockets.ts
import { random } from '../utils';
import { Flare } from './playerAbilities';
import * as T from '../types';
import { City } from './structures';

// Base class for all enemy projectiles
export class Rocket implements T.Rocket {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    type: string = 'standard';
    trail: { x: number; y: number }[] = [];
    life: number = 0;
    protected angle: number = 0;
    protected color: string = 'red';
    protected trailColor: string = 'rgba(255, 100, 100, 0.6)';

    constructor(
        startX: number | undefined,
        startY: number | undefined,
        targetVx: number | undefined,
        targetVy: number | undefined,
        width: number,
        sizeMultiplier: number = 1,
        speedMultiplier: number = 1
    ) {
        this.id = random(0, 1000000);
        this.x = startX ?? random(width * 0.1, width * 0.9);
        this.y = startY ?? 0;
        this.vx = (targetVx ?? random(-1, 1)) * speedMultiplier;
        this.vy = (targetVy ?? random(1.5, 2.5)) * speedMultiplier;
        this.radius = 5 * sizeMultiplier;
    }

    update(...args: any[]): void {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.angle = Math.atan2(this.vy, this.vx) - Math.PI / 2;
        this.life++;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.drawTrail(ctx);
        this.drawHead(ctx);
    }

    protected drawTrail(ctx: CanvasRenderingContext2D): void {
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

    protected drawHead(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius;
        const h = this.radius * 3;

        // Engine Glow
        ctx.fillStyle = 'rgba(255, 200, 150, 0.7)';
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, h * 0.5, w * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Fins
        ctx.fillStyle = '#6c757d';
        ctx.beginPath();
        ctx.moveTo(-w, h * 0.2);
        ctx.lineTo(-w * 1.8, h * 0.5);
        ctx.lineTo(-w, h * 0.5);
        ctx.moveTo(w, h * 0.2);
        ctx.lineTo(w * 1.8, h * 0.5);
        ctx.lineTo(w, h * 0.5);
        ctx.fill();

        // Body
        const gradient = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        gradient.addColorStop(0, '#8d99ae');
        gradient.addColorStop(0.5, '#dee2e6');
        gradient.addColorStop(1, '#8d99ae');
        ctx.fillStyle = gradient;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // Panel line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(0, h / 2);
        ctx.stroke();

        // Nose cone
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.6);
        ctx.lineTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, -h / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// A rocket that requires multiple hits to destroy
export class ArmoredRocket extends Rocket implements T.Rocket {
    health: number = 3;
    maxHealth: number = 3;
    private hitFlashTimer: number = 0;

    constructor(width: number, sizeMultiplier: number = 1, speedMultiplier: number = 1) {
        super(
            undefined,
            undefined,
            random(-0.5, 0.5),
            random(1, 1.5),
            width,
            sizeMultiplier * 1.5,
            speedMultiplier * 0.7
        );
        this.type = 'armored';
        this.color = '#c0c0c0';
        this.trailColor = 'rgba(192, 192, 192, 0.5)';
    }
    update(): void {
        super.update();
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer--;
        }
    }
    takeDamage(amount: number): boolean {
        this.health -= amount;
        this.hitFlashTimer = 10; // Activate flash on hit
        return this.health <= 0;
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D): void {
        const barWidth = this.radius * 3;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius * 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = healthPercentage > 0.6 ? '#43a047' : healthPercentage > 0.3 ? '#fdd835' : '#e53935';
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.drawTrail(ctx);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius;
        const h = this.radius * 3;

        // Base rocket body (drawn again for layering)
        super.drawHead(ctx);

        // Armor Plating
        ctx.fillStyle = '#495057';
        ctx.fillRect(-w * 0.7, -h * 0.3, w * 1.4, h * 0.6);
        ctx.strokeStyle = '#212529';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w * 0.7, -h * 0.3, w * 1.4, h * 0.6);

        if (this.hitFlashTimer > 0) {
            const alpha = (this.hitFlashTimer / 10) * 0.8;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.restore();
        this.drawHealthBar(ctx);
    }
}

// A rocket that flickers in and out of visibility
export class StealthRocket extends Rocket implements T.Rocket {
    isVisible: boolean = true;
    constructor(width: number, sizeMultiplier: number = 1, speedMultiplier: number = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier * 0.8, speedMultiplier * 1.2);
        this.type = 'stealth';
        this.color = '#ae00ff';
        this.trailColor = 'rgba(174, 0, 255, 0.4)';
    }
    update() {
        super.update();
        if (this.life % 45 === 0) {
            this.isVisible = !this.isVisible;
        }
    }
    draw(ctx: CanvasRenderingContext2D) {
        if (this.isVisible) {
            this.drawTrail(ctx);
            this.drawHead(ctx);
        } else {
            // Draw a faint distortion effect when cloaked
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            const w = this.radius;
            const h = this.radius * 3;
            ctx.strokeStyle = 'rgba(200, 200, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(-w / 2, -h / 2, w, h);
            ctx.restore();
        }
    }
    protected drawHead(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius * 1.2;
        const h = this.radius * 3;

        // Angled body
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.moveTo(0, -h / 2); // Tip
        ctx.lineTo(w, h / 4);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(-w / 2, h / 2);
        ctx.lineTo(-w, h / 4);
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
export class Drone extends Rocket implements T.Rocket {
    constructor(
        startX: number,
        startY: number,
        targetVx: number,
        targetVy: number,
        width: number,
        speedMultiplier: number = 1
    ) {
        super(startX, startY, targetVx, targetVy, width, 0.6, speedMultiplier * 1.5);
        this.type = 'drone';
        this.radius = 3;
        this.trailColor = 'rgba(255, 255, 0, 0.5)';
        this.color = 'yellow';
    }
    protected drawHead(ctx: CanvasRenderingContext2D) {
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
        ctx.arc(0, r * 0.5, r / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// A rocket that splits into a swarm of Drones
export class SwarmerRocket extends Rocket implements T.Rocket {
    width: number;
    hasSplit: boolean = false;
    splitHeight: number;
    speedMultiplier: number;
    constructor(width: number, height: number, sizeMultiplier: number = 1, speedMultiplier: number = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier * 1.5, speedMultiplier * 0.8);
        this.width = width;
        this.type = 'swarmer';
        this.radius *= 1.2;
        this.color = '#32cd32';
        this.trailColor = 'rgba(50, 205, 50, 0.5)';
        this.splitHeight = random(height * 0.3, height * 0.6);
        this.speedMultiplier = speedMultiplier;
    }
    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) {
            this.hasSplit = true;
        }
    }
    split(): T.Rocket[] {
        const childDrones: T.Rocket[] = [];
        const childCount = 6;
        for (let i = 0; i < childCount; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(1, 3);
            const newVx = Math.cos(angle) * speed;
            const newVy = Math.sin(angle) * speed;
            childDrones.push(new Drone(this.x, this.y, newVx, newVy, this.width, this.speedMultiplier));
        }
        return childDrones;
    }
    protected drawHead(ctx: CanvasRenderingContext2D) {
        // Use the standard rocket draw as a base
        super.drawHead(ctx);

        // Add swarmer-specific details over the top
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const w = this.radius;
        const h = this.radius * 3;

        // Draw "pods" on the side that look like they hold drones
        ctx.fillStyle = '#1e6a21';
        ctx.fillRect(-w * 0.9, -h * 0.2, w * 0.4, h * 0.4);
        ctx.fillRect(w * 0.5, -h * 0.2, w * 0.4, h * 0.4);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(-w * 0.9, -h * 0.2, w * 0.4, h * 0.4);
        ctx.strokeRect(w * 0.5, -h * 0.2, w * 0.4, h * 0.4);
        ctx.restore();
    }
}

// A rocket that splits into multiple standard rockets
export class MirvRocket extends Rocket implements T.Rocket {
    width: number;
    hasSplit: boolean = false;
    splitHeight: number;
    speedMultiplier: number;
    constructor(width: number, height: number, sizeMultiplier: number = 1, speedMultiplier: number = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        this.width = width;
        this.type = 'mirv';
        this.radius = 8 * sizeMultiplier;
        this.color = 'magenta';
        this.trailColor = 'rgba(255, 0, 255, 0.5)';
        this.splitHeight = random(height * 0.2, height * 0.5);
        this.speedMultiplier = speedMultiplier;
    }
    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) {
            this.hasSplit = true;
        }
    }
    split() {
        const childRockets: T.Rocket[] = [];
        const childCount = 3;
        const childSizeMultiplier = this.radius / 8;
        for (let i = 0; i < childCount; i++) {
            const newVx = this.vx + random(-1.5, 1.5);
            const newVy = this.vy + random(-0.5, 0.5);
            childRockets.push(
                new Rocket(this.x, this.y, newVx, newVy, this.width, childSizeMultiplier, this.speedMultiplier)
            );
        }
        return childRockets;
    }
    protected drawHead(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius;
        const h = this.radius * 2.5;

        // Engine Glow
        ctx.fillStyle = 'rgba(255, 100, 255, 0.5)';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, h * 0.4, w, 0, Math.PI, false);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Body
        const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        bodyGrad.addColorStop(0, '#555');
        bodyGrad.addColorStop(1, '#333');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.bezierCurveTo(w, -h / 4, w, h / 4, 0, h / 2);
        ctx.bezierCurveTo(-w, h / 4, -w, -h / 4, 0, -h / 2);
        ctx.fill();

        // Seam lines to suggest it splits
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(0, h / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.8, h * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Nose cone
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, -h / 2, w / 1.5, Math.PI * 0.9, Math.PI * 0.1, true);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// A rocket that deploys flares to act as decoys
export class FlareRocket extends Rocket implements T.Rocket {
    flareCooldown: number = 0;
    flareDeployInterval: number = 90;
    constructor(width: number, sizeMultiplier: number = 1, speedMultiplier: number = 1) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        this.type = 'flare_rocket';
        this.color = '#00ced1';
        this.trailColor = 'rgba(0, 206, 209, 0.5)';
    }
    update(flares: Flare[]) {
        super.update();
        this.flareCooldown--;
        if (this.flareCooldown <= 0 && flares) {
            flares.push(new Flare(this.x, this.y));
            this.flareCooldown = this.flareDeployInterval;
        }
    }
    protected drawHead(ctx: CanvasRenderingContext2D): void {
        super.drawHead(ctx);
        // Add flare pods
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const w = this.radius;
        const h = this.radius * 3;
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-w * 0.4, h * 0.1, w * 0.8, h * 0.3);
        ctx.restore();
    }
}

// A rocket that calls in a strike instead of impacting
export class ArtilleryDesignator extends Rocket implements T.Rocket {
    targetCity: City | null;
    targetX: number = 0;
    targetY: number = 0;
    isDesignating: boolean = false;
    designationTimer: number = 0;
    designationDuration: number = 180; // 3 seconds at 60fps
    constructor(
        width: number,
        height: number,
        cities: T.City[],
        sizeMultiplier: number = 1,
        speedMultiplier: number = 1
    ) {
        super(undefined, 0, 0, 0, width, sizeMultiplier, speedMultiplier);
        this.type = 'designator';
        this.color = '#ff9800';
        this.trailColor = 'rgba(255, 152, 0, 0.5)';

        const availableCities = cities.filter((c) => !c.isDestroyed);
        this.targetCity =
            availableCities.length > 0
                ? (availableCities[Math.floor(random(0, availableCities.length))] as City)
                : null;

        if (this.targetCity) {
            this.targetX = this.targetCity.x + this.targetCity.width / 2;
            this.targetY = height * random(0.3, 0.5);
            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            const speed = 1.5 * speedMultiplier;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            this.vx = 0;
            this.vy = 1.5 * speedMultiplier;
        }
    }

    update() {
        if (!this.targetCity) {
            super.update();
            return;
        }

        if (this.isDesignating) {
            this.designationTimer++;
        } else {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 20) this.trail.shift();

            if (this.y >= this.targetY) {
                this.isDesignating = true;
                this.vx = 0;
                this.vy = 0;
            } else {
                this.x += this.vx;
                this.y += this.vy;
            }
            this.angle = Math.atan2(this.vy, this.vx) - Math.PI / 2;
        }
    }

    private drawTargetingLaser(ctx: CanvasRenderingContext2D) {
        if (!this.targetCity) return;

        const progress = this.designationTimer / this.designationDuration;
        const beamColor = `rgba(255, 0, 0, ${0.2 + progress * 0.6})`;
        const beamWidth = 1 + progress * 4;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.targetCity.x + this.targetCity.width / 2, this.targetCity.y);
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = beamWidth;
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const circleRadius = (this.targetCity.width / 2) * (1 - progress);
        ctx.beginPath();
        ctx.arc(
            this.targetCity.x + this.targetCity.width / 2,
            this.targetCity.y + this.targetCity.height / 2,
            circleRadius,
            0,
            Math.PI * 2
        );
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + progress * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.drawTrail(ctx);
        this.drawHead(ctx);

        if (this.isDesignating) {
            this.drawTargetingLaser(ctx);
        }
    }

    protected drawHead(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const w = this.radius * 2; // Wider drone
        const h = this.radius * 2;

        // Body
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, -h / 2);
        ctx.lineTo(w, h / 2);
        ctx.lineTo(-w, h / 2);
        ctx.closePath();
        ctx.fill();

        // Optics
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, w / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// A simple class for the visual and impact logic of the artillery
export class ArtilleryShell implements T.ArtilleryShell {
    targetX: number;
    targetY: number;
    timeLeft: number = 30; // 0.5 seconds travel time
    startY: number = 0;
    startX: number;
    constructor(targetX: number, targetY: number) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.startX = targetX + random(-50, 50);
    }
    update() {
        this.timeLeft--;
        return this.timeLeft <= 0;
    }
    draw(ctx: CanvasRenderingContext2D) {
        const progress = 1 - this.timeLeft / 30;

        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.targetX, this.targetY);

        const gradient = ctx.createLinearGradient(this.startX, this.startY, this.targetX, this.targetY);

        // Clamp the gradient stops to be within the valid [0, 1] range.
        const stop1 = Math.max(0, progress - 0.05);
        const stop2 = progress;
        const stop3 = Math.min(1, progress + 0.05);

        gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
        gradient.addColorStop(stop1, 'rgba(255, 100, 0, 0)');
        gradient.addColorStop(stop2, 'white');
        gradient.addColorStop(stop3, 'rgba(255, 100, 0, 0)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}
