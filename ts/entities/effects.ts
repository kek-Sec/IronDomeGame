// ts/entities/effects.ts
import { random } from '../utils';
import { Drawable, Updatable } from '../types';

export class Particle implements Drawable, Updatable {
    x: number;
    y: number;
    radius: number;
    life: number;
    private initialLife: number;
    private color: string;
    private vx: number;
    private vy: number;
    private gravity: number;
    private type: 'debris' | 'spark' | 'smoke';

    constructor(x: number, y: number, color: number | null, type: 'debris' | 'spark' | 'smoke' = 'debris') {
        this.x = x;
        this.y = y;
        this.life = random(60, 100);
        this.initialLife = this.life;
        this.type = type;

        if (this.type === 'smoke') {
            this.radius = random(3, 8);
            this.vy = -random(0.2, 0.5);
            this.vx = random(-0.2, 0.2);
            this.gravity = 0;
            this.color = `rgba(120, 120, 120, 1)`;
        } else {
            this.radius = random(1, 4);
            const angle = random(0, Math.PI * 2);
            const speed = this.type === 'spark' ? random(3, 7) : random(1, 6);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = this.type === 'spark' ? 0.01 : 0.05;
            this.color = `hsla(${color}, 100%, ${random(60, 80)}%, 1)`;
        }
    }

    update(): void {
        this.life--;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        if (this.type === 'smoke') {
            this.radius *= 1.015;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const alpha = Math.max(0, this.life / this.initialLife);
        ctx.beginPath();
        if (this.type === 'spark') {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
            ctx.strokeStyle = this.color.replace('1)', `${alpha})`);
            ctx.lineWidth = this.radius * 0.8;
            ctx.stroke();
        } else {
            const color = this.type === 'smoke' ? this.color.replace('1)', `${alpha * 0.5})`) : this.color.replace('1)', `${alpha})`);
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }
}

export class Flash implements Drawable, Updatable {
    x: number;
    y: number;
    radius: number;
    alpha: number;
    private maxRadius: number;
    private speed: number;
    private color: string;

    constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.radius = 0;
        this.speed = 4;
        this.alpha = 1;
        this.color = color;
    }

    update(): void {
        this.radius += this.maxRadius / this.speed;
        if (this.radius > this.maxRadius) this.radius = this.maxRadius;
        this.alpha -= 1 / this.speed;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${Math.max(0, this.alpha)})`;
        ctx.fill();
    }
}

export class Shockwave implements Drawable, Updatable {
    x: number;
    y: number;
    radius: number;
    alpha: number;
    private maxRadius: number;
    private speed: number;
    private lineWidth: number;

    constructor(x: number, y: number, radius: number) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.radius = 0;
        this.speed = 10;
        this.alpha = 1;
        this.lineWidth = 5;
    }

    update(): void {
        this.radius += this.maxRadius / this.speed;
        this.alpha -= 1 / (this.speed * 1.2);
        this.lineWidth *= 0.95;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, this.alpha)})`;
        ctx.lineWidth = Math.max(0, this.lineWidth);
        ctx.stroke();
    }
}