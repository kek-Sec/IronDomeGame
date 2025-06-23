// ts/ui/armoryScreen.ts

import { perks } from '../perks';
import { savePlayerData } from '../saveManager';
import { showStartScreen } from '../ui';
import type { PlayerData, StartGameCallback } from '../types';
import { modalContainer, modalContent } from './domElements';

const perkIcons: Record<string, string> = {
    veteranCommander: '🏆',
    advancedFortifications: '🧱',
    rapidDeployment: '⚡',
    efficientInterceptors: '💥',
    surplusValue: '☢️',
    extraMine: '💣',
};

export function showArmoryScreen(playerData: PlayerData, startGameCallback: StartGameCallback): void {
    modalContainer.style.display = 'flex';
    modalContent.classList.add('armory');

    let perkHTML = '<div class="perk-grid">';
    for (const key in perks) {
        const perk = perks[key as keyof typeof perks];
        const isUnlocked = playerData.unlockedPerks[key];
        const canAfford = playerData.prestigePoints >= perk.cost;

        perkHTML += `
            <div class="perk-card ${isUnlocked ? 'unlocked' : ''} ${!canAfford && !isUnlocked ? 'unaffordable' : ''}">
                <div class="perk-header">
                    <div class="perk-icon">${perkIcons[key] || '⚙️'}</div>
                    <h3>${perk.name}</h3>
                </div>
                <p class="perk-description">${perk.description}</p>
                <button
                    class="perk-button"
                    id="perk-${key}"
                    ${isUnlocked || !canAfford ? 'disabled' : ''}
                >
                    ${isUnlocked ? 'UNLOCKED' : `COST: ${perk.cost}`}
                </button>
            </div>
        `;
    }
    perkHTML += '</div>';

    modalContent.innerHTML = `
        <div class="armory-header">
            <h1>ARMORY</h1>
            <div class="prestige-points">
                Prestige Points: <span>${playerData.prestigePoints}</span>
            </div>
        </div>
        ${perkHTML}
        <button id="back-to-menu-button" class="modal-button">Main Menu</button>
    `;

    // Add event listeners for perk purchases
    for (const key in perks) {
        if (!playerData.unlockedPerks[key]) {
            const perkButton = document.getElementById(`perk-${key}`);
            if (perkButton) {
                perkButton.addEventListener('click', () => {
                    const perk = perks[key as keyof typeof perks];
                    if (playerData.prestigePoints >= perk.cost) {
                        playerData.prestigePoints -= perk.cost;
                        playerData.unlockedPerks[key] = true;
                        savePlayerData(playerData);
                        showArmoryScreen(playerData, startGameCallback); // Pass callback again on re-render
                    }
                });
            }
        }
    }

    // The Armory needs a way to show itself again, so we pass `showArmoryScreen` to the `showStartScreen` call.
    const showArmoryAgain = () => showArmoryScreen(playerData, startGameCallback);
    document
        .getElementById('back-to-menu-button')
        ?.addEventListener('click', () => showStartScreen(startGameCallback, showArmoryAgain));
}
