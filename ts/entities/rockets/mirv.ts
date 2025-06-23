// ts/entities/rockets/mirv.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

export class MirvRocket extends Rocket implements T.Rocket {
    width: number;
    hasSplit: boolean = false;
    splitHeight: number;
    speedMultiplier: number;

    constructor(width: number, height: number, sizeMultiplier: number = 1, speedMultiplier: number = 1, sprite: HTMLImageElement | undefined = undefined) {
        super(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier, sprite);
        this.width = width;
        this.type = 'mirv';
        this.radius = 8 * sizeMultiplier;
        this.color = 'magenta';
        this.trailColor = 'rgba(255, 0, 255, 0.5)';
        this.splitHeight = random(height * 0.2, height * 0.5);
        this.speedMultiplier = speedMultiplier;
    }

    update() {
        super.update();
        if (this.y > this.splitHeight && !this.hasSplit) {
            this.hasSplit = true;
        }
    }

    split(): T.Rocket[] {
        const childRockets: T.Rocket[] = [];
        const childCount = 3;
        const childSizeMultiplier = this.radius / 8;
        for (let i = 0; i < childCount; i++) {
            const newVx = this.vx + random(-1.5, 1.5);
            const newVy = this.vy + random(-0.5, 0.5);
            childRockets.push(
                new Rocket(this.x, this.y, newVx, newVy, this.width, childSizeMultiplier, this.speedMultiplier)
            );
        }
        return childRockets;
    }
}