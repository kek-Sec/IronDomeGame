import { random } from '../utils.js';

// Represents a single particle in an explosion effect
export class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.radius = random(1, 4);
        this.life = random(60, 100); this.initialLife = this.life;
        this.color = `hsla(${color}, 100%, 70%, 1)`;
        const angle = random(0, Math.PI * 2); const speed = random(1, 6);
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.gravity = 0.05;
    }
    update() { this.life--; this.vy += this.gravity; this.x += this.vx; this.y += this.vy; }
    draw(ctx) {
        const alpha = this.life / this.initialLife;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('1)', `${alpha})`);
        ctx.shadowColor = this.color; ctx.shadowBlur = 5;
        ctx.fill(); ctx.shadowBlur = 0;
    }
}