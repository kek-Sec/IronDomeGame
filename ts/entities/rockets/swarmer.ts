// ts/entities/rockets/swarmer.ts
import { Rocket } from './base';
import { Drone } from './drone';
import { random } from '../../utils';
import * as T from '../../types';
import { loadedSprites } from '../../assetLoader';

export class SwarmerRocket extends Rocket implements T.Rocket {
    width: number;
    hasSplit: boolean = false;
    splitHeight: number;
    speedMultiplier: number;

    constructor(width: number, height: number, sizeMultiplier: number = 1, speedMultiplier: number = 1, sprite: HTMLImageElement | undefined = undefined) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier * 1.5, speedMultiplier * 0.8, sprite);
        this.width = width;
        this.type = 'swarmer';
        this.radius *= 1.2;
        this.color = '#32cd32';
        this.trailColor = 'rgba(50, 205, 50, 0.5)';
        this.splitHeight = random(height * 0.3, height * 0.6);
        this.speedMultiplier = speedMultiplier;
    }

    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) {
            this.hasSplit = true;
        }
    }

    split(): T.Rocket[] {
        const childDrones: T.Rocket[] = [];
        const childCount = 6;
        for (let i = 0; i < childCount; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(1, 3);
            const newVx = Math.cos(angle) * speed;
            const newVy = Math.sin(angle) * speed;
            childDrones.push(new Drone(this.x, this.y, newVx, newVy, this.width, this.speedMultiplier, loadedSprites.droneRocket));
        }
        return childDrones;
    }
}