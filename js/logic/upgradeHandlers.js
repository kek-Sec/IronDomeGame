import { config, difficultySettings } from '../config.js';
import { AutomatedTurret } from '../entities/structures.js';
import { HomingMine } from '../entities/playerAbilities.js';

// Helper to apply discount and manage the one-time flag
function applyCost(state, baseCost) {
    if (state.activePerks.rapidDeployment && !state.firstUpgradePurchased) {
        state.firstUpgradePurchased = true;
        return Math.ceil(baseCost * 0.75);
    }
    return baseCost;
}

export function handleUpgradeRepair(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.repairCity);
    if (state.coins >= cost) {
        const cityToRepair = state.cities.find(c => c.isDestroyed);
        if (cityToRepair) {
            state.coins -= cost;
            cityToRepair.repair();
            refreshUpgradeScreen();
        }
    }
}

export function handleUpgradeTurret(state, canvas, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.automatedTurret);
    if (state.coins >= cost && state.turrets.length < config.maxTurrets) {
        state.coins -= cost;
        const turretX = state.turrets.length === 0 ? canvas.width * 0.25 : canvas.width * 0.75;
        const fireRate = config.turretFireRate * difficultySettings[state.difficulty].turretFireRateMultiplier;
        const range = config.turretRange * (1 + state.turretRangeLevel * 0.15);
        state.turrets.push(new AutomatedTurret(turretX, canvas.height - 10, range, fireRate));
        refreshUpgradeScreen();
    }
}

export function handleUpgradeSpeed(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.interceptorSpeed);
    if (state.coins >= cost) {
        state.coins -= cost;
        state.interceptorSpeed *= 1.2;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeBlast(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.blastRadius);
    if (state.coins >= cost) {
        state.coins -= cost;
        state.blastRadius *= 1.3;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeNuke(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.nuke);
    const nukeIsAvailable = state.nukeAvailable || state.activePerks.surplusValue;
    if(state.coins >= cost && !nukeIsAvailable) {
        state.coins -= cost;
        state.nukeAvailable = true;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeBaseArmor(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.baseArmor);
    if(state.coins >= cost && !state.basesAreArmored) {
        state.coins -= cost;
        state.basesAreArmored = true;
        state.cities.forEach(c => c.isArmored = true);
        refreshUpgradeScreen();
    }
}

export function handleUpgradeTurretSpeed(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.turretSpeed);
     if(state.coins >= cost && state.turretFireRateLevel < 3) {
        state.coins -= cost;
        state.turretFireRateLevel++;
        state.turrets.forEach(t => t.fireRate *= 0.75);
        refreshUpgradeScreen();
    }
}

export function handleUpgradeTurretRange(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.turretRange);
    if (state.coins >= cost && state.turretRangeLevel < 3) {
        state.coins -= cost;
        state.turretRangeLevel++;
        state.turrets.forEach(t => t.range *= 1.15);
        refreshUpgradeScreen();
    }
}

export function handleUpgradeHomingMine(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.homingMine);
    if (state.coins >= cost) {
        state.coins -= cost;
        state.homingMinesAvailable++;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeFieldReinforcement(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.fieldReinforcement);
    if(state.coins >= cost) {
        state.coins -= cost;
        state.cities.forEach(c => {
            if (!c.isDestroyed && !c.isArmored) {
                c.isArmored = true;
            }
        });
        refreshUpgradeScreen();
    }
}

export function handleUpgradeTargetingScrambler(state, refreshUpgradeScreen) {
    const cost = applyCost(state, config.upgradeCosts.targetingScrambler);
    if(state.coins >= cost && !state.scramblerActive) {
        state.coins -= cost;
        state.scramblerActive = true;
        refreshUpgradeScreen();
    }
}