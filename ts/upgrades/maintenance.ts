// ts/upgrades/maintenance.ts
import { config } from '../config';
import { GameState } from '../types';
import { applyCost } from './helpers';

export function handleUpgradeRepair(state: GameState, refreshUpgradeScreen: () => void): void {
    const cost = applyCost(state, config.upgradeCosts.repairCity);
    if (state.coins >= cost) {
        const cityToRepair = state.cities.find((c) => c.isDestroyed);
        if (cityToRepair) {
            state.coins -= cost;
            cityToRepair.repair();
            refreshUpgradeScreen();
        }
    }
}