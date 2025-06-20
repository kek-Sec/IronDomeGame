// ts/flow.ts
// * Manages the overall flow of the game, like starting waves and handling upgrades.
import { config, waveDefinitions } from './config';
import * as UI from './ui';
import * as upgradeHandlers from './logic/upgradeHandlers';
import { HiveCarrier } from './entities/bosses';
import * as T from './types';
import { getWaveDefinition } from './waveManager';

/**
 * Starts the next wave of enemies.
 * @param {object} state - The current game state.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 */
export function startNextWave(state: T.GameState, canvas: HTMLCanvasElement): void {
    state.currentWave++;
    const waveDef = getWaveDefinition(state.currentWave);

    state.boss = null;
    state.bossDefeated = false;
    state.waveRocketSpawn.toSpawn = [];
    state.waveStartTime = state.gameTime;

    if (waveDef.isBossWave) {
        if (waveDef.bossType === 'hiveCarrier') {
            const waveFactor = state.currentWave - waveDefinitions.length + 1;
            const healthMultiplier = waveFactor > 0 ? 1 + Math.floor(waveFactor / 5) * 0.75 : 1;
            state.boss = new HiveCarrier(canvas.width, healthMultiplier);
        }
    } else {
        const composition: string[] = waveDef.composition || [];
        if (composition.length === 0) {
            for (let i = 0; i < (waveDef.standard || 0); i++) composition.push('standard');
            for (let i = 0; i < (waveDef.mirv || 0); i++) composition.push('mirv');
            for (let i = 0; i < (waveDef.stealth || 0); i++) composition.push('stealth');
            for (let i = 0; i < (waveDef.swarmer || 0); i++) composition.push('swarmer');
            for (let i = 0; i < (waveDef.flare_rocket || 0); i++) composition.push('flare_rocket');
            for (let i = 0; i < (waveDef.armored || 0); i++) composition.push('armored');
            for (let i = 0; i < (waveDef.designator || 0); i++) composition.push('designator');
        }
        state.waveRocketSpawn.toSpawn = composition.sort(() => Math.random() - 0.5);
    }

    state.waveRocketSpawn.timer = 0;
    state.gameState = 'IN_WAVE';
    UI.hideModal();
    UI.updateTopUI(state);
    UI.updateBossUI(state.boss);
}

/**
 * Re-renders the upgrade screen with the current state.
 * @param {object} state - The current game state.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 */
export function refreshUpgradeScreen(state: T.GameState, canvas: HTMLCanvasElement): void {
    UI.updateTopUI(state);
    const refreshCallback = () => refreshUpgradeScreen(state, canvas);
    UI.showBetweenWaveScreen(
        state,
        {
            upgradeRepairCallback: () => upgradeHandlers.handleUpgradeRepair(state, refreshCallback),
            upgradeTurretCallback: () => upgradeHandlers.handleUpgradeTurret(state, canvas, refreshCallback),
            upgradeSpeedCallback: () => upgradeHandlers.handleUpgradeSpeed(state, refreshCallback),
            upgradeMultishotCallback: () => upgradeHandlers.handleUpgradeMultishot(state, refreshCallback),
            upgradeBlastRadiusCallback: () => upgradeHandlers.handleUpgradeBlastRadius(state, refreshCallback),
            upgradeNukeCallback: () => upgradeHandlers.handleUpgradeNuke(state, refreshCallback),
            upgradeBaseArmorCallback: () => upgradeHandlers.handleUpgradeBaseArmor(state, refreshCallback),
            upgradeTurretSpeedCallback: () => upgradeHandlers.handleUpgradeTurretSpeed(state, refreshCallback),
            upgradeTurretRangeCallback: () => upgradeHandlers.handleUpgradeTurretRange(state, refreshCallback),
            upgradeHomingMineCallback: () => upgradeHandlers.handleUpgradeHomingMine(state, refreshCallback),
            upgradeFieldReinforcementCallback: () =>
                upgradeHandlers.handleUpgradeFieldReinforcement(state, refreshCallback),
            upgradeTargetingScramblerCallback: () =>
                upgradeHandlers.handleUpgradeTargetingScrambler(state, refreshCallback),
            nextWaveCallback: () => startNextWave(state, canvas),
        },
        config
    );
}
