/**
 * ui.js
 * * Manages all DOM manipulations and UI updates.
 */
import { difficultySettings } from './config.js';
import { perks } from './perks.js';
import { savePlayerData } from './saveManager.js';

// --- DOM Element References ---
const fpsCounterEl = document.getElementById('fps-counter');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const waveEl = document.getElementById('wave');
const modalContainer = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-content-main');
const pauseButton = document.getElementById('pause-button');
const pauseIcon = document.getElementById('pause-icon');
const bossUiContainer = document.getElementById('boss-ui-container');
const bossNameEl = document.getElementById('boss-name');
const bossHealthBarEl = document.getElementById('boss-health-bar');


export function updateTopUI(state) {
    fpsCounterEl.textContent = state.fps;
    scoreEl.textContent = state.score;
    coinsEl.textContent = state.coins;
    waveEl.textContent = state.currentWave + 1;
    
    if (state.gameState === 'IN_WAVE' || state.gameState === 'PAUSED') {
        pauseButton.style.display = 'flex';
        pauseIcon.innerHTML = state.gameState === 'PAUSED' ? '▶' : '||';
    } else {
        pauseButton.style.display = 'none';
    }
}

export function updateBossUI(boss) {
    if (boss) {
        bossUiContainer.style.display = 'block';
        bossNameEl.textContent = boss.name;
        const healthPercentage = (boss.health / boss.maxHealth) * 100;
        bossHealthBarEl.style.width = `${Math.max(0, healthPercentage)}%`;
    } else {
        bossUiContainer.style.display = 'none';
    }
}

export function showStartScreen(startGameCallback, showArmoryCallback) {
    modalContainer.style.display = 'flex';
    let difficultyButtonsHTML = '<div class="upgrade-options">';
    for (const key in difficultySettings) {
        difficultyButtonsHTML += `<button id="start-${key}" class="modal-button" data-difficulty="${key}">${difficultySettings[key].name}</button>`;
    }
    difficultyButtonsHTML += '</div>';
    modalContent.innerHTML = `<h1>IRON DOME</h1><p>Enemy rockets are attacking. Survive the waves and protect the bases.</p>${difficultyButtonsHTML}<button id="armory-button" class="armory-button">Armory</button>`;
    
    for (const key in difficultySettings) {
        document.getElementById(`start-${key}`).addEventListener('click', (e) => {
            startGameCallback(e.target.getAttribute('data-difficulty'));
        });
    }
    document.getElementById('armory-button').addEventListener('click', showArmoryCallback);
}

export function showArmoryScreen(playerData) {
    modalContainer.style.display = 'flex';
    let perkHTML = '<div class="perk-grid">';
    for (const key in perks) {
        const perk = perks[key];
        const isUnlocked = playerData.unlockedPerks[key];
        const canAfford = playerData.prestigePoints >= perk.cost;

        perkHTML += `
            <div class="perk-card ${isUnlocked ? 'unlocked' : ''}">
                <h3>${perk.name}</h3>
                <p>${perk.description}</p>
                <button 
                    class="perk-button" 
                    id="perk-${key}" 
                    ${isUnlocked || !canAfford ? 'disabled' : ''}
                >
                    ${isUnlocked ? 'UNLOCKED' : `Cost: ${perk.cost}`}
                </button>
            </div>
        `;
    }
    perkHTML += '</div>';
    
    modalContent.innerHTML = `
        <h1>ARMORY</h1>
        <p class="prestige-points">Prestige Points: ${playerData.prestigePoints}</p>
        ${perkHTML}
        <button id="back-to-menu-button" class="modal-button">Main Menu</button>
    `;

    // Add event listeners for perk purchases
    for (const key in perks) {
        if (!playerData.unlockedPerks[key]) {
            const perkButton = document.getElementById(`perk-${key}`);
            if (perkButton) {
                perkButton.addEventListener('click', () => {
                    const perk = perks[key];
                    if (playerData.prestigePoints >= perk.cost) {
                        playerData.prestigePoints -= perk.cost;
                        playerData.unlockedPerks[key] = true;
                        savePlayerData(playerData);
                        showArmoryScreen(playerData); // Re-render the screen
                    }
                });
            }
        }
    }
    document.getElementById('back-to-menu-button').addEventListener('click', () => showStartScreen(() => location.reload(), () => showArmoryScreen(playerData)));
}


