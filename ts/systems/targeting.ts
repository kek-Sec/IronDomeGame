// ts/systems/targeting.ts
import * as T from '../types';
import { HiveCarrier } from '../entities/bosses';

export function findTargetedRocket(state: T.GameState): void {
    let closestDist = Infinity;
    state.targetedRocket = null;

    const potentialTargets: (T.Rocket | T.Flare | T.HiveCarrier)[] = [...state.rockets, ...state.flares];
    if (state.boss) {
        potentialTargets.push(state.boss);
    }

    for (const target of potentialTargets) {
        // Skip cloaked stealth rockets
        if (target.type === 'stealth' && 'isVisible' in target && !target.isVisible) {
            continue;
        }

        const dist = Math.hypot(target.x - state.mouse.x, target.y - state.mouse.y);
        const targetableRadius = target instanceof HiveCarrier ? target.radius : 50; // Larger radius for the boss

        if (dist < targetableRadius && dist < closestDist) {
            closestDist = dist;
            state.targetedRocket = target;
        }
    }
}
