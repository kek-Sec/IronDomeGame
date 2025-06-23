// ts/ui.ts
// * Manages and exports all UI-related functions.

import { difficultySettings, rocketInfo } from './config';
import { loadPlayerData } from './saveManager';
import type { GameState, HiveCarrier, StartGameCallback, PlayerData } from './types';
import {
    fpsCounterEl,
    scoreEl,
    coinsEl,
    waveEl,
    modalContainer,
    modalContent,
    pauseButton,
    pauseIcon,
    bossUiContainer,
    bossNameEl,
    bossHealthBarEl,
} from './ui/domElements';

export { showBetweenWaveScreen } from './ui/shopScreen';
export { showArmoryScreen } from './ui/armoryScreen';


// --- Core UI Functions ---

export function updateTopUI(state: GameState): void {
    fpsCounterEl.textContent = state.fps.toString();
    scoreEl.textContent = state.score.toLocaleString();
    coinsEl.textContent = state.coins.toLocaleString();
    waveEl.textContent = (state.currentWave + 1).toString();

    const isPausable = state.gameState === 'IN_WAVE' || state.gameState === 'PAUSED';
    pauseButton.style.display = isPausable ? 'flex' : 'none';
    if(isPausable) {
        pauseIcon.innerHTML = state.gameState === 'PAUSED' ? '▶' : '||';
    }
}

export function updateBossUI(boss: HiveCarrier | null): void {
    if (boss) {
        bossUiContainer.style.display = 'block';
        bossNameEl.textContent = boss.name;
        const healthPercentage = (boss.health / boss.maxHealth) * 100;
        bossHealthBarEl.style.width = `${Math.max(0, healthPercentage)}%`;
    } else {
        bossUiContainer.style.display = 'none';
    }
}

// --- Modal and Screen Management ---

export function hideModal(): void {
    modalContainer.style.display = 'none';
}

export function showModalWithContent(innerHTML: string, className: string = ''): void {
    modalContainer.style.display = 'flex';
    modalContent.className = 'modal-content'; // Reset classes
    if (className) {
        modalContent.classList.add(className);
    }
    modalContent.innerHTML = innerHTML;
}

export function showStartScreen(startGameCallback: StartGameCallback, showArmoryCallback: () => void): void {
    const playerData = loadPlayerData();
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

    const fullHTML = `
        <div class="start-screen-header">
            <h1>IRON DOME</h1>
            <button id="armory-button" class="armory-button">
                <span class="armory-icon">🛡️</span> Armory
            </button>
        </div>
        <p class="start-screen-subtitle">Select your engagement difficulty, Commander.</p>
        ${difficultyCardsHTML}
    `;

    showModalWithContent(fullHTML);

    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const difficulty = (e.currentTarget as HTMLElement).dataset.difficulty as 'easy' | 'normal' | 'hard';
            startGameCallback(difficulty);
        });
    });
    document.getElementById('armory-button')?.addEventListener('click', showArmoryCallback);
}

export function showRocketInfoScreen(closeCallback: () => void): void {
    let rocketHTML = '<div class="rocket-info-grid">';
    for (const key in rocketInfo) {
        const rocket = rocketInfo[key as keyof typeof rocketInfo];
        rocketHTML += `
            <div class="rocket-info-card">
                <h3>
                    <span>${rocket.name}</span>
                    <span class="threat-level threat-${rocket.threat.toLowerCase()}">${rocket.threat} Threat</span>
                </h3>
                <p>${rocket.description}</p>
            </div>
        `;
    }
    rocketHTML += '</div>';

    const fullHTML = `
        <h1>ROCKET BESTIARY</h1>
        ${rocketHTML}
        <button id="close-info-button" class="modal-button">CLOSE</button>
    `;

    showModalWithContent(fullHTML);

    const closeButton = document.getElementById('close-info-button');
    const backgroundClickHandler = (e: MouseEvent) => {
        if (e.target === modalContainer) {
            closeButton?.removeEventListener('click', closeCallback);
            modalContainer.removeEventListener('click', backgroundClickHandler);
            closeCallback();
        }
    };
    
    closeButton?.addEventListener('click', closeCallback);
    modalContainer.addEventListener('click', backgroundClickHandler);
}

export function showGameOverScreen(state: GameState, restartCallback: () => void, pointsEarned: number, newHighScore: boolean): void {
    const { score, currentWave } = state;
    const newHighScoreHTML = newHighScore ? `<p class="new-high-score-banner">🏆 NEW HIGH SCORE! 🏆</p>` : '';

    const fullHTML = `
        <h1>MISSION FAILED</h1>
        ${newHighScoreHTML}
        <p class="game-over-stats">FINAL SCORE: ${score.toLocaleString()}</p>
        <p class="game-over-stats">WAVES SURVIVED: ${currentWave + 1}</p>
        <p class="prestige-points">PRESTIGE EARNED: ${pointsEarned.toLocaleString()}</p>
        <button id="restart-button" class="modal-button">TRY AGAIN</button>
    `;

    showModalWithContent(fullHTML, 'game-over');
    document.getElementById('restart-button')?.addEventListener('click', restartCallback);
}

export function showPauseScreen(resumeCallback: () => void, restartCallback: () => void): void {
    const fullHTML = `
        <h1>PAUSED</h1>
        <div class="upgrade-options">
            <button id="resume-button" class="modal-button">RESUME</button>
            <button id="restart-button-pause" class="modal-button">RESTART</button>
        </div>
    `;
    showModalWithContent(fullHTML);
    document.getElementById('resume-button')?.addEventListener('click', resumeCallback);
    document.getElementById('restart-button-pause')?.addEventListener('click', restartCallback);
}