export function showBetweenWaveScreen(state, callbacks, config) {
    const { score, coins, currentWave, cities, turrets, basesAreArmored, turretFireRateLevel, turretRangeLevel, activePerks } = state;
    const { upgradeRepairCallback, nextWaveCallback, upgradeTurretCallback, upgradeSpeedCallback, upgradeBlastCallback, upgradeBaseArmorCallback, upgradeNukeCallback, upgradeTurretSpeedCallback, upgradeTurretRangeCallback, upgradeHomingMineCallback } = callbacks;
    const { upgradeCosts, maxTurrets } = config;

    // Perk check for nuke availability
    const nukeIsPurchasable = !state.nukeAvailable || activePerks.surplusValue;

    const shopItems = [
        { id: 'repair', title: 'Repair Base', desc: 'Repair one of your destroyed bases.', cost: upgradeCosts.repairCity, available: cities.some(c => c.isDestroyed) },
        { id: 'turret', title: 'Build Turret', desc: 'Construct an automated defense turret. Max 2.', cost: upgradeCosts.automatedTurret, available: turrets.length < maxTurrets, maxed: turrets.length >= maxTurrets },
        { id: 'homingMine', title: 'Buy Homing Mine', desc: 'Buy a proximity mine to place on the ground. Click the ground to deploy.', cost: upgradeCosts.homingMine, available: true },
        { id: 'speed', title: 'Increase Interceptor Speed', desc: 'Permanently increase the speed of your interceptors.', cost: upgradeCosts.interceptorSpeed, available: true },
        { id: 'blast', title: 'Increase Blast Radius', desc: 'Permanently increase the explosion radius of your interceptors.', cost: upgradeCosts.blastRadius, available: true },
        { id: 'turretSpeed', title: `Upgrade Turret Speed (Lvl ${turretFireRateLevel})`, desc: 'Permanently increase the fire rate of all turrets. Max Lvl 3.', cost: upgradeCosts.turretSpeed, available: turrets.length > 0 && turretFireRateLevel < 3, maxed: turretFireRateLevel >= 3 },
        { id: 'turretRange', title: `Upgrade Turret Range (Lvl ${turretRangeLevel})`, desc: 'Permanently increase the engagement range of all turrets. Max Lvl 3.', cost: upgradeCosts.turretRange, available: turrets.length > 0 && turretRangeLevel < 3, maxed: turretRangeLevel >= 3 },
        { id: 'baseArmor', title: 'Armor Plating', desc: 'Apply armor to all bases, allowing them to survive one extra hit.', cost: upgradeCosts.baseArmor, available: !basesAreArmored, maxed: basesAreArmored },
        { id: 'nuke', title: 'Nuke Interceptor', desc: 'A single-use interceptor with a massive blast radius. One per wave.', cost: upgradeCosts.nuke, available: nukeIsPurchasable, maxed: !nukeIsPurchasable && !activePerks.surplusValue }
    ];

    let shopHTML = '<div class="shop-grid">';
    shopItems.forEach(item => {
        // Apply Rapid Deployment discount if applicable
        let currentCost = item.cost;
        if (activePerks.rapidDeployment && !state.firstUpgradePurchased) {
            currentCost = Math.ceil(currentCost * 0.75);
        }

        const affordable = coins >= currentCost;
        const disabled = !affordable || !item.available;
        const maxed = item.maxed;
        let statusText = `<div class="cost">Cost: ${currentCost} Coins</div>`;
        if (maxed) statusText = `<div class="cost">${item.id === 'baseArmor' ? 'APPLIED' : (item.id === 'nuke' ? 'OWNED' : 'MAXED')}</div>`;

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
        <div class="end-wave-stats">
            <p class="game-over-stats">SCORE: ${score}</p>
            <p class="game-over-stats">COINS: ${coins}</p>
        </div>
        ${shopHTML}
        <button id="next-wave-button" class="modal-button">START WAVE ${currentWave + 2}</button>
    `;

    document.getElementById('shop-repair').addEventListener('click', upgradeRepairCallback);
    document.getElementById('shop-turret').addEventListener('click', upgradeTurretCallback);
    document.getElementById('shop-speed').addEventListener('click', upgradeSpeedCallback);
    document.getElementById('shop-blast').addEventListener('click', upgradeBlastCallback);
    document.getElementById('shop-turretSpeed').addEventListener('click', upgradeTurretSpeedCallback);
    document.getElementById('shop-turretRange').addEventListener('click', upgradeTurretRangeCallback);
    document.getElementById('shop-homingMine').addEventListener('click', upgradeHomingMineCallback);
    document.getElementById('shop-baseArmor').addEventListener('click', upgradeBaseArmorCallback);
    document.getElementById('shop-nuke').addEventListener('click', upgradeNukeCallback);
    document.getElementById('next-wave-button').addEventListener('click', nextWaveCallback);
}


export function showGameOverScreen(state, restartCallback, pointsEarned) {
    const { score, currentWave } = state;
    modalContainer.style.display = 'flex';
    modalContent.classList.add('game-over');
    modalContent.innerHTML = `
        <h1>MISSION FAILED</h1>
        <p class="game-over-stats">FINAL SCORE: ${score}</p>
        <p class="game-over-stats">WAVES SURVIVED: ${currentWave}</p>
        <p class="prestige-points">PRESTIGE EARNED: ${pointsEarned}</p>
        <button id="restart-button" class="modal-button">TRY AGAIN</button>
    `;
    document.getElementById('restart-button').addEventListener('click', () => {
        modalContent.classList.remove('game-over');
        restartCallback();
    });
}

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