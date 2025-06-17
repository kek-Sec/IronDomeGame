import { config } from './config.js';
import { Particle, Flash, Shockwave } from './entities/effects.js';

/**
 * Returns a random number between a min and max value.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random number.
 */
export const random = (min, max) => Math.random() * (max - min) + min;

/**
 * Creates a multi-layered, more satisfying explosion effect.
 * @param {object} state - The game state.
 * @param {number} x - The x coordinate of the explosion.
 * @param {number} y - The y coordinate of the explosion.
 */
export function createAdvancedExplosion(state, x, y) {
    if (state.particles.length > config.maxParticles) return;

    // 1. Core Flash
    state.flashes.push(new Flash(x, y, 40, '255, 255, 255'));

    // 2. Expanding Shockwave
    state.shockwaves.push(new Shockwave(x, y, 60));

    // 3. Debris and Sparks
    for (let i = 0; i < 20; i++) {
        state.particles.push(new Particle(x, y, random(20, 40), 'debris')); // Orange/red debris
    }
    for (let i = 0; i < 15; i++) {
        state.particles.push(new Particle(x, y, random(45, 60), 'spark')); // Yellow/white sparks
    }

    // 4. Screen Shake
    triggerScreenShake(state, 5, 15);
}


/**
 * Triggers a screen shake effect.
 * @param {object} state - The game state.
 * @param {number} intensity - The magnitude of the shake.
 * @param {number} duration - The duration of the shake in frames.
 */
export function triggerScreenShake(state, intensity, duration) {
    if (state.screenShake.duration > 0 && intensity < state.screenShake.intensity) return; // Don't let small shakes override big ones
    state.screenShake.intensity = intensity;
    state.screenShake.duration = duration;
}