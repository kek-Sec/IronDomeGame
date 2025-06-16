/**
 * flow.js
 * * Manages the overall flow of the game, like starting waves and handling upgrades.
 */
import { waveDefinitions, config } from './config.js';
import * as UI from './ui.js';
import * as events from './eventHandlers.js';

/**
 * Starts the next wave of enemies.
 * @param {object} state - The current game state.
 */
export function startNextWave(state) {
    state.currentWave++;
    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];
    
    let spawnList = [];
    for(let i=0; i<waveDef.standard; i++) spawnList.push('standard');
    for(let i=0; i<waveDef.mirv; i++) spawnList.push('mirv');
    for(let i=0; i<waveDef.stealth; i++) spawnList.push('stealth');
    for(let i=0; i<waveDef.swarmer; i++) spawnList.push('swarmer');
    for(let i=0; i<waveDef.flare; i++) spawnList.push('flare');
    state.waveRocketSpawn.toSpawn = spawnList.sort(() => Math.random() - 0.5);

    state.waveRocketSpawn.timer = 0;
    state.gameState = 'IN_WAVE';
    UI.hideModal();
    UI.updateTopUI(state);
}

/**
 * Re-renders the upgrade screen with the current state.
 * @param {object} state - The current game state.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 */
export function refreshUpgradeScreen(state, canvas) {
    UI.updateTopUI(state);
    UI.showBetweenWaveScreen(state, {
        upgradeRepairCallback: () => events.handleUpgradeRepair(state, () => refreshUpgradeScreen(state, canvas)),
        upgradeTurretCallback: () => events.handleUpgradeTurret(state, canvas, () => refreshUpgradeScreen(state, canvas)),
        upgradeSpeedCallback: () => events.handleUpgradeSpeed(state, () => refreshUpgradeScreen(state, canvas)),
        upgradeBlastCallback: () => events.handleUpgradeBlast(state, () => refreshUpgradeScreen(state, canvas)),
        upgradeNukeCallback: () => events.handleUpgradeNuke(state, () => refreshUpgradeScreen(state, canvas)),
        upgradeBaseArmorCallback: () => events.handleUpgradeBaseArmor(state, () => refreshUpgradeScreen(state, canvas)),
        upgradeTurretSpeedCallback: () => events.handleUpgradeTurretSpeed(state, () => refreshUpgradeScreen(state, canvas)),
        nextWaveCallback: () => startNextWave(state)
    }, config);
}