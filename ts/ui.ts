// ts/ui.ts
// * Manages all DOM manipulations and UI updates.
import { difficultySettings, rocketInfo, config } from './config';
import { perks } from './perks';
import { savePlayerData, loadPlayerData } from './saveManager';
import type { GameState, HiveCarrier, StartGameCallback, PlayerData } from './types';

// --- DOM Element References ---
const fpsCounterEl = document.getElementById('fps-counter') as HTMLElement;
const scoreEl = document.getElementById('score') as HTMLElement;
const coinsEl = document.getElementById('coins') as HTMLElement;
const waveEl = document.getElementById('wave') as HTMLElement;
const modalContainer = document.getElementById('modal-container') as HTMLElement;
const modalContent = document.getElementById('modal-content-main') as HTMLElement;
const pauseButton = document.getElementById('pause-button') as HTMLElement;
const pauseIcon = document.getElementById('pause-icon') as HTMLElement;
const bossUiContainer = document.getElementById('boss-ui-container') as HTMLElement;
const bossNameEl = document.getElementById('boss-name') as HTMLElement;
const bossHealthBarEl = document.getElementById('boss-health-bar') as HTMLElement;

export function updateTopUI(state: GameState): void {
    fpsCounterEl.textContent = state.fps.toString();
    scoreEl.textContent = state.score.toString();
    coinsEl.textContent = state.coins.toString();
    waveEl.textContent = (state.currentWave + 1).toString();

    // Ensure the pause button is only visible during active gameplay states
    if (state.gameState === 'IN_WAVE' || state.gameState === 'PAUSED') {
        pauseButton.style.display = 'flex';
        // Update icon based on state
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
    const playerData = loadPlayerData(); // Load fresh data to show high scores
    modalContainer.style.display = 'flex';
    modalContent.classList.remove('armory');

    let difficultyCardsHTML = '<div class="difficulty-card-grid">';
    for (const key in difficultySettings) {
        const diff = difficultySettings[key];
        const highScore = playerData.highScores[key as keyof PlayerData['highScores']] || 0; // Type assertion for key
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
                startGameCallback(target.dataset.difficulty as 'easy' | 'normal' | 'hard'); // Type assertion for difficulty
            }
        });
    }
    document.getElementById('armory-button')?.addEventListener('click', showArmoryCallback);
}

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
        const perk = perks[key];
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
                    const perk = perks[key];
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
    document
        .getElementById('back-to-menu-button')
        ?.addEventListener('click', () =>
            showStartScreen(startGameCallback, () => showArmoryScreen(playerData, startGameCallback))
        );
}

