// ts/entities/rockets/stealth.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

export class StealthRocket extends Rocket implements T.Rocket {
    isVisible: boolean = true;

    constructor(
        width: number,
        sizeMultiplier: number = 1,
        speedMultiplier: number = 1,
        sprite: HTMLImageElement | undefined = undefined
    ) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier * 0.8, speedMultiplier * 1.2, sprite);
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

        if (this.sprite) {
            const w = this.radius * 4; // Increased size from 3
            const h = w * (this.sprite.height / this.sprite.width);
            ctx.drawImage(this.sprite, -w / 2, -h / 2, w, h);
        } else {
            // Fallback drawing
            const w = this.radius * 1.2;
            const h = this.radius * 3;
            ctx.fillStyle = '#212529';
            ctx.beginPath();
            ctx.moveTo(0, -h / 2); // Tip
            ctx.lineTo(w, h / 4);
            ctx.lineTo(w / 2, h / 2);
            ctx.lineTo(-w / 2, h / 2);
            ctx.lineTo(-w, h / 4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
