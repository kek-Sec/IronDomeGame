/**
 * state.js
 * * Manages the game's state.
 */
import { config } from './config.js';
import { loadPlayerData } from './saveManager.js';

/**
 * Creates and returns the initial state object for the game.
 * @returns {object} The initial game state.
 */
export function getInitialState() {
    // Load persistent player data
    const playerData = loadPlayerData();
    const perks = playerData.unlockedPerks;

    return {
        // Core Game State
        gameState: 'START_SCREEN',
        difficulty: 'normal',
        score: perks.veteranCommander ? 500 : 0,
        coins: 0, // Set later by main.js based on difficulty
        currentWave: 0,
        interceptorSpeed: config.initialInterceptorSpeed,
        
        // Game Entities
        rockets: [],
        interceptors: [],
        particles: [],
        cities: [],
        turrets: [],
        tracerRounds: [],
        homingMines: [],
        empPowerUps: [],
        flares: [],
        boss: null,
        // NEW: Visual Effects Arrays
        flashes: [],
        shockwaves: [],

        // Flags & Timers
        bossDefeated: false,
        timeSinceLastRocket: 0,
        waveStartTime: 0, // For wave timeout safeguard
        empActiveTimer: 0,
        empShockwave: { radius: 0, alpha: 0 },
        screenShake: { intensity: 0, duration: 0 },
        waveRocketSpawn: { count: 0, timer: 0, toSpawn: [] },
        
        // System & Player Info
        gameTime: 0,
        fps: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
        mouse: { x: 0, y: 0 },
        targetedRocket: null,

        // Upgrades & Perks State
        nukeAvailable: false,
        basesAreArmored: perks.advancedFortifications ? true : false,
        turretFireRateLevel: 0,
        turretRangeLevel: 0,
        homingMinesAvailable: perks.extraMine ? 1 : 0,
        firstUpgradePurchased: false, // For Rapid Deployment perk
        scramblerActive: false, // For Targeting Scrambler upgrade
        multishotLevel: 0,
        
        // Persistent Data Reference
        playerData: playerData, 
        activePerks: perks
    };
}