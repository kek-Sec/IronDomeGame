// ts/ui/gameOverScreen.ts
import { GameState } from '../types';
import { modalContent } from './domElements';
import { showModal } from './modal';

export function showGameOverScreen(
    state: GameState,
    restartCallback: () => void,
    pointsEarned: number,
    newHighScore: boolean
): void {
    showModal('game-over');
    const { score, currentWave } = state;

    const newHighScoreHTML = newHighScore ? `<p class="new-high-score-banner">🏆 NEW HIGH SCORE! 🏆</p>` : '';

    modalContent.innerHTML = `
        <h1>MISSION FAILED</h1>
        ${newHighScoreHTML}
        <p class="game-over-stats">FINAL SCORE: ${score.toLocaleString()}</p>
        <p class="game-over-stats">WAVES SURVIVED: ${currentWave + 1}</p>
        <p class="prestige-points">PRESTIGE EARNED: ${pointsEarned.toLocaleString()}</p>
        <button id="restart-button" class="modal-button">TRY AGAIN</button>
    `;
    
    document.getElementById('restart-button')?.addEventListener('click', restartCallback);
}