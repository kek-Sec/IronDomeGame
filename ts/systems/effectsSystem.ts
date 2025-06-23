// ts/systems/effectsSystem.ts
import * as T from '../types';
import { random } from '../utils';
import { Particle } from '../entities/effects';

/**
 * Updates the visual state of the EMP shockwave as it expands and fades.
 * @param state The current game state.
 */
export function updateEmpEffects(state: T.GameState): void {
    if (state.empActiveTimer > 0) {
        state.empShockwave.radius += 20;
        state.empShockwave.alpha = Math.max(0, state.empShockwave.alpha - 0.01);
    } else {
        // Reset shockwave when EMP is not active
        if (state.empShockwave.radius !== 0 || state.empShockwave.alpha !== 0) {
            state.empShockwave = { radius: 0, alpha: 0 };
        }
    }
}

/**
 * Creates smoke particles for destroyed cities to give a burning effect.
 * @param state The current game state.
 * @param height The height of the canvas.
 */
export function updateCityEffects(state: T.GameState, height: number): void {
    state.cities.forEach((city) => {
        if (city.isSmoking && Math.random() < 0.03) {
            const smokeX = city.x + random(0, city.width);
            const smokeY = height - random(0, city.height * 0.5);
            state.particles.push(new Particle(smokeX, smokeY, null, 'smoke'));
        }
    });
}
