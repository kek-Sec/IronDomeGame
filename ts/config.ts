// ts/config.ts
import { DifficultySetting, WaveDefinition } from './types';

// Difficulty settings to adjust game balance.
export const difficultySettings: Record<string, DifficultySetting> = {
    easy: {
        name: 'Recruit',
        description:
            'A balanced introduction to the battlefield. Enemies are slightly slower and you start with more funding.',
        waveDelayMultiplier: 1.25,
        missileSizeMultiplier: 1.5,
        turretFireRateMultiplier: 0.8,
        enemySpeedBonus: 0.85,
        startingCoins: 250,
    },
    normal: {
        name: 'Veteran',
        description:
            'The standard combat scenario. A true test of your defensive capabilities against a determined foe.',
        waveDelayMultiplier: 1.0,
        missileSizeMultiplier: 1.25,
        turretFireRateMultiplier: 1.0,
        enemySpeedBonus: 1.0,
        startingCoins: 150,
    },
    hard: {
        name: 'Elite',
        description:
            'For seasoned commanders only. The enemy is faster, smarter, and relentless. Expect smaller targets and less time to react.',
        waveDelayMultiplier: 0.6,
        missileSizeMultiplier: 0.9,
        turretFireRateMultiplier: 1.75,
        enemySpeedBonus: 1.2,
        startingCoins: 100,
    },
};

// Game settings and balance values
export const config = {
    // Gameplay Constants
    cityCount: 5,
    initialInterceptorSpeed: 7,
    initialBlastRadius: 15,
    nukeBlastRadius: 150,
    maxTurrets: 2,
    turretFireRate: 90, // Lower is faster
    turretRange: 350,
    empSpawnChance: 0.0005,
    empDuration: 300, // 5 seconds at 60fps
    nukeEmpDuration: 120, // 2 seconds
    rocketMaxLifetime: 2700, // 45 seconds
    homingMineDetonationRadius: 100,
    homingMineDeploymentZone: 0.85, // Mines can only be placed in the bottom 15% of the screen
    flareDistractionRadius: 100,
    touchTargetingRadius: 100,
    interceptorDamage: 3,
    nukeDamage: 100,

    // Particle & Effect Constants
    maxParticles: 300,

    // Point & Coin Values
    points: {
        standard: 100,
        mirv: 200,
        stealth: 300,
        swarmer: 150,
        drone: 25,
        flare_rocket: 200,
        armored: 500,
        designator: 400,
        boss: 5000,
    },

    // Upgrade Costs
    upgradeCosts: {
        repairCity: 1000,
        automatedTurret: 2500,
        interceptorSpeed: 750,
        multishot: 1500,
        flakWarheads: 1200,
        nuke: 3500,
        baseArmor: 2000,
        turretSpeed: 1500,
        turretRange: 1800,
        homingMine: 800,
        fieldReinforcement: 1250,
        targetingScrambler: 1750,
    },

    // Boss Configuration
    bosses: {
        hiveCarrier: {
            health: 250,
            droneSpawnRate: 90,
        },
    },

    // Static Wave Definitions (used by waveManager)
    waveDefinitions: [
        { standard: 6, delay: 120 },
        { standard: 8, mirv: 1, delay: 115 },
        { standard: 7, stealth: 1, flare_rocket: 1, delay: 110 },
        { standard: 8, mirv: 2, swarmer: 1, delay: 100 },
        { isBossWave: true, bossType: 'hiveCarrier', delay: 95 },
        { standard: 5, mirv: 3, stealth: 1, swarmer: 2, flare_rocket: 2, armored: 1, delay: 90 },
        { standard: 8, mirv: 2, stealth: 2, swarmer: 2, flare_rocket: 2, armored: 2, designator: 1, delay: 85 },
    ],
};

// Static information about rocket types for UI display
export const rocketInfo: Record<string, { name: string; threat: string; description: string }> = {
    standard: {
        name: 'Standard Rocket',
        threat: 'Low',
        description: 'A common, straightforward projectile. Predictable and unarmored.',
    },
    armored: {
        name: 'Armored Rocket',
        threat: 'Medium',
        description: 'A slow but tough rocket that requires multiple hits to destroy.',
    },
    mirv: { name: 'MIRV', threat: 'High', description: 'Splits into three standard rockets mid-flight.' },
    swarmer: { name: 'Swarmer', threat: 'High', description: 'Deploys a swarm of six fast-moving but fragile drones.' },
    drone: {
        name: 'Drone',
        threat: 'Low',
        description: 'A small, fast-moving projectile deployed by Swarmer rockets.',
    },
    stealth: { name: 'Stealth Rocket', threat: 'Medium', description: 'Periodically cloaks, making it untargetable.' },
    flare_rocket: {
        name: 'Flare Rocket',
        threat: 'Medium',
        description: 'Continuously deploys decoy flares that distract interceptors.',
    },
    designator: {
        name: 'Artillery Designator',
        threat: 'Critical',
        description: 'Targets a city for a devastating artillery strike. Must be destroyed quickly.',
    },
};
