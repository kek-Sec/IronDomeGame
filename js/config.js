/**
 * config.js
 * * Contains static configuration data for the game.
 * This includes game settings, points, costs, wave definitions, and difficulty levels.
 */

// Difficulty settings to adjust game balance.
export const difficultySettings = {
    easy: {
        name: 'Easy',
        initialInterceptors: 30,
        waveDelayMultiplier: 1.25, // Rockets spawn 25% slower
        missileSizeMultiplier: 1.5, // NEW: Missiles are smaller
    },
    normal: {
        name: 'Normal',
        initialInterceptors: 20,
        waveDelayMultiplier: 1.0,  // Standard spawn rate
        missileSizeMultiplier: 1.25, // NEW: Standard missile size
    },
    hard: {
        name: 'Hard',
        initialInterceptors: 15,
        waveDelayMultiplier: 0.8, // Rockets spawn 20% faster
        missileSizeMultiplier: 1.0, // NEW: Missiles are larger
    }
};

// Game settings and balance values
export const config = {
    cityCount: 5,
    interceptorSpeed: 7,
    rocketPoints: 100,
    mirvPoints: 300,
    maxTurrets: 2,
    turretFireRate: 90, 
    turretRange: 350,
    upgradeCosts: {
        interceptors: 500,
        repairCity: 1000,
        automatedTurret: 2500
    }
};

// Defines the base composition of enemy rockets for each wave
export const waveDefinitions = [
    /* Wave 1 */ { standard: 5, mirv: 0, delay: 120 },
    /* Wave 2 */ { standard: 8, mirv: 1, delay: 110 },
    /* Wave 3 */ { standard: 10, mirv: 2, delay: 100 },
    /* Wave 4 */ { standard: 7, mirv: 4, delay: 90 },
    /* Wave 5 */ { standard: 12, mirv: 5, delay: 80 },
    /* Wave 6+ */{ standard: 15, mirv: 7, delay: 70 }
];
