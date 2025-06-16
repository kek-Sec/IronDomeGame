/**
 * ui.js
 * * Manages all DOM manipulations and UI updates.
 * This includes updating the top info bar and showing/hiding modals.
 */

// --- DOM Element References ---
const scoreEl = document.getElementById('score');
const interceptorCountEl = document.getElementById('interceptor-count');
const waveEl = document.getElementById('wave');
const modalContainer = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-content-main');

/**
 * Updates the top UI bar with the current game state.
 * @param {object} state - The current game state (score, interceptors, wave).
 */
export function updateTopUI(state) {
    scoreEl.textContent = state.score;
    interceptorCountEl.textContent = state.remainingInterceptors;
    waveEl.textContent = state.currentWave + 1;
}

/**
 * Displays the initial start screen.
 * @param {function} startGameCallback - The function to call when the start button is clicked.
 */
export function showStartScreen(startGameCallback) {
    modalContainer.style.display = 'flex';
    modalContent.innerHTML = `
        <h1>IRON DOME</h1>
        <p>Enemy rockets are attacking. Click to launch interceptors from the central battery. Survive the waves. Protect the cities.</p>
        <button id="start-button" class="modal-button">START MISSION</button>
    `;
    document.getElementById('start-button').addEventListener('click', startGameCallback);
}

/**
 * Displays the upgrade screen between waves.
 * @param {object} state - The current game state.
 * @param {object} callbacks - An object containing callback functions for the buttons.
 * @param {object} config - The game's configuration object.
 */
export function showBetweenWaveScreen(state, callbacks, config) {
    const { score, currentWave, cities } = state;
    const { upgradeInterceptorsCallback, upgradeRepairCallback, nextWaveCallback } = callbacks;
    const { upgradeCosts } = config;

    const destroyedCitiesCount = cities.filter(c => c.isDestroyed).length;
    modalContainer.style.display = 'flex';
    modalContent.innerHTML = `
        <h1>WAVE ${currentWave + 1} COMPLETE</h1>
        <p class="game-over-stats">Score: ${score}</p>
        <div class="upgrade-options">
            <button id="upgrade-interceptors" class="modal-button" ${score < upgradeCosts.interceptors ? 'disabled' : ''}>
                +5 Interceptors (Cost: ${upgradeCosts.interceptors})
            </button>
            <button id="upgrade-repair" class="modal-button" ${score < upgradeCosts.repairCity || destroyedCitiesCount === 0 ? 'disabled' : ''}>
                Repair City (Cost: ${upgradeCosts.repairCity})
            </button>
            <button id="next-wave-button" class="modal-button">START WAVE ${currentWave + 2}</button>
        </div>
    `;

    document.getElementById('upgrade-interceptors').addEventListener('click', upgradeInterceptorsCallback);
    document.getElementById('upgrade-repair').addEventListener('click', upgradeRepairCallback);
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
    modalContent.innerHTML = `
        <h1>MISSION FAILED</h1>
        <p class="game-over-stats">FINAL SCORE: ${score}</p>
        <p class="game-over-stats">WAVES SURVIVED: ${currentWave}</p>
        <p>The city has fallen. The war is not over.</p>
        <button id="restart-button" class="modal-button">TRY AGAIN</button>
    `;
    document.getElementById('restart-button').addEventListener('click', restartCallback);
}

/**
 * Hides the main modal container.
 */
export function hideModal() {
    modalContainer.style.display = 'none';
}
