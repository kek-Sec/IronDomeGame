// ts/entities/rockets/mirv.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

export class MirvRocket extends Rocket implements T.Rocket {
    width: number;
    hasSplit: boolean = false;
    splitHeight: number;
    speedMultiplier: number;

    constructor(
        width: number,
        height: number,
        sizeMultiplier: number = 1,
        speedMultiplier: number = 1,
        sprite: HTMLImageElement | undefined = undefined
    ) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier, sprite);
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

        if (this.sprite) {
            const w = this.radius * 4; // Increased size from 3
            const h = w * (this.sprite.height / this.sprite.width);
            ctx.drawImage(this.sprite, -w / 2, -h / 2, w, h);
        } else {
            // Fallback procedural drawing
            const w = this.radius;
            const h = this.radius * 2.5;

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
        }

        ctx.restore();
    }
}
