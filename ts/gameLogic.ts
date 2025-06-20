// ts/gameLogic.ts
// * Contains the core game logic for updating the game state each frame.

import { config, getWaveDefinition } from './config';
import * as UI from './ui';
import { savePlayerData } from './saveManager';
import { updateParticles, updateCityEffects, updateHomingMines, updateTracerRounds, updateInterceptors, updateTurrets, updateFlares, updateArtilleryShells, updateRockets, updateBoss, handleSpawning, findTargetedRocket } from './logic/updateLogic';
import type { GameState } from './types';


export function update(state: GameState, width: number, height: number, refreshUpgradeScreen: () => void, init: () => void): void {
    state.gameTime++;
    UI.updateTopUI(state);
    UI.updateBossUI(state.boss);
    if (state.gameState !== 'IN_WAVE') return;

    const waveDef = getWaveDefinition(state.currentWave);

    if (!waveDef.isBossWave && state.rockets.length === 0 && state.waveRocketSpawn.toSpawn.length === 0 && state.boss === null) {
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
    updateArtilleryShells(state);
    updateFlares(state);
    updateTurrets(state);
    updateInterceptors(state, width);
    updateTracerRounds(state);
    updateHomingMines(state);
    updateParticles(state);
    updateCityEffects(state, height);

    for (let i = state.flashes.length - 1; i >= 0; i--) {
        const flash = state.flashes[i];
        flash.update();
        if (flash.alpha <= 0) state.flashes.splice(i, 1);
    }
    for (let i = state.shockwaves.length - 1; i >= 0; i--) {
        const shockwave = state.shockwaves[i];
        shockwave.update();
        if (shockwave.alpha <= 0) state.shockwaves.splice(i, 1);
    }

    state.empPowerUps.forEach((emp, i) => {
        emp.update();
        if (emp.life <= 0) state.empPowerUps.splice(i, 1);
    });
    findTargetedRocket(state);

    let waveIsOver = false;

    const waveDuration = state.gameTime - state.waveStartTime;
    if (waveDuration > 10800) { // 3 minutes timeout
        waveIsOver = true;
        console.warn(`Failsafe triggered: Wave ${state.currentWave + 1} ended due to absolute timeout.`);
        state.rockets = [];
    }

    if (state.timeSinceLastRocket > 1200) { // 20 seconds of no activity
        waveIsOver = true;
        console.warn("Failsafe triggered: Wave ended due to 20s of no activity.");
        state.waveRocketSpawn.toSpawn = [];
    }

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
        state.nukeAvailable = state.activePerks.surplusValue ? state.nukeAvailable : false;
        state.firstUpgradePurchased = false;
        state.scramblerActive = false;
        refreshUpgradeScreen();
    }

    const destroyedCities = state.cities.filter(c => c.isDestroyed).length;
    if (destroyedCities === config.cityCount) {
        state.gameState = 'GAME_OVER';

        let newHighScore = false;
        if (state.score > state.playerData.highScores[state.difficulty]) {
            state.playerData.highScores[state.difficulty] = state.score;
            newHighScore = true;
        }

        const pointsEarned = Math.floor(state.score / 100) + state.currentWave * 10;
        state.playerData.prestigePoints += pointsEarned;
        savePlayerData(state.playerData);

        UI.showGameOverScreen(state, init, pointsEarned, newHighScore);
    }
}