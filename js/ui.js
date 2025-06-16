/**
 * ui.js
 * * Manages all DOM manipulations and UI updates.
 * This includes updating the top info bar and showing/hiding modals.
 */
import { difficultySettings } from './config.js';

// --- DOM Element References ---
const fpsCounterEl = document.getElementById('fps-counter');
const scoreEl = document.getElementById('score');
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
 * Displays the upgrade screen between waves using a new card layout.
 * @param {object} state - The current game state.
 * @param {object} callbacks - An object containing callback functions for the buttons.
 * @param {object} config - The game's configuration object.
 */
export function showBetweenWaveScreen(state, callbacks, config) {
    const { score, currentWave, cities, turrets, basesAreArmored, turretFireRateLevel } = state;
    const { upgradeRepairCallback, nextWaveCallback, upgradeTurretCallback, upgradeSpeedCallback, upgradeBlastCallback, upgradeBaseArmorCallback, upgradeNukeCallback, upgradeTurretSpeedCallback } = callbacks;
    const { upgradeCosts, maxTurrets } = config;

    const shopItems = [
        { id: 'repair', title: 'Repair Base', desc: 'Repair one of your destroyed bases.', cost: upgradeCosts.repairCity, available: cities.some(c => c.isDestroyed) },
        { id: 'turret', title: 'Build Turret', desc: 'Construct an automated defense turret. Max 2.', cost: upgradeCosts.automatedTurret, available: turrets.length < maxTurrets },
        { id: 'speed', title: 'Increase Interceptor Speed', desc: 'Permanently increase the speed of your interceptors.', cost: upgradeCosts.interceptorSpeed, available: true },
        { id: 'blast', title: 'Increase Blast Radius', desc: 'Permanently increase the explosion radius of your interceptors.', cost: upgradeCosts.blastRadius, available: true },
        { id: 'turretSpeed', title: 'Upgrade Turret Speed', desc: 'Permanently increase the fire rate of all turrets. Max Lvl 3.', cost: upgradeCosts.turretSpeed, available: turrets.length > 0 && turretFireRateLevel < 3, maxed: turretFireRateLevel >= 3 },
        { id: 'baseArmor', title: 'Armor Plating', desc: 'Apply armor to all bases, allowing them to survive one extra hit.', cost: upgradeCosts.baseArmor, available: !basesAreArmored, maxed: basesAreArmored },
        { id: 'nuke', title: 'Nuke Interceptor', desc: 'A single-use interceptor with a massive blast radius. One per wave.', cost: upgradeCosts.nuke, available: !state.nukeAvailable, maxed: state.nukeAvailable }
    ];

    let shopHTML = '<div class="shop-grid">';
    shopItems.forEach(item => {
        const affordable = score >= item.cost;
        const disabled = !affordable || !item.available;
        const maxed = item.maxed;
        let statusText = `<div class="cost">Cost: ${item.cost}</div>`;
        if (maxed) statusText = `<div class="cost">${item.id === 'baseArmor' ? 'APPLIED' : 'OWNED'}</div>`;

        shopHTML += `
            <div class="shop-card ${disabled ? 'disabled' : ''} ${maxed ? 'maxed' : ''}" id="shop-${item.id}">
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                ${statusText}
            </div>
        `;
    });
    shopHTML += '</div>';

    modalContainer.style.display = 'flex';
    modalContent.innerHTML = `
        <h1>WAVE ${currentWave + 1} COMPLETE</h1>
        <p class="game-over-stats">SCORE: ${score}</p>
        ${shopHTML}
        <button id="next-wave-button" class="modal-button">START WAVE ${currentWave + 2}</button>
    `;

    document.getElementById('shop-repair').addEventListener('click', upgradeRepairCallback);
    document.getElementById('shop-turret').addEventListener('click', upgradeTurretCallback);
    document.getElementById('shop-speed').addEventListener('click', upgradeSpeedCallback);
    document.getElementById('shop-blast').addEventListener('click', upgradeBlastCallback);
    document.getElementById('shop-turretSpeed').addEventListener('click', upgradeTurretSpeedCallback);
    document.getElementById('shop-baseArmor').addEventListener('click', upgradeBaseArmorCallback);
    document.getElementById('shop-nuke').addEventListener('click', upgradeNukeCallback);
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