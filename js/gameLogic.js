/**
 * gameLogic.js
 * * Contains the core game logic for updating the game state each frame.
 */
import { config, getWaveDefinition } from './config.js';
import * as UI from './ui.js';
import { savePlayerData } from './saveManager.js';
import { 
    findTargetedRocket, 
    handleSpawning, 
    updateBoss, 
    updateRockets, 
    updateFlares, 
    updateTurrets, 
    updateInterceptors, 
    updateTracerRounds, 
    updateHomingMines, 
    updateParticles 
} from './logic/updateLogic.js';

export function update(state, width, height, refreshUpgradeScreen, init) {
    state.gameTime++;
    UI.updateTopUI(state);
    UI.updateBossUI(state.boss);
    if (state.gameState !== 'IN_WAVE') return;

    const waveDef = getWaveDefinition(state.currentWave);

    if (!waveDef.isBossWave && state.rockets.length === 0 && state.waveRocketSpawn.toSpawn.length > 0) {
        state.timeSinceLastRocket++;
    } else {
        state.timeSinceLastRocket = 0;
    }
    
    if (state.empActiveTimer > 0) {
        state.empActiveTimer--;
        state.empShockwave.radius += 20;
        state.empShockwave.alpha = Math.max(0, state.empShockwave.alpha - 0.01);
    } else {
        state.empShockwave = { radius: 0, alpha: 0 };
    }

    handleSpawning(state, width, height);
    updateBoss(state);
    updateRockets(state, width, height);
    updateFlares(state);
    updateTurrets(state);
    updateInterceptors(state, width);
    updateTracerRounds(state);
    updateHomingMines(state);
    updateParticles(state);
    state.empPowerUps.forEach((emp, i) => {
        emp.update();
        if (emp.life <= 0) state.empPowerUps.splice(i, 1);
    });
    findTargetedRocket(state);
    
    let waveIsOver = false;

    // --- Safeguard & Wave End Checks ---
    const waveDuration = state.gameTime - state.waveStartTime;
    // Absolute timeout of 3 minutes for any wave
    if (waveDuration > 10800) {
        waveIsOver = true;
        console.warn(`Failsafe triggered: Wave ${state.currentWave + 1} ended due to absolute timeout (3 minutes).`);
        state.rockets = []; // Clear any remaining rockets to be sure
    }

    // Timeout if no rockets are on screen and none are spawning for 20s
    if (state.timeSinceLastRocket > 1200) {
        waveIsOver = true;
        console.warn("Failsafe triggered: Wave ended due to 20s of no activity.");
        state.waveRocketSpawn.toSpawn = []; 
    }

    // Standard wave end conditions
    if (waveDef.isBossWave) {
        if (state.bossDefeated && state.rockets.length === 0) {
            waveIsOver = true;
        }
    } else {
        if (state.rockets.length === 0 && state.waveRocketSpawn.toSpawn.length === 0) {
            waveIsOver = true;
        }
    }

    if (waveIsOver) {
        state.gameState = 'BETWEEN_WAVES';
        state.targetedRocket = null;
        state.flares = [];
        state.nukeAvailable = false;
        state.firstUpgradePurchased = false; // Reset for Rapid Deployment perk
        state.scramblerActive = false; // Reset Scrambler at the end of the wave
        refreshUpgradeScreen();
    }
    
    const destroyedCities = state.cities.filter(c => c.isDestroyed).length;
    if (destroyedCities === config.cityCount) {
        state.gameState = 'GAME_OVER';

        // Award Prestige Points and save data
        const pointsEarned = Math.floor(state.score / 100) + state.currentWave * 10;
        state.playerData.prestigePoints += pointsEarned;
        savePlayerData(state.playerData);

        UI.showGameOverScreen(state, init, pointsEarned);
    }
}