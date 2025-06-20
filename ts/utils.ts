// ts/utils.ts
import { config } from './config';
import { Particle, Flash, Shockwave } from './entities/effects';
import { GameState } from './types';

export const random = (min: number, max: number): number => Math.random() * (max - min) + min;

export function createAdvancedExplosion(state: GameState, x: number, y: number): void {
    if (state.particles.length > config.maxParticles) return;

    state.flashes.push(new Flash(x, y, 40, '255, 255, 255'));
    state.shockwaves.push(new Shockwave(x, y, 60));

    for (let i = 0; i < 20; i++) {
        state.particles.push(new Particle(x, y, random(20, 40), 'debris'));
    }
    for (let i = 0; i < 15; i++) {
        state.particles.push(new Particle(x, y, random(45, 60), 'spark'));
    }
    triggerScreenShake(state, 5, 15);
}

export function triggerScreenShake(state: GameState, intensity: number, duration: number): void {
    if (state.screenShake.duration > 0 && intensity < state.screenShake.intensity) return;
    state.screenShake.intensity = intensity;
    state.screenShake.duration = duration;
}
