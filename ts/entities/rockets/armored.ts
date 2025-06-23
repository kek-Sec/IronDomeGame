// ts/entities/rockets/armored.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

export class ArmoredRocket extends Rocket implements T.Rocket {
    health: number = 3;
    maxHealth: number = 3;
    private hitFlashTimer: number = 0;

    constructor(width: number, sizeMultiplier: number = 1, speedMultiplier: number = 1, sprite: HTMLImageElement | undefined = undefined) {
        super(
            undefined,
            undefined,
            random(-0.5, 0.5),
            random(1, 1.5),
            width,
            sizeMultiplier * 1.5,
            speedMultiplier * 0.7,
            sprite
        );
        this.type = 'armored';
        this.color = '#c0c0c0';
        this.trailColor = 'rgba(192, 192, 192, 0.5)';
    }

    update(): void {
        super.update();
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer--;
        }
    }

    takeDamage(amount: number): boolean {
        this.health -= amount;
        this.hitFlashTimer = 10;
        return this.health <= 0;
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D): void {
        const barWidth = this.radius * 3;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius * 3.5; // Adjusted position relative to new sprite size
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = healthPercentage > 0.6 ? '#43a047' : healthPercentage > 0.3 ? '#fdd835' : '#e53935';
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.drawTrail(ctx);
        this.drawHead(ctx);
        this.drawHealthBar(ctx);
    }

    protected drawHead(ctx: CanvasRenderingContext2D): void {
        super.drawHead(ctx); // This will draw the sprite from the base class

        // Draw hit flash effect on top of the sprite
        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            const alpha = (this.hitFlashTimer / 10) * 0.8;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.globalCompositeOperation = 'lighter';
            const w = this.radius * 3.5; // Match new base size
            const h = this.sprite ? w * (this.sprite.height / this.sprite.width) : w * 3;
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.restore();
        }
    }
}