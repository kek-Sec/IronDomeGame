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
        turretFireRateMultiplier: 0.8,
    },
    normal: {
        name: 'Normal',
        initialInterceptors: 20,
        waveDelayMultiplier: 1.0,
        missileSizeMultiplier: 1.25,
        turretFireRateMultiplier: 1.0,
    },
    hard: {
        name: 'Hard',
        initialInterceptors: 15,
        waveDelayMultiplier: 0.8,
        missileSizeMultiplier: 1.0,
        turretFireRateMultiplier: 1.25,
    }
};

// Game settings and balance values
export const config = {
    cityCount: 5,
    initialInterceptorSpeed: 7,
    initialBlastRadius: 15,
    rocketPoints: 100,
    mirvPoints: 200,
    stealthPoints: 300,   // Points for stealth rockets
    swarmerPoints: 150,   // Points for the main swarmer
    dronePoints: 25,      // Points per small drone
    maxTurrets: 2,
    turretFireRate: 90, 
    turretRange: 350,
    empSpawnChance: 0.0005,
    empDuration: 300,
    maxParticles: 300,
    upgradeCosts: {
        interceptors: 500,
        repairCity: 1000,
        automatedTurret: 2500,
        interceptorSpeed: 750,
        blastRadius: 1200
    }
};

// Defines the base composition of enemy rockets for each wave with new types
export const waveDefinitions = [
    /* Wave 1 */ { standard: 6, mirv: 0, stealth: 0, swarmer: 0, delay: 120 },
    /* Wave 2 */ { standard: 8, mirv: 1, stealth: 0, swarmer: 0, delay: 115 },
    /* Wave 3 */ { standard: 10, mirv: 0, stealth: 1, swarmer: 0, delay: 110 },
    /* Wave 4 */ { standard: 8, mirv: 2, stealth: 0, swarmer: 1, delay: 100 },
    /* Wave 5 */ { standard: 10, mirv: 1, stealth: 2, swarmer: 1, delay: 95 },
    /* Wave 6 */ { standard: 5, mirv: 3, stealth: 1, swarmer: 2, delay: 90 },
    /* Wave 7+ */{ standard: 8, mirv: 2, stealth: 2, swarmer: 2, delay: 85 }
];