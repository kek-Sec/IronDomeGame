/**
 * saveManager.js
 * * Handles saving and loading player data to and from localStorage.
 */

import { perks } from './perks.js';

const SAVE_KEY = 'ironDomePlayerData';

// Defines the default structure for a new player's data.
function getInitialPlayerData() {
    const unlockedPerks = {};
    Object.keys(perks).forEach(key => {
        unlockedPerks[key] = false; // All perks start as locked
    });

    return {
        prestigePoints: 0,
        unlockedPerks: unlockedPerks
    };
}

// Loads player data from localStorage.
export function loadPlayerData() {
    try {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Simple validation to ensure data structure is not malformed
            if (parsedData.unlockedPerks && parsedData.hasOwnProperty('prestigePoints')) {
                return parsedData;
            }
        }
    } catch (error) {
        console.error("Failed to load player data:", error);
    }
    // Return default data if nothing is saved or if data is corrupt
    return getInitialPlayerData();
}

// Saves player data to localStorage.
export function savePlayerData(playerData) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(playerData));
    } catch (error) {
        console.error("Failed to save player data:", error);
    }
}