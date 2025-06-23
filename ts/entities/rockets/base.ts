// ts/entities/rockets/base.ts
import { random } from '../../utils';
import * as T from '../../types';

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
    protected sprite: HTMLImageElement | undefined;

    constructor(
        startX: number | undefined,
        startY: number | undefined,
        targetVx: number | undefined,
        targetVy: number | undefined,
        width: number,
        sizeMultiplier: number = 1,
        speedMultiplier: number = 1,
        sprite: HTMLImageElement | undefined = undefined
    ) {
        this.id = random(0, 1000000);
        this.x = startX ?? random(width * 0.1, width * 0.9);
        this.y = startY ?? 0;
        this.vx = (targetVx ?? random(-1, 1)) * speedMultiplier;
        this.vy = (targetVy ?? random(1.5, 2.5)) * speedMultiplier;
        this.radius = 5 * sizeMultiplier;
        this.sprite = sprite;
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

        // If a sprite is provided, draw it. Otherwise, draw the procedural shape.
        if (this.sprite) {
            const w = this.radius * 3.5; // Increased size from 2.5
            const h = w * (this.sprite.height / this.sprite.width);
            ctx.drawImage(this.sprite, -w / 2, -h / 2, w, h);
        } else {
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
        }

        ctx.restore();
    }
}