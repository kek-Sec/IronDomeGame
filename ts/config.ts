// ts/config.ts
import { DifficultySetting, WaveDefinition, Perk } from './types';

// Difficulty settings to adjust game balance.
export const difficultySettings: Record<string, DifficultySetting> = {
    easy: {
        name: 'Recruit',
        description:
            'A balanced introduction to the battlefield. Enemies are slightly slower and you start with more funding.',
        waveDelayMultiplier: 1.25,
        missileSizeMultiplier: 1.5,
        turretFireRateMultiplier: 0.8,
        enemySpeedBonus: 0.85, // Enemies are slightly slower
        startingCoins: 250,
    },
    normal: {
        name: 'Veteran',
        description:
            'The standard combat scenario. A true test of your defensive capabilities against a determined foe.',
        waveDelayMultiplier: 1.0,
        missileSizeMultiplier: 1.25,
        turretFireRateMultiplier: 1.0,
        enemySpeedBonus: 1.0, // Standard enemy speed
        startingCoins: 150,
    },
    hard: {
        name: 'Elite',
        description:
            'For seasoned commanders only. The enemy is faster, smarter, and relentless. Expect smaller targets and less time to react.',
        waveDelayMultiplier: 0.6, // Waves arrive much faster
        missileSizeMultiplier: 0.9, // Missiles are smaller and harder to hit
        turretFireRateMultiplier: 1.75, // Your turrets fire even slower
        enemySpeedBonus: 1.2, // Enemies are 20% faster
        startingCoins: 100, // Start with fewer resources
    },
};

// Game settings and balance values
export const config = {
    cityCount: 5,
    initialInterceptorSpeed: 7,
    initialBlastRadius: 15,
    nukeBlastRadius: 150,
    rocketPoints: 100,
    mirvPoints: 200,
    stealthPoints: 300,
    swarmerPoints: 150,
    dronePoints: 25,
    flareRocketPoints: 200,
    armoredPoints: 500,
    artilleryDesignatorPoints: 400,
    maxTurrets: 2,
    turretFireRate: 90,
    turretRange: 350,
    empSpawnChance: 0.0005,
    empDuration: 300,
    nukeEmpDuration: 120, // 2 seconds
    maxParticles: 300,
    homingMineDetonationRadius: 100,
    rocketMaxLifetime: 2700, // 45 seconds at 60fps - Safeguard
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
    bosses: {
        hiveCarrier: {
            health: 250,
            points: 5000,
            droneSpawnRate: 90, // Every 1.5 seconds
        },
    },
};

// Defines the base composition of enemy rockets for the pre-set waves
export const waveDefinitions: WaveDefinition[] = [
    { standard: 6, mirv: 0, stealth: 0, swarmer: 0, flare_rocket: 0, armored: 0, delay: 120 },
    { standard: 8, mirv: 1, stealth: 0, swarmer: 0, flare_rocket: 0, armored: 0, delay: 115 },
    { standard: 7, mirv: 0, stealth: 1, swarmer: 0, flare_rocket: 1, armored: 0, delay: 110 },
    { standard: 8, mirv: 2, stealth: 0, swarmer: 1, armored: 0, delay: 100 },
    { isBossWave: true, bossType: 'hiveCarrier', delay: 95 },
    { standard: 5, mirv: 3, stealth: 1, swarmer: 2, flare_rocket: 2, armored: 1, delay: 90 },
    { standard: 8, mirv: 2, stealth: 2, swarmer: 2, flare_rocket: 2, armored: 2, designator: 1, delay: 85 },
];

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