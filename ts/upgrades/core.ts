// ts/upgrades/core.ts
import { config, difficultySettings } from '../config';
import { AutomatedTurret } from '../entities/structures';
import { GameState } from '../types';
import { applyCost } from './helpers';

export function handleUpgradeTurret(
    state: GameState,
    canvas: HTMLCanvasElement,
    refreshUpgradeScreen: () => void
): void {
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

export function handleUpgradeSpeed(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.interceptorSpeed);
    if (state.coins >= cost) {
        state.coins -= cost;
        state.interceptorSpeed *= 1.2;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeBlastRadius(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.flakWarheads * (state.blastRadiusLevel + 1));
    if (state.coins >= cost && state.blastRadiusLevel < 5) {
        state.coins -= cost;
        state.blastRadiusLevel++;
        state.interceptorBlastRadius += 5; // Increase blast radius by 5 pixels per level
        refreshUpgradeScreen();
    }
}

export function handleUpgradeMultishot(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.multishot * (state.multishotLevel + 1));
    if (state.coins >= cost && state.multishotLevel < 3) {
        state.coins -= cost;
        state.multishotLevel++;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeBaseArmor(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.baseArmor);
    if (state.coins >= cost && !state.basesAreArmored) {
        state.coins -= cost;
        state.basesAreArmored = true;
        state.cities.forEach((c) => (c.isArmored = true));
        refreshUpgradeScreen();
    }
}

export function handleUpgradeTurretSpeed(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.turretSpeed);
    if (state.coins >= cost && state.turretFireRateLevel < 3) {
        state.coins -= cost;
        state.turretFireRateLevel++;
        state.turrets.forEach((t) => (t.fireRate *= 0.75));
        refreshUpgradeScreen();
    }
}

export function handleUpgradeTurretRange(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.turretRange);
    if (state.coins >= cost && state.turretRangeLevel < 3) {
        state.coins -= cost;
        state.turretRangeLevel++;
        state.turrets.forEach((t) => (t.range *= 1.15));
        refreshUpgradeScreen();
    }
}