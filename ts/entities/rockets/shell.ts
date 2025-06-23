// ts/entities/rockets/shell.ts
import { random } from '../../utils';
import * as T from '../../types';

export class ArtilleryShell implements T.ArtilleryShell {
    targetX: number;
    targetY: number;
    timeLeft: number = 30; // 0.5 seconds travel time
    startY: number = 0;
    startX: number;
    private sprite: HTMLImageElement | undefined;

    constructor(targetX: number, targetY: number, sprite: HTMLImageElement | undefined = undefined) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.startX = targetX + random(-50, 50);
        this.sprite = sprite;
    }

    update() {
        this.timeLeft--;
        return this.timeLeft <= 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const progress = 1 - this.timeLeft / 30;
        const currentX = this.startX + (this.targetX - this.startX) * progress;
        const currentY = this.startY + (this.targetY - this.startY) * progress;

        if (this.sprite) {
            ctx.save();
            ctx.translate(currentX, currentY);
            // Angle the shell to point towards its destination
            const angle = Math.atan2(this.targetY - this.startY, this.targetX - this.startX) - Math.PI / 2;
            ctx.rotate(angle);
            const w = 20; // Fixed size for shell sprite
            const h = w * (this.sprite.height / this.sprite.width);
            ctx.drawImage(this.sprite, -w / 2, -h/2, w, h);
            ctx.restore();
        } else {
            // Fallback drawing
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.targetX, this.targetY);

            const gradient = ctx.createLinearGradient(this.startX, this.startY, this.targetX, this.targetY);
            const stop1 = Math.max(0, progress - 0.05);
            const stop2 = progress;
            const stop3 = Math.min(1, progress + 0.05);

            gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
            gradient.addColorStop(stop1, 'rgba(255, 100, 0, 0)');
            gradient.addColorStop(stop2, 'white');
            gradient.addColorStop(stop3, 'rgba(255, 100, 0, 0)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }
}