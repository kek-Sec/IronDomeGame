import { config } from '../config.js';
import { random } from '../utils.js';
import { Drone } from './rockets.js';

// Boss Class for Hive Carrier
export class HiveCarrier {
    constructor(width, healthMultiplier = 1) {
        this.name = 'Hive Carrier';
        // Apply health multiplier for scaling difficulty
        this.maxHealth = Math.floor(config.bosses.hiveCarrier.health * healthMultiplier);
        this.health = this.maxHealth;
        this.width = width;
        this.y = 150;
        this.droneSpawnCooldown = 0;
        this.droneSpawnRate = config.bosses.hiveCarrier.droneSpawnRate;
        this.radius = 100; // For collision detection

        // NEW: Randomize spawn position and velocity
        if (Math.random() < 0.5) {
            // Spawn from the left and move right
            this.x = -this.radius;
            this.vx = 0.5; 
        } else {
            // Spawn from the right and move left
            this.x = this.width + this.radius;
            this.vx = -0.5;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }

    update(rockets) {
        this.x += this.vx;

        // Correct boundary detection to allow the boss to enter the screen and turn around correctly.
        if (this.vx > 0 && (this.x + this.radius) > this.width) {
            // If moving right and right edge is past screen width
            this.vx *= -1;
        } else if (this.vx < 0 && (this.x - this.radius) < 0) {
            // If moving left and left edge is past screen left
            this.vx *= -1;
        }

        // Spawn drones periodically
        this.droneSpawnCooldown--;
        if (this.droneSpawnCooldown <= 0) {
            const droneCount = 3;
            for (let i = 0; i < droneCount; i++) {
                const angle = random(Math.PI * 0.25, Math.PI * 0.75); // Downward cone
                const speed = random(2, 4);
                const newVx = Math.cos(angle) * speed;
                const newVy = Math.sin(angle) * speed;
                // Spawn from one of the "bays"
                const spawnX = this.x + random(-this.radius * 0.5, this.radius * 0.5);
                rockets.push(new Drone(spawnX, this.y + 40, newVx, newVy, this.width));
            }
            this.droneSpawnCooldown = this.droneSpawnRate;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#3c4043'; // Dark grey main body
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius, this.y);
        ctx.bezierCurveTo(this.x - this.radius, this.y - 80, this.x + this.radius, this.y - 80, this.x + this.radius, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2a2c2e';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#00ddff';
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y - 40);
        ctx.bezierCurveTo(this.x, this.y - 60, this.x + 20, this.y - 60, this.x + 40, this.y - 40);
        ctx.fill();
        ctx.shadowColor = '#00ddff';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Drone bays
        ctx.fillStyle = '#212121';
        ctx.fillRect(this.x - 60, this.y + 5, 40, 20);
        ctx.fillRect(this.x + 20, this.y + 5, 40, 20);

        ctx.restore();
    }
}