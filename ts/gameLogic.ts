// ts/gameLogic.ts
// Contains the core game update logic, orchestrating all the systems.

import * as T from './types';
import { config } from './config';
import { getWaveDefinition } from './waveManager';
import { savePlayerData } from './saveManager';
import { handleSpawning } from './systems/spawning';
import { findTargetedRocket } from './systems/targeting';
import { handleInterceptorCollisions, handleTracerCollisions } from './systems/collisions';
import { updateEmpEffects, updateCityEffects } from './systems/effectsSystem';
import { createAdvancedExplosion, createGroundImpact, triggerScreenShake } from './utils';
import { ArtilleryDesignator, ArtilleryShell } from './entities/rockets';

/**
 * Updates all active game entities each frame.
 * @param state - The current game state.
 * @param width - The canvas width.
 * @param height - The canvas height.
 */
function updateEntities(state: T.GameState, width: number, height: number) {
    // Update main game objects
    if (state.boss) state.boss.update(state.rockets);

    if (state.empActiveTimer <= 0) {
        state.turrets.forEach((t) => {
            const newTracers = t.update(state.rockets);
            if (newTracers.length > 0) state.tracerRounds.push(...newTracers);
        });

        for (let i = state.rockets.length - 1; i >= 0; i--) {
            const rocket = state.rockets[i];
            rocket.update(state.flares);
            if (handleRocketLogic(state, rocket, i, width, height)) {
                continue;
            }
        }
    }

    // Update player abilities and other entities
    state.interceptors.forEach((interceptor) => interceptor.update(state.rockets, state.flares, state.boss));
    state.tracerRounds.forEach((tracer) => tracer.update());
    state.flares.forEach((flare) => flare.update());
    state.empPowerUps.forEach((emp) => emp.update());

    // Update visual effects
    state.particles.forEach((p) => p.update());
    state.flashes.forEach((f) => f.update());
    state.shockwaves.forEach((s) => s.update());
}

/**
 * Handles non-collision logic for a single rocket, like leaving the screen or hitting a city.
 * @returns {boolean} - True if the rocket was removed, false otherwise.
 */
function handleRocketLogic(
    state: T.GameState,
    rocket: T.Rocket,
    index: number,
    width: number,
    height: number
): boolean {
    // Check if rocket hits the ground
    if (rocket.y >= height) {
        // Don't create effects for designators that just fly off screen
        if (rocket.type !== 'designator') {
            createGroundImpact(state, rocket.x, height - 1);
        }
        state.rockets.splice(index, 1);
        return true;
    }

    if (rocket.x < -rocket.radius || rocket.x > width + rocket.radius || rocket.life > config.rocketMaxLifetime) {
        state.rockets.splice(index, 1);
        return true;
    }

    for (const city of state.cities) {
        if (
            !city.isDestroyed &&
            rocket.type !== 'designator' &&
            rocket.y > city.y &&
            rocket.x > city.x &&
            rocket.x < city.x + city.width
        ) {
            city.isArmored ? (city.isArmored = false) : city.destroy();
            createAdvancedExplosion(state, rocket.x, rocket.y);
            triggerScreenShake(state, 15, 30);
            state.rockets.splice(index, 1);
            return true;
        }
    }

    if ((rocket.type === 'mirv' || rocket.type === 'swarmer') && rocket.hasSplit && rocket.split) {
        state.rockets.push(...rocket.split());
        state.rockets.splice(index, 1);
        return true;
    }

    if (
        rocket instanceof ArtilleryDesignator &&
        rocket.isDesignating &&
        rocket.designationTimer > rocket.designationDuration
    ) {
        if (rocket.targetCity) {
            state.artilleryShells.push(
                new ArtilleryShell(rocket.targetCity.x + rocket.targetCity.width / 2, rocket.targetCity.y)
            );
        }
        state.rockets.splice(index, 1);
        return true;
    }

    return false;
}

/**
 * Removes entities that have expired or gone off-screen from the game state.
 */
function cleanupEntities(state: T.GameState, width: number) {
    state.interceptors = state.interceptors.filter((i) => i.y > 0 && i.x > 0 && i.x < width);
    state.tracerRounds = state.tracerRounds.filter((t) => t.life > 0 && t.y > 0);
    state.flares = state.flares.filter((f) => f.life > 0);
    state.particles = state.particles.filter((p) => p.life > 0);
    state.flashes = state.flashes.filter((f) => f.alpha > 0);
    state.shockwaves = state.shockwaves.filter((s) => s.alpha > 0);
    state.empPowerUps = state.empPowerUps.filter((e) => e.life > 0);
}

/**
 * Checks for wave completion or game over conditions.
 */
function checkGameState(state: T.GameState, refreshUpgradeScreen: () => void) {
    const waveDef = getWaveDefinition(state.currentWave);
    const allEnemiesDefeated = state.rockets.length === 0 && (!waveDef.isBossWave || state.bossDefeated);
    const waveComplete = allEnemiesDefeated && state.waveRocketSpawn.toSpawn.length === 0;

    if (waveComplete) {
        state.gameState = 'BETWEEN_WAVES';
        state.targetedRocket = null;
        state.flares = [];
        state.nukeAvailable = state.activePerks.surplusValue ? state.nukeAvailable : false;
        state.firstUpgradePurchased = false;
        state.scramblerActive = false;
        refreshUpgradeScreen();
        return;
    }

    const destroyedCities = state.cities.filter((c) => c.isDestroyed).length;
    if (destroyedCities === state.cityCount) {
        state.gameState = 'GAME_OVER';
        const isNewHighScore = state.score > state.playerData.highScores[state.difficulty];
        if (isNewHighScore) {
            state.playerData.highScores[state.difficulty] = state.score;
            state.newHighScore = true;
        }
        const pointsEarned = Math.floor(state.score / 100) + state.currentWave * 10;
        state.playerData.prestigePoints += pointsEarned;
        savePlayerData(state.playerData);
    }
}

/**
 * The main update function called every frame from the game loop.
 */
export function update(state: T.GameState, width: number, height: number, refreshUpgradeScreen: () => void): void {
    state.gameTime++;
    if (state.empActiveTimer > 0) {
        state.empActiveTimer--;
    }

    // --- System Execution Order ---
    findTargetedRocket(state);
    handleSpawning(state, width, height);
    updateEntities(state, width, height);
    updateCityEffects(state, height); // Update ongoing city smoke
    updateEmpEffects(state); // Update EMP visual effect
    handleInterceptorCollisions(state);
    handleTracerCollisions(state);
    cleanupEntities(state, width);
    checkGameState(state, refreshUpgradeScreen);
}
