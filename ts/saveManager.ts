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
    try {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (savedData) {
            const parsedData: PlayerData = JSON.parse(savedData);

            if (!parsedData.highScores) {
                parsedData.highScores = { easy: 0, normal: 0, hard: 0 };
            }

            if (parsedData.unlockedPerks && parsedData.hasOwnProperty('prestigePoints')) {
                return parsedData;
            }
        }
    } catch (error) {
        console.error('Failed to load player data:', error);
    }
    return getInitialPlayerData();
}

export function savePlayerData(playerData: PlayerData): void {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(playerData));
    } catch (error) {
        console.error('Failed to save player data:', error);
    }
}
