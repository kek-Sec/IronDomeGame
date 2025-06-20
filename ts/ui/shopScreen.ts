// ts/ui/shopScreen.ts

import { GameState } from '../types';
import { modalContainer, modalContent } from './domElements';
import type { config } from '../config';

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
        const category = categories[categoryKey as keyof typeof categories];
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

    function addListenerIfPresent(id: string, callback: () => void): void {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', callback);
        }
    }

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