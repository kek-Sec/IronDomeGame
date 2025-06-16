/**
 * config.js
 * * Contains static configuration data for the game.
 * This includes game settings, points, costs, wave definitions, and difficulty levels.
 */

// Difficulty settings to adjust game balance. (USER'S CHANGES APPLIED)
export const difficultySettings = {
    easy: {
        name: 'Easy',
        initialInterceptors: 30,
        waveDelayMultiplier: 1.25,
        missileSizeMultiplier: 1.5,
    },
    normal: {
        name: 'Normal',
        initialInterceptors: 20,
        waveDelayMultiplier: 1.0,
        missileSizeMultiplier: 1.25,
    },
    hard: {
        name: 'Hard',
        initialInterceptors: 15,
        waveDelayMultiplier: 0.8,
        missileSizeMultiplier: 1.0,
    }
};

// Game settings and balance values
export const config = {
    cityCount: 5,
    initialInterceptorSpeed: 7,    // Base speed before upgrades
    initialBlastRadius: 15,       // Base blast radius before upgrades
    rocketPoints: 100,
    mirvPoints: 300,
    armoredRocketPoints: 250,     // Points for destroying an armored rocket
    maxTurrets: 2,
    turretFireRate: 90, 
    turretRange: 350,
    empSpawnChance: 0.001,        // Chance per frame to spawn an EMP
    empDuration: 300,             // How long the freeze effect lasts in frames
    comboTimeout: 180,            // Time in frames before a combo resets
    maxParticles: 300, // Performance cap for particles
    upgradeCosts: {
        interceptors: 500,
        repairCity: 1000,
        automatedTurret: 2500,
        interceptorSpeed: 750,    // Cost to upgrade speed
        blastRadius: 1200         // Cost to upgrade blast radius
    }
};

// Defines the base composition of enemy rockets for each wave, now including Armored type
export const waveDefinitions = [
    /* Wave 1 */ { standard: 5, mirv: 0, armored: 0, delay: 120 },
    /* Wave 2 */ { standard: 7, mirv: 0, armored: 1, delay: 110 },
    /* Wave 3 */ { standard: 8, mirv: 1, armored: 2, delay: 100 },
    /* Wave 4 */ { standard: 7, mirv: 2, armored: 3, delay: 90 },
    /* Wave 5 */ { standard: 10, mirv: 3, armored: 4, delay: 80 },
    /* Wave 6+ */{ standard: 12, mirv: 4, armored: 5, delay: 70 }
];