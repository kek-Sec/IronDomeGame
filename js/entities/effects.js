import { random } from '../utils.js';

// Represents a single particle in an explosion effect
export class Particle {
    constructor(x, y, color, type = 'debris') {
        this.x = x; this.y = y; this.radius = random(1, 4);
        this.life = random(60, 100); this.initialLife = this.life;
        this.type = type;

        const angle = random(0, Math.PI * 2);
        const speed = this.type === 'spark' ? random(3, 7) : random(1, 6);
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.color = `hsla(${color}, 100%, ${random(60, 80)}%, 1)`;
        this.gravity = this.type === 'spark' ? 0.01 : 0.05;
    }
    update() { 
        this.life--; 
        this.vy += this.gravity; 
        this.x += this.vx; 
        this.y += this.vy; 
    }
    draw(ctx) {
        const alpha = Math.max(0, this.life / this.initialLife);
        ctx.beginPath();
        if (this.type === 'spark') {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
            ctx.strokeStyle = this.color.replace('1)', `${alpha})`);
            ctx.lineWidth = this.radius * 0.8;
            ctx.stroke();
        } else {
            ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace('1)', `${alpha})`);
            ctx.fill();
        }
    }
}

// Represents the bright core flash of an explosion
export class Flash {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.radius = 0;
        this.speed = 4;
        this.alpha = 1;
        this.color = color;
    }
    update() {
        this.radius += this.maxRadius / this.speed;
        if (this.radius > this.maxRadius) this.radius = this.maxRadius;
        this.alpha -= 1 / this.speed;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${Math.max(0, this.alpha)})`;
        ctx.fill();
    }
}

// Represents an expanding shockwave ring
export class Shockwave {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.radius = 0;
        this.speed = 10;
        this.alpha = 1;
        this.lineWidth = 5;
    }
    update() {
        this.radius += this.maxRadius / this.speed;
        this.alpha -= 1 / (this.speed * 1.2);
        this.lineWidth *= 0.95;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, this.alpha)})`;
        ctx.lineWidth = Math.max(0, this.lineWidth);
        ctx.stroke();
    }
}