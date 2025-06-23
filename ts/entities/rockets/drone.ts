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
