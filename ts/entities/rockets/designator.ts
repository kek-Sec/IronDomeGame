// ts/entities/rockets/designator.ts
import { Rocket } from './base';
import { random } from '../../utils';
import { City } from '../structures';
import * as T from '../../types';

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
        speedMultiplier: number = 1,
        sprite: HTMLImageElement | undefined = undefined
    ) {
        super(undefined, 0, 0, 0, width, sizeMultiplier, speedMultiplier, sprite);
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

        if (this.sprite) {
            const w = this.radius * 4.5; // Increased size from 3.5
            const h = w * (this.sprite.height / this.sprite.width);
            ctx.drawImage(this.sprite, -w / 2, -h / 2, w, h);
        } else {
            // Fallback drawing
            const w = this.radius * 2;
            const h = this.radius * 2;

            ctx.fillStyle = '#424242';
            ctx.beginPath();
            ctx.moveTo(-w / 2, -h / 2);
            ctx.lineTo(w / 2, -h / 2);
            ctx.lineTo(w, h / 2);
            ctx.lineTo(-w, h / 2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
