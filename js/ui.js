/**
 * ui.js
 * * Manages all DOM manipulations and UI updates.
 */
import { difficultySettings, rocketInfo } from './config.js';
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
    const { 
        upgradeRepairCallback, nextWaveCallback, upgradeTurretCallback, 
        upgradeSpeedCallback, upgradeBlastCallback, upgradeBaseArmorCallback, 
        upgradeNukeCallback, upgradeTurretSpeedCallback, upgradeTurretRangeCallback, 
        upgradeHomingMineCallback, upgradeFieldReinforcementCallback, upgradeTargetingScramblerCallback 
    } = callbacks;
    const { upgradeCosts, maxTurrets } = config;

    const nukeIsPurchasable = !state.nukeAvailable || activePerks.surplusValue;
    const reinforcementNeeded = state.cities.some(c => !c.isDestroyed && !c.isArmored);

    const shopItems = [
        // Permanent Upgrades
        { id: 'speed', title: 'Interceptor Speed', desc: 'Permanently increase the speed of your interceptors.', detailedDesc: 'A permanent, stacking buff to the velocity of all interceptors you launch.', cost: upgradeCosts.interceptorSpeed, available: true },
        { id: 'blast', title: 'Blast Radius', desc: 'Permanently increase the explosion radius of your interceptors.', detailedDesc: 'Increases the Area of Effect for all normal interceptor impacts. Does not affect Nukes or Mines.', cost: upgradeCosts.blastRadius, available: true },
        { id: 'turret', title: 'Build Turret', desc: 'Construct an automated defense turret. Max 2.', detailedDesc: 'Builds a C-RAM turret that automatically fires at nearby rockets. Limited to two turrets.', cost: upgradeCosts.automatedTurret, available: turrets.length < maxTurrets, maxed: turrets.length >= maxTurrets },
        { id: 'turretSpeed', title: `Turret Speed (Lvl ${turretFireRateLevel})`, desc: 'Permanently increase the fire rate of all turrets. Max Lvl 3.', detailedDesc: 'Reduces the cooldown between bursts for all owned turrets. Stacks up to 3 times.', cost: upgradeCosts.turretSpeed, available: turrets.length > 0 && turretFireRateLevel < 3, maxed: turretFireRateLevel >= 3 },
        { id: 'turretRange', title: `Turret Range (Lvl ${turretRangeLevel})`, desc: 'Permanently increase the engagement range of all turrets. Max Lvl 3.', detailedDesc: 'Increases the detection and firing radius for all owned turrets. Stacks up to 3 times.', cost: upgradeCosts.turretRange, available: turrets.length > 0 && turretRangeLevel < 3, maxed: turretRangeLevel >= 3 },
        { id: 'baseArmor', title: 'Permanent Armor', desc: 'Permanently armor all bases, allowing them to survive one extra hit.', detailedDesc: 'All cities will start with one layer of armor for the rest of the game. Armor is consumed upon being hit.', cost: upgradeCosts.baseArmor, available: !basesAreArmored, maxed: basesAreArmored },
        // Tactical / Single-Use Items
        { id: 'nuke', title: 'Nuke (w/ EMP)', desc: 'A single-use interceptor with a massive blast and EMP effect.', detailedDesc: 'Your next interceptor is a Nuke. Its massive blast destroys most rockets instantly and also triggers a 2-second global EMP, disabling all rockets on screen.', cost: upgradeCosts.nuke, available: nukeIsPurchasable, maxed: !nukeIsPurchasable && !activePerks.surplusValue },
        { id: 'homingMine', title: 'Buy Proximity Mine', desc: 'An AOE mine that explodes when rockets get near.', detailedDesc: 'Deploys a mine on the ground at your cursor. When an enemy gets close, it detonates, destroying all rockets within a large radius.', cost: upgradeCosts.homingMine, available: true },
        { id: 'fieldReinforcement', title: 'Field Reinforcement', desc: 'Apply one layer of armor to all standing, unarmored bases.', detailedDesc: 'A temporary, one-time boost. Instantly adds one layer of armor to any of your cities that are not already armored or destroyed. The armor is consumed on the next hit.', cost: upgradeCosts.fieldReinforcement, available: reinforcementNeeded, maxed: !reinforcementNeeded },
        { id: 'targetingScrambler', title: 'Targeting Scrambler', desc: '25% chance for new rockets to be scrambled next wave.', detailedDesc: 'Activates a passive system for the next wave only. Each new rocket has a 25% chance to have its trajectory scrambled, causing it to fly off-target.', cost: upgradeCosts.targetingScrambler, available: !state.scramblerActive, maxed: state.scramblerActive },
        { id: 'repair', title: 'Repair Base', desc: 'Repair one of your destroyed bases.', detailedDesc: 'Rebuilds a single destroyed city, restoring it to full functionality.', cost: upgradeCosts.repairCity, available: cities.some(c => c.isDestroyed) },
    ];

    let shopHTML = '<div class="shop-grid">';
    shopItems.forEach(item => {
        let currentCost = item.cost;
        if (activePerks.rapidDeployment && !state.firstUpgradePurchased) {
            currentCost = Math.ceil(currentCost * 0.75);
        }

        const affordable = coins >= currentCost;
        const disabled = !affordable || !item.available;
        let statusText = `<div class="cost">Cost: ${currentCost} Coins</div>`;
        if (item.maxed) statusText = `<div class="cost">${item.id === 'targetingScrambler' ? 'ACTIVE' : (item.id === 'fieldReinforcement' ? 'MAXED' : 'MAXED')}</div>`;

        shopHTML += `
            <div class="shop-card ${disabled ? 'disabled' : ''} ${item.maxed ? 'maxed' : ''}" id="shop-${item.id}">
                <div class="info-icon">i</div>
                <div class="info-tooltip">${item.detailedDesc || item.desc}</div>
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

    // Add event listeners for all shop items
    document.getElementById('shop-speed').addEventListener('click', upgradeSpeedCallback);
    document.getElementById('shop-blast').addEventListener('click', upgradeBlastCallback);
    document.getElementById('shop-turret').addEventListener('click', upgradeTurretCallback);
    document.getElementById('shop-turretSpeed').addEventListener('click', upgradeTurretSpeedCallback);
    document.getElementById('shop-turretRange').addEventListener('click', upgradeTurretRangeCallback);
    document.getElementById('shop-baseArmor').addEventListener('click', upgradeBaseArmorCallback);
    document.getElementById('shop-nuke').addEventListener('click', upgradeNukeCallback);
    document.getElementById('shop-homingMine').addEventListener('click', upgradeHomingMineCallback);
    document.getElementById('shop-fieldReinforcement').addEventListener('click', upgradeFieldReinforcementCallback);
    document.getElementById('shop-targetingScrambler').addEventListener('click', upgradeTargetingScramblerCallback);
    document.getElementById('shop-repair').addEventListener('click', upgradeRepairCallback);
    document.getElementById('next-wave-button').addEventListener('click', nextWaveCallback);
}

export function showRocketInfoScreen() {
    modalContainer.style.display = 'flex';
    let rocketHTML = '<div class="rocket-info-grid">';

    for (const key in rocketInfo) {
        const rocket = rocketInfo[key];
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
    
    document.getElementById('close-info-button').addEventListener('click', hideModal);
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