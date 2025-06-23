// ts/entities/rockets/mirv.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

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

    split(): T.Rocket[] {
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

        // Engine Glow & Body
        ctx.fillStyle = 'rgba(255, 100, 255, 0.5)';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, h * 0.4, w, 0, Math.PI, false);
        ctx.fill();
        ctx.shadowBlur = 0;

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