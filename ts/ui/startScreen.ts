// ts/ui/startScreen.ts
import { difficultySettings } from '../config';
import { loadPlayerData } from '../saveManager';
import { StartGameCallback, PlayerData } from '../types';
import { modalContent } from './domElements';
import { showModal } from './modal';

export function showStartScreen(startGameCallback: StartGameCallback, showArmoryCallback: () => void): void {
    const playerData = loadPlayerData();
    showModal();

    let difficultyCardsHTML = '<div class="difficulty-card-grid">';
    for (const key in difficultySettings) {
        const diff = difficultySettings[key as keyof typeof difficultySettings];
        const highScore = playerData.highScores[key as keyof PlayerData['highScores']] || 0;
        difficultyCardsHTML += `
            <div class="difficulty-card" id="start-${key}" data-difficulty="${key}">
                <h3>${diff.name}</h3>
                <p>${diff.description}</p>
                <div class="card-footer">
                    <div class="difficulty-summary">
                        <span>Starts with ${diff.startingCoins} Coins</span>
                    </div>
                    <div class="high-score-display">
                        <span class="high-score-label">HIGH SCORE</span>
                        <span class="high-score-value">${highScore.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }
    difficultyCardsHTML += '</div>';

    modalContent.innerHTML = `
        <div class="start-screen-header">
            <h1>IRON DOME</h1>
            <button id="armory-button" class="armory-button">
                <span class="armory-icon">🛡️</span> Armory
            </button>
        </div>
        <p class="start-screen-subtitle">Select your engagement difficulty, Commander.</p>
        ${difficultyCardsHTML}
    `;

    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', (e) => {
            let target = e.currentTarget as HTMLElement;
            if (target && target.dataset.difficulty) {
                startGameCallback(target.dataset.difficulty as 'easy' | 'normal' | 'hard');
            }
        });
    });

    document.getElementById('armory-button')?.addEventListener('click', showArmoryCallback);
}