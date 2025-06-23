// ts/entities/rockets/flare.ts
import { Rocket } from './base';
import { Flare } from '../playerAbilities';
import * as T from '../../types';

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
