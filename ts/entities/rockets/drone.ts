// ts/entities/rockets/drone.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

export class Drone extends Rocket implements T.Rocket {

    constructor(
        startX: number,
        startY: number,
        targetVx: number,
        targetVy: number,
        width: number,
        speedMultiplier: number = 1,
        sprite: HTMLImageElement | undefined = undefined
    ) {
        super(startX, startY, targetVx, targetVy, width, 0.6, speedMultiplier * 1.5, sprite);
        this.type = 'drone';
        this.radius = 3;
        this.trailColor = 'rgba(255, 255, 0, 0.5)';
        this.color = 'yellow';
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
            // Fallback drawing
            const r = this.radius;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(0, -r * 2);
            ctx.lineTo(r, r);
            ctx.lineTo(-r, r);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}