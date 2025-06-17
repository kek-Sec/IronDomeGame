/**
 * flow.js
 * * Manages the overall flow of the game, like starting waves and handling upgrades.
 */
import { waveDefinitions, config } from './config.js';
import * as UI from './ui.js';
import * as upgradeHandlers from './logic/upgradeHandlers.js';
import { HiveCarrier } from './entities/bosses.js';

/**
 * Generates a procedural wave definition for endless mode.
 * The difficulty increases based on how many waves have passed.
 * @param {number} currentWave - The wave number to generate.
 * @returns {object} A wave definition object.
 */
function generateProceduralWave(currentWave) {
    const baseWave = waveDefinitions[waveDefinitions.length - 1];
    const waveFactor = currentWave - waveDefinitions.length + 1;

    const waveData = {
        standard: baseWave.standard || 5,
        mirv: baseWave.mirv || 2,
        stealth: baseWave.stealth || 2,
        swarmer: baseWave.swarmer || 2,
        flare: baseWave.flare || 1,
        armored: baseWave.armored || 2,
        delay: Math.max(45, baseWave.delay - waveFactor * 2), // Clamp delay to a minimum
        isBossWave: false,
    };

    // --- Increase rocket counts based on the wave number ---
    // Add a standard rocket every wave
    waveData.standard += Math.floor(waveFactor * 1.5);

    // Add an "elite" rocket (mirv or swarmer) every 2 waves
    if (waveFactor > 0 && waveFactor % 2 === 0) {
        if (Math.random() > 0.5) waveData.mirv++;
        else waveData.swarmer++;
    }

    // Add a "specialist" rocket (stealth, armored, or flare) every 3 waves
    if (waveFactor > 0 && waveFactor % 3 === 0) {
        const rand = Math.random();
        if (rand < 0.4) waveData.stealth++;
        else if (rand < 0.8) waveData.armored++;
        else waveData.flare++;
    }
    
    // --- Introduce a boss wave every 5 waves in endless mode ---
    if (waveFactor > 0 && waveFactor % 5 === 0) {
        waveData.isBossWave = true;
        waveData.bossType = 'hiveCarrier';
    }
    
    return waveData;
}


/**
 * Starts the next wave of enemies.
 * @param {object} state - The current game state.
 * @param {HTMLCanvasElement} canvas - The game canvas.
 */
export function startNextWave(state, canvas) {
    state.currentWave++;
    let waveDef;
    
    // Use predefined waves first, then switch to procedural generation
    if (state.currentWave < waveDefinitions.length) {
        waveDef = waveDefinitions[state.currentWave];
    } else {
        waveDef = generateProceduralWave(state.currentWave);
    }
    
    state.boss = null;
    state.bossDefeated = false;
    state.waveRocketSpawn.toSpawn = [];

    if (waveDef.isBossWave) {
        if (waveDef.bossType === 'hiveCarrier') {
            // Scale boss health in endless mode
            const waveFactor = state.currentWave - waveDefinitions.length + 1;
            const healthMultiplier = (waveFactor > 0) ? 1 + (Math.floor(waveFactor / 5) * 0.75) : 1;
            state.boss = new HiveCarrier(canvas.width, healthMultiplier);
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