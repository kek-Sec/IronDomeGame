/**
 * flow.js
 * * Manages the overall flow of the game, like starting waves and handling upgrades.
 */
import { waveDefinitions, config } from './config.js';
import * as UI from './ui.js';
import * as upgradeHandlers from './logic/upgradeHandlers.js';
import { HiveCarrier } from './entities/bosses.js';

/**
 * Starts the next wave of enemies.
 * @param {object} state - The current game state.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 */
export function startNextWave(state, canvas) {
    state.currentWave++;
    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];
    
    state.boss = null;
    state.bossDefeated = false;
    state.waveRocketSpawn.toSpawn = [];

    if (waveDef.isBossWave) {
        if (waveDef.bossType === 'hiveCarrier') {
            state.boss = new HiveCarrier(canvas.width);
        }
    } else {
        let spawnList = [];
        for(let i=0; i< (waveDef.standard || 0); i++) spawnList.push('standard');
        for(let i=0; i< (waveDef.mirv || 0); i++) spawnList.push('mirv');
        for(let i=0; i< (waveDef.stealth || 0); i++) spawnList.push('stealth');
        for(let i=0; i< (waveDef.swarmer || 0); i++) spawnList.push('swarmer');
        for(let i=0; i< (waveDef.flare || 0); i++) spawnList.push('flare');
        for(let i=0; i< (waveDef.armored || 0); i++) spawnList.push('armored');
        state.waveRocketSpawn.toSpawn = spawnList.sort(() => Math.random() - 0.5);
    }


    state.waveRocketSpawn.timer = 0;
    state.gameState = 'IN_WAVE';
    UI.hideModal();
    UI.updateTopUI(state);
    UI.updateBossUI(state.boss); // Show boss UI if it exists
}

/**
 * Re-renders the upgrade screen with the current state.
 * @param {object} state - The current game state.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 */
export function refreshUpgradeScreen(state, canvas) {
    UI.updateTopUI(state);
    const refreshCallback = () => refreshUpgradeScreen(state, canvas);
    UI.showBetweenWaveScreen(state, {
        upgradeRepairCallback: () => upgradeHandlers.handleUpgradeRepair(state, refreshCallback),
        upgradeTurretCallback: () => upgradeHandlers.handleUpgradeTurret(state, canvas, refreshCallback),
        upgradeSpeedCallback: () => upgradeHandlers.handleUpgradeSpeed(state, refreshCallback),
        upgradeBlastCallback: () => upgradeHandlers.handleUpgradeBlast(state, refreshCallback),
        upgradeNukeCallback: () => upgradeHandlers.handleUpgradeNuke(state, refreshCallback),
        upgradeBaseArmorCallback: () => upgradeHandlers.handleUpgradeBaseArmor(state, refreshCallback),
        upgradeTurretSpeedCallback: () => upgradeHandlers.handleUpgradeTurretSpeed(state, refreshCallback),
        upgradeTurretRangeCallback: () => upgradeHandlers.handleUpgradeTurretRange(state, refreshCallback),
        upgradeHomingMineCallback: () => upgradeHandlers.handleUpgradeHomingMine(state, refreshCallback),
        upgradeFieldReinforcementCallback: () => upgradeHandlers.handleUpgradeFieldReinforcement(state, refreshCallback),
        upgradeTargetingScramblerCallback: () => upgradeHandlers.handleUpgradeTargetingScrambler(state, refreshCallback),
        nextWaveCallback: () => startNextWave(state, canvas)
    }, config);
}