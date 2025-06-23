// ts/state.ts
import { config } from './config';
import { GameState, PlayerData } from './types';

export function createInitialState(playerData: PlayerData): GameState {
    const perks = playerData.unlockedPerks;

    return {
        gameState: 'START_SCREEN',
        difficulty: 'normal',
        score: perks.veteranCommander ? 500 : 0,
        coins: 0,
        currentWave: 0,

        rockets: [],
        interceptors: [],
        particles: [],
        cities: [],
        turrets: [],
        tracerRounds: [],
        homingMines: [],
        empPowerUps: [],
        flares: [],
        artilleryShells: [],
        boss: null,

        flashes: [],
        shockwaves: [],

        bossDefeated: false,
        timeSinceLastRocket: 0,
        waveStartTime: 0,
        empActiveTimer: 0,
        empShockwave: { radius: 0, alpha: 0 },
        screenShake: { intensity: 0, duration: 0 },
        waveRocketSpawn: { count: 0, timer: 0, toSpawn: [] },
        newHighScore: false,

        gameTime: 0,
        fps: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
        showFps: false,
        mouse: { x: 0, y: 0 },
        targetedRocket: null,

        interceptorSpeed: config.initialInterceptorSpeed,
        interceptorBlastRadius: config.initialBlastRadius,
        blastRadiusLevel: 0,
        multishotLevel: 0,
        nukeAvailable: false,
        basesAreArmored: !!perks.advancedFortifications,
        turretFireRateLevel: 0,
        turretRangeLevel: 0,
        homingMinesAvailable: perks.extraMine ? 1 : 0,
        firstUpgradePurchased: false,
        scramblerActive: false,

        playerData: playerData,
        activePerks: perks,
    };
}
