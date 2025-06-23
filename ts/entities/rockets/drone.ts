// ts/entities/rockets/drone.ts
import { Rocket } from './base';
import { random } from '../../utils';
import * as T from '../../types';

export class Drone extends Rocket implements T.Rocket {
    constructor(
        startX: number,
        startY: number,
        targetVx: number,
        targetVy: number,
        width: number,
        speedMultiplier: number = 1,
        sprite: HTMLImageElement | undefined = undefined
    ) {
        super(startX, startY, targetVx, targetVy, width, 0.6, speedMultiplier * 1.5, sprite);
        this.type = 'drone';
        this.radius = 3;
        this.trailColor = 'rgba(255, 255, 0, 0.5)';
        this.color = 'yellow';
    }
}