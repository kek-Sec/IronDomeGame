// ts/waveManager.ts
import { waveDefinitions } from './config';
import { WaveDefinition } from './types';

/**
 * Gets the definition for a specific wave.
 * Handles pre-defined waves and generates procedural waves for endless play.
 * @param waveNumber - The current wave number (0-indexed).
 * @returns The wave definition object.
 */
export function getWaveDefinition(waveNumber: number): WaveDefinition {
    // Return a pre-defined wave if it exists
    if (waveNumber < waveDefinitions.length) {
        return waveDefinitions[waveNumber];
    }

    // --- Procedural Generation for Endless Waves ---
    const waveFactor = waveNumber - waveDefinitions.length + 1;
    const totalRockets = 15 + waveFactor * 2;
    const waveData: WaveDefinition = { isBossWave: false, composition: [] };

    // Every 5th procedural wave is a boss wave
    if (waveFactor > 0 && waveFactor % 5 === 0) {
        waveData.isBossWave = true;
        waveData.bossType = 'hiveCarrier';
        return waveData;
    }

    // Define the pool of available rocket types based on wave progression
    const availableTypes = ['standard', 'standard', 'standard', 'mirv'];
    if (waveNumber > 8) availableTypes.push('stealth');
    if (waveNumber > 10) availableTypes.push('swarmer');
    if (waveNumber > 12) availableTypes.push('armored');
    if (waveNumber > 14) availableTypes.push('flare_rocket');
    if (waveNumber > 6) availableTypes.push('designator');

    // Create the wave composition by randomly picking from the available types
    for (let i = 0; i < totalRockets; i++) {
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        waveData.composition!.push(randomType);
    }

    return waveData;
}