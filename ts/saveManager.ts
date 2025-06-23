// ts/saveManager.ts
import { perks } from './perks';
import { PlayerData } from './types';

const SAVE_KEY = 'ironDomePlayerData_TS';

function getInitialPlayerData(): PlayerData {
    const unlockedPerks: Record<string, boolean> = {};
    Object.keys(perks).forEach((key) => {
        unlockedPerks[key] = false;
    });

    return {
        prestigePoints: 0,
        unlockedPerks,
        highScores: {
            easy: 0,
            normal: 0,
            hard: 0,
        },
    };
}

export function loadPlayerData(): PlayerData {
    const initialData = getInitialPlayerData();
    try {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Merge saved data with initial data to ensure all properties exist
            return {
                ...initialData,
                ...parsedData,
                highScores: {
                    ...initialData.highScores,
                    ...(parsedData.highScores || {}),
                },
                unlockedPerks: {
                    ...initialData.unlockedPerks,
                    ...(parsedData.unlockedPerks || {}),
                },
            };
        }
    } catch (error) {
        console.error('Failed to load player data:', error);
        // If loading fails, clear corrupted data and return initial data
        localStorage.removeItem(SAVE_KEY);
    }
    return initialData;
}

export function savePlayerData(playerData: PlayerData): void {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(playerData));
    } catch (error) {
        console.error('Failed to save player data:', error);
    }
}