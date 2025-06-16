/**
 * classes.js
 * * Defines all the object classes used in the game.
 * Each class represents a blueprint for a game entity, such as a rocket or a particle.
 */
import { random } from './utils.js';

// Represents a city to be defended
export class City {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.isDestroyed = false;
    }
    draw(ctx, height) {
        if (this.isDestroyed) {
            ctx.fillStyle = '#4a2a2a'; // Rubble color
            ctx.fillRect(this.x, height - this.height / 3, this.width, this.height / 3);
            return;
        };
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    repair() {
        this.isDestroyed = false;
    }
}

// Base class for all enemy rockets
export class Rocket {
    constructor(startX, startY, targetVx, targetVy, width) {
        this.x = startX ?? random(width * 0.1, width * 0.9);
        this.y = startY ?? 0;
        this.vx = targetVx ?? random(-1, 1);
        this.vy = targetVy ?? random(1.5, 2.5);
        this.radius = 4;
        this.trail = [];
        this.type = 'standard';
        this.color = 'red';
        this.trailColor = 'rgba(255, 77, 77, 0.5)';
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
    }
    draw(ctx) {
        this._drawTrail(ctx);
        this._drawHead(ctx);
    }
    _drawTrail(ctx) {
        if (!this.trail[0]) return;
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    _drawHead(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// A special rocket that splits into multiple smaller rockets
export class MirvRocket extends Rocket {
    constructor(width, height) {
        super(undefined, undefined, undefined, undefined, width);
        this.width = width;
        this.type = 'mirv';
        this.radius = 7;
        this.color = 'magenta';
        this.trailColor = 'rgba(255, 0, 255, 0.5)';
        this.splitHeight = random(height * 0.2, height * 0.5);
        this.hasSplit = false;
    }
    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) {
            this.hasSplit = true;
        }
    }
    // This now returns an array of new rockets to be added by the main game loop
    split() {
        const childRockets = [];
        const childCount = 3;
        for (let i = 0; i < childCount; i++) {
            const newVx = this.vx + random(-1.5, 1.5);
            const newVy = this.vy + random(-0.5, 0.5);
            childRockets.push(new Rocket(this.x, this.y, newVx, newVy, this.width));
        }
        return childRockets;
    }
}

// Represents the player's interceptor missile
export class Interceptor {
    constructor(targetX, targetY, width, height, speed) {
        this.x = width / 2; this.y = height;
        this.targetX = targetX; this.targetY = targetY;
        this.radius = 3;
        this.speed = speed;
        this.trail = [];
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 25) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
    }
    draw(ctx) {
        ctx.beginPath();
        if (this.trail.length > 0) {
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = `rgba(0, 255, 255, 0.5)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Represents a single particle in an explosion effect
export class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.radius = random(1, 4);
        this.life = random(60, 100);
        this.initialLife = this.life;
        this.color = `hsla(${color}, 100%, 70%, 1)`;
        const angle = random(0, Math.PI * 2);
        const speed = random(1, 6);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.05;
    }
    update() {
        this.life--;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
    }
    draw(ctx) {
        const alpha = this.life / this.initialLife;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('1)', `${alpha})`);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
