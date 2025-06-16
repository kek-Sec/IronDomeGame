/**
 * config.js
 * * Contains static configuration data for the game.
 * This includes initial game settings, points, costs, and wave definitions.
 * By exporting these values, they can be easily imported and used by other modules.
 */

// Game settings and balance values
export const config = {
    initialInterceptors: 20,
    cityCount: 5,
    interceptorSpeed: 7,
    rocketPoints: 100,
    mirvPoints: 300,
    // Turret properties
    maxTurrets: 2,
    turretFireRate: 90, // Cooldown in frames (90 frames = 1.5s at 60fps)
    turretRange: 350,   // Firing range in pixels
    upgradeCosts: {
        interceptors: 500, // Cost per 5 interceptors
        repairCity: 1000,  // Cost to repair one city
        automatedTurret: 2500 // Cost to build one turret
    }
};

// Defines the composition of enemy rockets for each wave
export const waveDefinitions = [
    /* Wave 1 */ { standard: 5, mirv: 0, delay: 120 },
    /* Wave 2 */ { standard: 8, mirv: 1, delay: 110 },
    /* Wave 3 */ { standard: 10, mirv: 2, delay: 100 },
    /* Wave 4 */ { standard: 7, mirv: 4, delay: 90 },
    /* Wave 5 */ { standard: 12, mirv: 5, delay: 80 },
    /* Wave 6+ */{ standard: 15, mirv: 7, delay: 70 } // This pattern repeats for all subsequent waves
];
