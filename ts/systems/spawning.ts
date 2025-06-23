// ts/systems/spawning.ts
import { config, difficultySettings } from '../config';
import * as T from '../types';
import { getWaveDefinition } from '../waveManager';
import { EMP } from '../entities/playerAbilities';
import {
    Rocket,
    MirvRocket,
    StealthRocket,
    SwarmerRocket,
    FlareRocket,
    ArmoredRocket,
    ArtilleryDesignator,
    ArtilleryShell,
} from '../entities/rockets';
import { random } from '../utils';
import { loadedSprites } from '../assetLoader';

export function handleSpawning(state: T.GameState, width: number, height: number): void {
    // FIX: Prevent any new spawns while an EMP is active.
    if (state.empActiveTimer > 0) {
        return;
    }

    const waveDef = getWaveDefinition(state.currentWave);
    if (waveDef.isBossWave) return;

    // Determine wave difficulty and spawn delay
    const difficulty = difficultySettings[state.difficulty];
    const difficultyScale = state.currentWave > 5 ? 1 + (state.currentWave - 5) * 0.15 : 1;
    const currentWaveDelay = ((waveDef.delay || 85) * difficulty.waveDelayMultiplier) / difficultyScale;
    state.waveRocketSpawn.timer++;

    // Spawn a new rocket if the timer is up and there are rockets left to spawn
    if (state.waveRocketSpawn.timer > currentWaveDelay && state.waveRocketSpawn.toSpawn.length > 0) {
        const rocketType = state.waveRocketSpawn.toSpawn.pop();
        if (rocketType) {
            createRocket(state, rocketType, width, height, difficulty);
        }
        state.waveRocketSpawn.timer = 0;
    }

    // Handle random EMP power-up spawning
    if (Math.random() < config.empSpawnChance && state.empPowerUps.length < 1 && state.empActiveTimer <= 0) {
        state.empPowerUps.push(new EMP(null, null, width, height));
    }
}

function createRocket(
    state: T.GameState,
    type: string,
    width: number,
    height: number,
    difficulty: T.DifficultySetting
) {
    const speedBonus = difficulty.enemySpeedBonus || 1;
    const difficultyScale = state.currentWave > 5 ? 1 + (state.currentWave - 5) * 0.15 : 1;
    const speedMultiplier = (1 + state.currentWave * 0.05) * difficultyScale * speedBonus;
    const sizeMultiplier = difficulty.missileSizeMultiplier;

    let newRocket: T.Rocket | undefined;

    const rocketConstructors: Record<string, () => T.Rocket> = {
        standard: () =>
            new Rocket(
                undefined,
                undefined,
                undefined,
                undefined,
                width,
                sizeMultiplier,
                speedMultiplier,
                loadedSprites.standardRocket
            ),
        mirv: () => new MirvRocket(width, height, sizeMultiplier, speedMultiplier, loadedSprites.mirvRocket),
        stealth: () => new StealthRocket(width, sizeMultiplier, speedMultiplier, loadedSprites.stealthRocket),
        swarmer: () => new SwarmerRocket(width, height, sizeMultiplier, speedMultiplier, loadedSprites.swarmerRocket),
        flare_rocket: () => new FlareRocket(width, sizeMultiplier, speedMultiplier), // No sprite for this one yet
        armored: () => new ArmoredRocket(width, sizeMultiplier, speedMultiplier, loadedSprites.armoredRocket),
        designator: () =>
            new ArtilleryDesignator(
                width,
                height,
                state.cities,
                sizeMultiplier,
                speedMultiplier,
                loadedSprites.designatorRocket
            ),
    };

    if (rocketConstructors[type]) {
        newRocket = rocketConstructors[type]();
        if (state.scramblerActive && Math.random() < 0.25) {
            newRocket.vx = random(-4, 4);
            newRocket.vy *= 0.8;
        }
        state.rockets.push(newRocket);
    }
}
