import { config } from './config.js';
import { Particle } from './entities/effects.js';

/**
 * Returns a random number between a min and max value.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random number.
 */
export const random = (min, max) => Math.random() * (max - min) + min;

/**
 * Creates explosion particles at a given location.
 * @param {object} state - The game state.
 * @param {number} x - The x coordinate of the explosion.
 * @param {number} y - The y coordinate of the explosion.
 * @param {number} count - The number of particles to create.
 * @param {number} baseColor - The base hue for the particle colors.
 */
export function createExplosion(state, x, y, count, baseColor) {
    if (state.particles.length > config.maxParticles) return;
    for (let i = 0; i < count; i++) {
        state.particles.push(new Particle(x, y, baseColor + random(-20, 20)));
    }
}

/**
 * Triggers a screen shake effect.
 * @param {object} state - The game state.
 * @param {number} intensity - The magnitude of the shake.
 * @param {number} duration - The duration of the shake in frames.
 */
export function triggerScreenShake(state, intensity, duration) {
    state.screenShake.intensity = intensity;
    state.screenShake.duration = duration;
}