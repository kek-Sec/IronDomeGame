// ts/entities/rockets/armored.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

export class ArmoredRocket extends Rocket implements T.Rocket {
    health: number = 3;
    maxHealth: number = 3;
    private hitFlashTimer: number = 0;

    constructor(width: number, sizeMultiplier: number = 1, speedMultiplier: number = 1) {
        super(undefined, undefined, random(-0.5, 0.5), random(1, 1.5), width, sizeMultiplier * 1.5, speedMultiplier * 0.7);
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
        const barY = this.y - this.radius * 3;
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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        super.drawHead(ctx); // Draw base rocket
        
        // Armor Plating
        const w = this.radius;
        const h = this.radius * 3;
        ctx.fillStyle = '#495057';
        ctx.fillRect(-w * 0.7, -h * 0.3, w * 1.4, h * 0.6);
        ctx.strokeStyle = '#212529';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w * 0.7, -h * 0.3, w * 1.4, h * 0.6);

        if (this.hitFlashTimer > 0) {
            const alpha = (this.hitFlashTimer / 10) * 0.8;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.restore();
        this.drawHealthBar(ctx);
    }
}