// ts/upgrades/tactical.ts
import { config } from '../config';
import { HomingMine } from '../entities/playerAbilities';
import { GameState } from '../types';
import { applyCost } from './helpers';

export function handleUpgradeNuke(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.nuke);
    const nukeIsPurchasable = !state.nukeAvailable || state.activePerks.surplusValue;
    if (state.coins >= cost && nukeIsPurchasable) {
        state.coins -= cost;
        state.nukeAvailable = true;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeHomingMine(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.homingMine);
    if (state.coins >= cost) {
        state.coins -= cost;
        state.homingMinesAvailable++;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeFieldReinforcement(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.fieldReinforcement);
    if (state.coins >= cost) {
        state.coins -= cost;
        state.cities.forEach((c) => {
            if (!c.isDestroyed && !c.isArmored) {
                c.isArmored = true;
            }
        });
        refreshUpgradeScreen();
    }
}

export function handleUpgradeTargetingScrambler(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.targetingScrambler);
    if (state.coins >= cost && !state.scramblerActive) {
        state.coins -= cost;
        state.scramblerActive = true;
        refreshUpgradeScreen();
    }
}