export function showBetweenWaveScreen(
    state: GameState,
    callbacks: Record<string, () => void>,
    gameConfig: typeof config
): void {
    const {
        score,
        coins,
        currentWave,
        cities,
        turrets,
        basesAreArmored,
        turretFireRateLevel,
        turretRangeLevel,
        activePerks,
        multishotLevel,
        blastRadiusLevel,
    } = state;
    const {
        upgradeRepairCallback,
        nextWaveCallback,
        upgradeTurretCallback,
        upgradeSpeedCallback,
        upgradeMultishotCallback,
        upgradeBaseArmorCallback,
        upgradeNukeCallback,
        upgradeTurretSpeedCallback,
        upgradeTurretRangeCallback,
        upgradeHomingMineCallback,
        upgradeFieldReinforcementCallback,
        upgradeTargetingScramblerCallback,
        upgradeBlastRadiusCallback,
    } = callbacks;
    const { upgradeCosts, maxTurrets } = gameConfig;

    const nukeIsPurchasable = !state.nukeAvailable || activePerks.surplusValue;
    const reinforcementNeeded = state.cities.some((c) => !c.isDestroyed && !c.isArmored);

    const categories = {
        core: {
            title: 'Core System Upgrades',
            ids: ['speed', 'multishot', 'blastRadius', 'turret', 'turretSpeed', 'turretRange', 'baseArmor'],
        },
        tactical: {
            title: 'Single-Wave Tactical Gear',
            ids: ['nuke', 'homingMine', 'fieldReinforcement', 'targetingScrambler'],
        },
        maintenance: {
            title: 'Base Maintenance',
            ids: ['repair'],
        },
    };

    const shopItems = [
        // Permanent Upgrades
        {
            id: 'speed',
            title: 'Interceptor Speed',
            desc: 'Permanently increase the speed of your interceptors.',
            detailedDesc: 'A permanent, stacking buff to the velocity of all interceptors you launch.',
            cost: upgradeCosts.interceptorSpeed,
            available: true,
            maxed: false,
        },
        {
            id: 'multishot',
            title: `Multishot (Lvl ${multishotLevel})`,
            desc: 'Fire an additional interceptor per shot. Max Lvl 3.',
            detailedDesc:
                'Increases the number of interceptors launched with each click. Each interceptor will target the same rocket.',
            cost: upgradeCosts.multishot * (multishotLevel + 1),
            available: multishotLevel < 3,
            maxed: multishotLevel >= 3,
        },
        {
            id: 'blastRadius',
            title: `Flak Warheads (Lvl ${blastRadiusLevel})`,
            desc: 'Increase the blast radius of standard interceptors. Max Lvl 5.',
            detailedDesc:
                'Increases the explosion radius of your interceptors, making them more effective against dense groups of rockets.',
            cost: upgradeCosts.flakWarheads * (blastRadiusLevel + 1),
            available: blastRadiusLevel < 5,
            maxed: blastRadiusLevel >= 5,
        },
        {
            id: 'turret',
            title: 'Build Turret',
            desc: 'Construct an automated defense turret. Max 2.',
            detailedDesc: 'Builds a C-RAM turret that automatically fires at nearby rockets. Limited to two turrets.',
            cost: upgradeCosts.automatedTurret,
            available: turrets.length < maxTurrets,
            maxed: turrets.length >= maxTurrets,
        },
        {
            id: 'turretSpeed',
            title: `Turret Speed (Lvl ${turretFireRateLevel})`,
            desc: 'Permanently increase the fire rate of all turrets. Max Lvl 3.',
            detailedDesc: 'Reduces the cooldown between bursts for all owned turrets. Stacks up to 3 times.',
            cost: upgradeCosts.turretSpeed,
            available: turrets.length > 0 && turretFireRateLevel < 3,
            maxed: turretFireRateLevel >= 3,
        },
        {
            id: 'turretRange',
            title: `Turret Range (Lvl ${turretRangeLevel})`,
            desc: 'Permanently increase the engagement range of all turrets. Max Lvl 3.',
            detailedDesc: 'Increases the detection and firing radius for all owned turrets. Stacks up to 3 times.',
            cost: upgradeCosts.turretRange,
            available: turrets.length > 0 && turretRangeLevel < 3,
            maxed: turretRangeLevel >= 3,
        },
        {
            id: 'baseArmor',
            title: 'Permanent Armor',
            desc: 'Permanently armor all bases, allowing them to survive one extra hit.',
            detailedDesc:
                'All cities will start with one layer of armor for the rest of the game. Armor is consumed upon being hit.',
            cost: upgradeCosts.baseArmor,
            available: !basesAreArmored,
            maxed: basesAreArmored,
        },
        // Tactical / Single-Use Items
        {
            id: 'nuke',
            title: 'Nuke (w/ EMP)',
            desc: 'A single-use interceptor with a massive blast and EMP effect.',
            detailedDesc:
                'Your next interceptor is a Nuke. Its massive blast destroys most rockets instantly and also triggers a 2-second global EMP, disabling all rockets on screen.',
            cost: upgradeCosts.nuke,
            available: nukeIsPurchasable,
            maxed: !nukeIsPurchasable && !activePerks.surplusValue,
        },
        {
            id: 'homingMine',
            title: 'Buy Proximity Mine',
            desc: 'An AOE mine that explodes when rockets get near.',
            detailedDesc:
                'Deploys a mine on the ground at your cursor. When an enemy gets close, it detonates, destroying all rockets within a large radius.',
            cost: upgradeCosts.homingMine,
            available: true,
            maxed: false,
        },
        {
            id: 'fieldReinforcement',
            title: 'Field Reinforcement',
            desc: 'Apply one layer of armor to all standing, unarmored bases.',
            detailedDesc:
                'A temporary, one-time boost. Instantly adds one layer of armor to any of your cities that are not already armored or destroyed. The armor is consumed on the next hit.',
            cost: upgradeCosts.fieldReinforcement,
            available: reinforcementNeeded,
            maxed: !reinforcementNeeded,
        },
        {
            id: 'targetingScrambler',
            title: 'Targeting Scrambler',
            desc: '25% chance for new rockets to be scrambled next wave.',
            detailedDesc:
                'Activates a passive system for the next wave only. Each new rocket has a 25% chance to have its trajectory scrambled, causing it to fly off-target.',
            cost: upgradeCosts.targetingScrambler,
            available: !state.scramblerActive,
            maxed: state.scramblerActive,
        },
        {
            id: 'repair',
            title: 'Repair Base',
            desc: 'Repair one of your destroyed bases.',
            detailedDesc: 'Rebuilds a single destroyed city, restoring it to full functionality.',
            cost: upgradeCosts.repairCity,
            available: cities.some((c) => c.isDestroyed),
            maxed: false,
        },
    ];

    let shopHTML = '<div class="shop-container">';

    for (const categoryKey in categories) {
        const category = categories[categoryKey as keyof typeof categories]; // Type assertion for categoryKey
        const itemsInCategory = shopItems.filter((item) => category.ids.includes(item.id));
        const isCategoryRelevant = itemsInCategory.some(
            (item) => item.available || (item.maxed === false && item.id !== 'repair')
        );

        if (isCategoryRelevant || (categoryKey === 'maintenance' && itemsInCategory.some((item) => item.available))) {
            shopHTML += `
                <div class="shop-category">
                    <h2>${category.title}</h2>
                    <div class="shop-grid">
            `;

            itemsInCategory.forEach((item) => {
                let currentCost = item.cost;
                if (activePerks.rapidDeployment && !state.firstUpgradePurchased) {
                    currentCost = Math.ceil(currentCost * 0.75);
                }

                const affordable = coins >= currentCost;
                const disabled = !affordable || !item.available;
                let statusText = `<div class="cost">Cost: ${currentCost} <span class="coin-icon"></span></div>`;

                if (item.maxed) {
                    statusText = `<div class="cost maxed-out">MAXED</div>`;
                } else if (item.id === 'targetingScrambler' && state.scramblerActive) {
                    statusText = `<div class="cost active-status">ACTIVE</div>`;
                } else if (item.id === 'nuke' && state.nukeAvailable && !activePerks.surplusValue) {
                    statusText = `<div class="cost active-status">LOADED</div>`;
                }

                shopHTML += `
                    <div class="shop-card ${disabled ? 'disabled' : ''} ${item.maxed ? 'maxed' : ''}" id="shop-${item.id}">
                        <div class="info-icon">?</div>
                        <div class="info-tooltip">${item.detailedDesc || item.desc}</div>
                        <h3>${item.title}</h3>
                        <p>${item.desc}</p>
                        ${statusText}
                    </div>
                `;
            });
            shopHTML += `</div></div>`;
        }
    }
    shopHTML += '</div>';

    modalContainer.style.display = 'flex';
    modalContent.innerHTML = `
        <div class="modal-header">
            <h1>WAVE ${currentWave + 1} COMPLETE</h1>
            <div class="end-wave-stats">
                <div>SCORE: <span>${score.toLocaleString()}</span></div>
                <div>COINS: <span>${coins.toLocaleString()}</span></div>
            </div>
        </div>
        <div class="modal-body">
            ${shopHTML}
        </div>
        <div class="modal-footer">
            <button id="next-wave-button" class="modal-button next-wave-btn">START WAVE ${currentWave + 2}</button>
        </div>
    `;

    // Helper function to safely add event listeners
    function addListenerIfPresent(id: string, callback: () => void): void {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', callback);
        }
    }

    // Safely add event listeners for all potential shop items
    addListenerIfPresent('shop-speed', upgradeSpeedCallback);
    addListenerIfPresent('shop-multishot', upgradeMultishotCallback);
    addListenerIfPresent('shop-blastRadius', upgradeBlastRadiusCallback);
    addListenerIfPresent('shop-turret', upgradeTurretCallback);
    addListenerIfPresent('shop-turretSpeed', upgradeTurretSpeedCallback);
    addListenerIfPresent('shop-turretRange', upgradeTurretRangeCallback);
    addListenerIfPresent('shop-baseArmor', upgradeBaseArmorCallback);
    addListenerIfPresent('shop-nuke', upgradeNukeCallback);
    addListenerIfPresent('shop-homingMine', upgradeHomingMineCallback);
    addListenerIfPresent('shop-fieldReinforcement', upgradeFieldReinforcementCallback);
    addListenerIfPresent('shop-targetingScrambler', upgradeTargetingScramblerCallback);
    addListenerIfPresent('shop-repair', upgradeRepairCallback);
    addListenerIfPresent('next-wave-button', nextWaveCallback);
}

export function showRocketInfoScreen(closeCallback: () => void): void {
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
