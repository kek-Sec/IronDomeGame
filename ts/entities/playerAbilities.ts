// ts/entities/playerAbilities.ts
import { random } from '../utils';
import * as T from '../types';
import { HiveCarrier } from './bosses';
import { config } from '../config';

export class Interceptor implements T.Interceptor {
    x: number;
    y: number;
    target: T.Rocket | T.Flare | T.HiveCarrier;
    radius: number;
    speed: number;
    blastRadius: number;
    type: 'standard' | 'nuke';
    trail: { x: number; y: number }[] = [];
    isHoming: boolean;
    hasBeenDistracted: boolean = false;
    vx: number;
    vy: number;

    constructor(
        startX: number,
        startY: number,
        target: T.Rocket | T.Flare | T.HiveCarrier,
        speed: number,
        blastRadius: number,
        type: 'standard' | 'nuke' = 'standard'
    ) {
        this.x = startX;
        this.y = startY;
        this.target = target;
        this.radius = type === 'nuke' ? 10 : 3;
        this.speed = speed;
        this.blastRadius = type === 'nuke' ? config.nukeBlastRadius : blastRadius;
        this.type = type;
        this.isHoming = !!target;
        this.vx = 0;
        this.vy = -speed;
    }

    update(rockets: T.Rocket[], flares: T.Flare[], boss: T.HiveCarrier | null): void {
        if (this.isHoming && this.target) {
            const targetIsRocket =
                this.target.type !== 'flare' &&
                this.target.type !== 'hive_carrier' &&
                !rockets.find((r) => r.id === this.target.id);
            const targetIsFlare = this.target.type === 'flare' && !flares.find((f) => f.id === this.target.id);
            const targetIsBoss = this.target.type === 'hive_carrier' && !boss;
            if (targetIsRocket || targetIsFlare || targetIsBoss) {
                this.isHoming = false; // Target is gone
            }
        }

        // Check for flare distraction
        if (this.isHoming && !this.hasBeenDistracted && this.target.type !== 'flare') {
            for (const flare of flares) {
                if (Math.hypot(this.x - flare.x, this.y - flare.y) < config.flareDistractionRadius) {
                    this.target = flare;
                    this.hasBeenDistracted = true;
                    break;
                }
            }
        }

        if (this.isHoming && this.target) {
            const targetX = this.target.x;
            const targetY = this.target.y;
            const angle = Math.atan2(targetY - this.y, targetX - this.x);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 25) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        if (this.trail.length > 0) {
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = this.type === 'nuke' ? `rgba(255, 100, 0, 0.7)` : `rgba(0, 255, 255, 0.5)`;
        ctx.lineWidth = this.type === 'nuke' ? 5 : 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.shadowColor = this.type === 'nuke' ? 'orange' : 'cyan';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

export class Flare implements T.Flare {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    life: number;
    id: number;
    type: string = 'flare';

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = random(-2, 2);
        this.vy = random(-1, 1);
        this.radius = 5;
        this.life = 120;
        this.id = random(0, 1000000);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / 120;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
        ctx.shadowColor = `rgba(255, 215, 0, 1)`;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

export class TracerRound implements T.TracerRound {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    life: number;
    color: string;
    trail: { x: number; y: number }[] = [];
    type: string = 'tracer';

    constructor(startX: number, startY: number, angle: number, speed: number) {
        this.x = startX;
        this.y = startY;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 2;
        this.life = 80; // Increased life to match higher speed
        this.color = 'rgba(255, 100, 0, 1)';
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(ctx: CanvasRenderingContext2D) {
        if (this.trail.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)';
            ctx.lineWidth = this.radius * 2;
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

export class HomingMine implements T.HomingMine {
    x: number;
    y: number;
    vy: number;
    radius: number;
    armingTime: number;
    isArmed: boolean;
    isLaunching: boolean;
    target: T.Rocket | null;
    range: number;
    type: string = 'homing_mine';

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vy = 0;
        this.radius = 8;
        this.armingTime = 120; // 2 seconds to arm
        this.isArmed = false;
        this.isLaunching = false;
        this.target = null;
        this.range = 250;
    }
    update(rockets: T.Rocket[]) {
        if (!this.isArmed) {
            this.armingTime--;
            if (this.armingTime <= 0) {
                this.isArmed = true;
            }
            return false; // Not destroyed
        }
        if (this.isArmed && !this.isLaunching) {
            for (const rocket of rockets) {
                if (Math.hypot(this.x - rocket.x, this.y - rocket.y) < this.range) {
                    this.isLaunching = true;
                    this.vy = -12;
                    return true; // Detonate
                }
            }
        }
        if (this.isLaunching) {
            this.y += this.vy;
            return this.y < this.y - this.range; // Detonate after traveling a certain distance
        }
        return false;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        if (this.isLaunching) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff9800';
            ctx.fill();
            ctx.shadowColor = '#ff9800';
            ctx.shadowBlur = 15;
            ctx.fill();
        } else {
            ctx.fillStyle = '#424242';
            ctx.fillRect(this.x - 10, this.y - 5, 20, 5);
            ctx.beginPath();
            ctx.arc(this.x, this.y - 5, this.radius, Math.PI, 0);
            ctx.fillStyle = '#616161';
            ctx.fill();
            if (this.isArmed && Math.floor(Date.now() / 200) % 2 === 0) {
                ctx.beginPath();
                ctx.arc(this.x, this.y - 8, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#e53935';
                ctx.fill();
                ctx.shadowColor = '#e53935';
                ctx.shadowBlur = 10;
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

export class EMP implements T.EMP {
    x: number;
    y: number;
    radius: number;
    life: number;
    time: number;
    type: string = 'emp';

    constructor(x: number | null, y: number | null, width: number, height: number) {
        this.x = x ?? random(width * 0.2, width * 0.8);
        this.y = y ?? random(height * 0.2, height * 0.6);
        this.radius = 20;
        this.life = 600;
        this.time = 0;
    }
    update() {
        this.life--;
        this.time++;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 150, 255, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + Math.sin(this.time * 0.1) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.stroke();
        ctx.restore();
    }
}
