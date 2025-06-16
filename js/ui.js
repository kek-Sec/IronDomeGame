/**
 * ui.js
 * * Manages all DOM manipulations and UI updates.
 * This includes updating the top info bar and showing/hiding modals.
 */
import { difficultySettings } from './config.js';

// --- DOM Element References ---
const fpsCounterEl = document.getElementById('fps-counter');
const scoreEl = document.getElementById('score');
const interceptorCountEl = document.getElementById('interceptor-count');
const waveEl = document.getElementById('wave');
const modalContainer = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-content-main');
const pauseButton = document.getElementById('pause-button');
const pauseIcon = document.getElementById('pause-icon');

/**
 * Updates the top UI bar with the current game state.
 * @param {object} state - The current game state.
 */
export function updateTopUI(state) {
    fpsCounterEl.textContent = state.fps;
    scoreEl.textContent = state.score;
    interceptorCountEl.textContent = state.remainingInterceptors;
    waveEl.textContent = state.currentWave + 1;
    
    if (state.gameState === 'IN_WAVE' || state.gameState === 'PAUSED') {
        pauseButton.style.display = 'flex';
        pauseIcon.innerHTML = state.gameState === 'PAUSED' ? '▶' : '||';
    } else {
        pauseButton.style.display = 'none';
    }
}

/**
 * Displays the initial start screen with difficulty options.
 * @param {function} startGameCallback - The function to call with the selected difficulty.
 */
export function showStartScreen(startGameCallback) {
    modalContainer.style.display = 'flex';
    let difficultyButtonsHTML = '<div class="upgrade-options">';
    for (const key in difficultySettings) {
        difficultyButtonsHTML += `<button id="start-${key}" class="modal-button" data-difficulty="${key}">${difficultySettings[key].name}</button>`;
    }
    difficultyButtonsHTML += '</div>';
    modalContent.innerHTML = `<h1>IRON DOME</h1><p>Enemy rockets are attacking. Survive the waves and protect the bases. Please select a difficulty to begin.</p>${difficultyButtonsHTML}`;
    for (const key in difficultySettings) {
        document.getElementById(`start-${key}`).addEventListener('click', (e) => {
            startGameCallback(e.target.getAttribute('data-difficulty'));
        });
    }
}

/**
 * Displays the upgrade screen between waves.
 * @param {object} state - The current game state.
 * @param {object} callbacks - An object containing callback functions for the buttons.
 * @param {object} config - The game's configuration object.
 */
export function showBetweenWaveScreen(state, callbacks, config) {
    const { score, currentWave, cities, turrets } = state;
    const { upgradeInterceptorsCallback, upgradeRepairCallback, nextWaveCallback, upgradeTurretCallback, upgradeSpeedCallback, upgradeBlastCallback } = callbacks;
    const { upgradeCosts, maxTurrets } = config;

    const destroyedCitiesCount = cities.filter(c => c.isDestroyed).length;
    modalContainer.style.display = 'flex';
    modalContent.innerHTML = `
        <h1>WAVE ${currentWave + 1} COMPLETE</h1>
        <p class="game-over-stats">Score: ${score}</p>
        <div class="upgrade-options">
            <button id="upgrade-interceptors" class="modal-button" ${score < upgradeCosts.interceptors ? 'disabled' : ''}>+5 Interceptors (Cost: ${upgradeCosts.interceptors})</button>
            <button id="upgrade-repair" class="modal-button" ${score < upgradeCosts.repairCity || destroyedCitiesCount === 0 ? 'disabled' : ''}>Repair Base (Cost: ${upgradeCosts.repairCity})</button>
            <button id="upgrade-turret" class="modal-button" ${score < upgradeCosts.automatedTurret || turrets.length >= maxTurrets ? 'disabled' : ''}>Build Turret (Cost: ${upgradeCosts.automatedTurret})</button>
            <button id="upgrade-speed" class="modal-button" ${score < upgradeCosts.interceptorSpeed ? 'disabled' : ''}>Upgrade Speed (Cost: ${upgradeCosts.interceptorSpeed})</button>
            <button id="upgrade-blast" class="modal-button" ${score < upgradeCosts.blastRadius ? 'disabled' : ''}>Upgrade Blast (Cost: ${upgradeCosts.blastRadius})</button>
            <button id="next-wave-button" class="modal-button">START WAVE ${currentWave + 2}</button>
        </div>
    `;

    document.getElementById('upgrade-interceptors').addEventListener('click', upgradeInterceptorsCallback);
    document.getElementById('upgrade-repair').addEventListener('click', upgradeRepairCallback);
    document.getElementById('upgrade-turret').addEventListener('click', upgradeTurretCallback);
    document.getElementById('upgrade-speed').addEventListener('click', upgradeSpeedCallback);
    document.getElementById('upgrade-blast').addEventListener('click', upgradeBlastCallback);
    document.getElementById('next-wave-button').addEventListener('click', nextWaveCallback);
}

/**
 * Displays the game over screen.
 * @param {object} state - The final game state.
 * @param {function} restartCallback - The function to call when the restart button is clicked.
 */
export function showGameOverScreen(state, restartCallback) {
    const { score, currentWave } = state;
    modalContainer.style.display = 'flex';
    modalContent.classList.add('game-over');
    modalContent.innerHTML = `<h1>MISSION FAILED</h1><p class="game-over-stats">FINAL SCORE: ${score}</p><p class="game-over-stats">WAVES SURVIVED: ${currentWave}</p><p>The defense has fallen. The war is not over.</p><button id="restart-button" class="modal-button">TRY AGAIN</button>`;
    document.getElementById('restart-button').addEventListener('click', () => {
        modalContent.classList.remove('game-over');
        restartCallback();
    });
}

/**
 * Displays the pause screen.
 * @param {function} resumeCallback 
 * @param {function} restartCallback 
 */
export function showPauseScreen(resumeCallback, restartCallback) {
    modalContainer.style.display = 'flex';
    modalContent.classList.remove('game-over');
    modalContent.innerHTML = `
        <h1>PAUSED</h1>
        <div class="upgrade-options">
            <button id="resume-button" class="modal-button">RESUME</button>
            <button id="restart-button-pause" class="modal-button">RESTART</button>
        </div>
    `;
    document.getElementById('resume-button').addEventListener('click', resumeCallback);
    document.getElementById('restart-button-pause').addEventListener('click', restartCallback);
}


export function hideModal() { modalContainer.style.display = 'none'; }