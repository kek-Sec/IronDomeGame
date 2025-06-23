// ts/entities/rockets/stealth.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

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
