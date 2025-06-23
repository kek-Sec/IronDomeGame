// ts/entities/rockets/swarmer.ts
import { Rocket } from './base';
import { Drone } from './drone';
import { random } from '../../utils';
import * as T from '../../types';

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
        super.drawHead(ctx);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const w = this.radius;
        const h = this.radius * 3;

        // Draw "pods" on the side
        ctx.fillStyle = '#1e6a21';
        ctx.fillRect(-w * 0.9, -h * 0.2, w * 0.4, h * 0.4);
        ctx.fillRect(w * 0.5, -h * 0.2, w * 0.4, h * 0.4);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(-w * 0.9, -h * 0.2, w * 0.4, h * 0.4);
        ctx.strokeRect(w * 0.5, -h * 0.2, w * 0.4, h * 0.4);
        ctx.restore();
    }
}
