// ts/ui.ts
// * Manages and exports all UI-related functions, acting as a barrel file.

// Re-export functions from the new, modularized UI files
export { showBetweenWaveScreen } from './ui/shopScreen';
export { showArmoryScreen } from './ui/armoryScreen';

// --- Core UI Functions still in this file ---
import { difficultySettings, rocketInfo } from './config';
import { savePlayerData, loadPlayerData } from './saveManager';
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

export function updateTopUI(state: GameState): void {
    fpsCounterEl.textContent = state.fps.toString();
    scoreEl.textContent = state.score.toString();
    coinsEl.textContent = state.coins.toString();
    waveEl.textContent = (state.currentWave + 1).toString();

    if (state.gameState === 'IN_WAVE' || state.gameState === 'PAUSED') {
        pauseButton.style.display = 'flex';
        pauseIcon.innerHTML = state.gameState === 'PAUSED' ? '▶' : '||';
    } else {
        pauseButton.style.display = 'none';
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

export function showStartScreen(startGameCallback: StartGameCallback, showArmoryCallback: () => void): void {
    const playerData = loadPlayerData();
    modalContainer.style.display = 'flex';
    modalContent.classList.remove('armory');

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
                    <div class="high-score">
                        🏆 High Score: <span>${highScore.toLocaleString()}</span>
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

    for (const key in difficultySettings) {
        document.getElementById(`start-${key}`)?.addEventListener('click', (e: Event) => {
            let target = e.target as HTMLElement | null;
            while (target && !target.dataset.difficulty) {
                target = target.parentElement;
            }
            if (target && target.dataset.difficulty) {
                startGameCallback(target.dataset.difficulty as 'easy' | 'normal' | 'hard');
            }
        });
    }
    document.getElementById('armory-button')?.addEventListener('click', showArmoryCallback);
}

export function showRocketInfoScreen(closeCallback: () => void): void {
    modalContainer.style.display = 'flex';
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

    modalContent.innerHTML = `
        <h1>ROCKET BESTIARY</h1>
        ${rocketHTML}
        <button id="close-info-button" class="modal-button">CLOSE</button>
    `;

    const cleanupAndClose = (): void => {
        modalContainer.removeEventListener('click', backgroundClickHandler);
        closeCallback();
    };

    const backgroundClickHandler = (e: MouseEvent): void => {
        if (e.target === modalContainer) {
            cleanupAndClose();
        }
    };

    document.getElementById('close-info-button')?.addEventListener('click', cleanupAndClose);
    modalContainer.addEventListener('click', backgroundClickHandler);
}

export function showGameOverScreen(
    state: GameState,
    restartCallback: () => void,
    pointsEarned: number,
    newHighScore: boolean
): void {
    const { score, currentWave } = state;
    modalContainer.style.display = 'flex';
    modalContent.classList.add('game-over');

    const newHighScoreHTML = newHighScore ? `<p class="new-high-score-banner">🏆 NEW HIGH SCORE! 🏆</p>` : '';

    modalContent.innerHTML = `
        <h1>MISSION FAILED</h1>
        ${newHighScoreHTML}
        <p class="game-over-stats">FINAL SCORE: ${score.toLocaleString()}</p>
        <p class="game-over-stats">WAVES SURVIVED: ${currentWave + 1}</p>
        <p class="prestige-points">PRESTIGE EARNED: ${pointsEarned.toLocaleString()}</p>
        <button id="restart-button" class="modal-button">TRY AGAIN</button>
    `;
    document.getElementById('restart-button')?.addEventListener('click', () => {
        modalContent.classList.remove('game-over');
        restartCallback();
    });
}

export function showPauseScreen(resumeCallback: () => void, restartCallback: () => void): void {
    modalContainer.style.display = 'flex';
    modalContent.classList.remove('game-over');
    modalContent.innerHTML = `
        <h1>PAUSED</h1>
        <div class="upgrade-options">
            <button id="resume-button" class="modal-button">RESUME</button>
            <button id="restart-button-pause" class="modal-button">RESTART</button>
        </div>
    `;
    document.getElementById('resume-button')?.addEventListener('click', resumeCallback);
    document.getElementById('restart-button-pause')?.addEventListener('click', restartCallback);
}

export function hideModal(): void {
    modalContainer.style.display = 'none';
}