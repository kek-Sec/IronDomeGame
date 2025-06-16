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
        waveDelayMultiplier: 1.25,
        missileSizeMultiplier: 1.5,
        turretFireRateMultiplier: 0.8, // Turrets fire 20% faster
    },
    normal: {
        name: 'Normal',
        initialInterceptors: 20,
        waveDelayMultiplier: 1.0,
        missileSizeMultiplier: 1.25,
        turretFireRateMultiplier: 1.0, // Standard fire rate
    },
    hard: {
        name: 'Hard',
        initialInterceptors: 15,
        waveDelayMultiplier: 0.8,
        missileSizeMultiplier: 1.0,
        turretFireRateMultiplier: 1.25, // Turrets fire 25% slower
    }
};

// Game settings and balance values
export const config = {
    cityCount: 5,
    initialInterceptorSpeed: 7,
    initialBlastRadius: 15,
    rocketPoints: 100,
    mirvPoints: 300,
    armoredRocketPoints: 250,
    maxTurrets: 2,
    turretFireRate: 90, 
    turretRange: 350,
    empSpawnChance: 0.0005, // Made rarer
    empDuration: 300,
    comboTimeout: 180,
    maxParticles: 300,
    upgradeCosts: {
        interceptors: 500,
        repairCity: 1000,
        automatedTurret: 2500,
        interceptorSpeed: 750,
        blastRadius: 1200
    }
};

// Defines the base composition of enemy rockets for each wave
export const waveDefinitions = [
    /* Wave 1 */ { standard: 5, mirv: 0, armored: 0, delay: 120 },
    /* Wave 2 */ { standard: 7, mirv: 0, armored: 1, delay: 110 },
    /* Wave 3 */ { standard: 8, mirv: 1, armored: 2, delay: 100 },
    /* Wave 4 */ { standard: 7, mirv: 2, armored: 3, delay: 90 },
    /* Wave 5 */ { standard: 10, mirv: 3, armored: 4, delay: 80 },
    /* Wave 6+ */{ standard: 12, mirv: 4, armored: 5, delay: 70 }
];