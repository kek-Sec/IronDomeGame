// ts/upgrades/helpers.ts
import { GameState } from '../types';

/**
 * Applies a cost discount for the first purchase if the 'Rapid Deployment' perk is active.
 * @param state - The current game state.
 * @param baseCost - The base cost of the upgrade.
 * @returns The potentially discounted cost.
 */
export function applyCost(state: GameState, baseCost: number): number {
    if (state.activePerks.rapidDeployment && !state.firstUpgradePurchased) {
        state.firstUpgradePurchased = true;
        return Math.ceil(baseCost * 0.75);
    }
    return baseCost;
}
