/**
 * state.js
 * * Manages the game's state.
 */
import { config } from './config.js';

/**
 * Creates and returns the initial state object for the game.
 * @returns {object} The initial game state.
 */
export function getInitialState() {
    return {
        gameState: 'START_SCREEN',
        difficulty: 'normal',
        score: 0,
        currentWave: 0,
        interceptorSpeed: config.initialInterceptorSpeed,
        blastRadius: config.initialBlastRadius,
        rockets: [],
        interceptors: [],
        particles: [],
        cities: [],
        turrets: [],
        empPowerUps: [],
        flares: [],
        empActiveTimer: 0,
        empShockwave: { radius: 0, alpha: 0 },
        screenShake: { intensity: 0, duration: 0 },
        waveRocketSpawn: { count: 0, timer: 0, toSpawn: [] },
        gameTime: 0,
        fps: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
        mouse: { x: 0, y: 0 },
        targetedRocket: null,
        nukeAvailable: false,
        basesAreArmored: false,
        turretFireRateLevel: 0,
    };
}