/**
 * flow.js
 * * Manages the overall flow of the game, like starting waves and handling upgrades.
 */
import { getWaveDefinition, config, waveDefinitions } from './config.js';
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
    const waveDef = getWaveDefinition(state.currentWave);
    
    state.boss = null;
    state.bossDefeated = false;
    state.waveRocketSpawn.toSpawn = [];
    state.waveStartTime = state.gameTime; // Start the wave timer safeguard

    if (waveDef.isBossWave) {
        if (waveDef.bossType === 'hiveCarrier') {
            // Scale boss health in endless mode
            // THE FIX: Correctly reference the imported 'waveDefinitions' array, not 'config.waveDefinitions'
            const waveFactor = state.currentWave - waveDefinitions.length + 1;
            const healthMultiplier = (waveFactor > 0) ? 1 + (Math.floor(waveFactor / 5) * 0.75) : 1;
            state.boss = new HiveCarrier(canvas.width, healthMultiplier);
        }
    } else {
        // The wave composition is either pre-defined or generated procedurally
        const composition = waveDef.composition || [];
        // Fallback for pre-defined waves that don't use the 'composition' array
        if (composition.length === 0) {
            for(let i=0; i< (waveDef.standard || 0); i++) composition.push('standard');
            for(let i=0; i< (waveDef.mirv || 0); i++) composition.push('mirv');
            for(let i=0; i< (waveDef.stealth || 0); i++) composition.push('stealth');
            for(let i=0; i< (waveDef.swarmer || 0); i++) composition.push('swarmer');
            for(let i=0; i< (waveDef.flare || 0); i++) composition.push('flare');
            for(let i=0; i< (waveDef.armored || 0); i++) composition.push('armored');
        }
        state.waveRocketSpawn.toSpawn = composition.sort(() => Math.random() - 0.5);
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