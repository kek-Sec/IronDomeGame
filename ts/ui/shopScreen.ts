// ts/ui/shopScreen.ts

import { GameState } from '../types';
import { modalContainer, modalContent } from './domElements';
import type { config } from '../config';

// Icons for each upgrade to make them more identifiable
const shopItemIcons: Record<string, string> = {
    speed: '🚀',
    multishot: '💥',
    blastRadius: '💣',
    turret: '🤖',
    turretSpeed: '⚡️',
    turretRange: '📡',
    baseArmor: '🛡️',
    nuke: '☢️',
    homingMine: '📍',
    fieldReinforcement: '🧱',
    targetingScrambler: '🌀',
    repair: '🔧',
};

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
    const { upgradeCosts, maxTurrets } = gameConfig;

    const nukeIsPurchasable = !state.nukeAvailable || activePerks.surplusValue;
    const reinforcementNeeded = state.cities.some((c) => !c.isDestroyed && !c.isArmored);

    // Group items into categories for the two-column layout
    const categories = {
        core: {
            title: 'Core Systems',
            items: [
                {
                    id: 'speed',
                    title: 'Interceptor Speed',
                    desc: 'Permanently increase interceptor velocity.',
                    cost: upgradeCosts.interceptorSpeed,
                    available: true,
                    maxed: false,
                    callback: callbacks.upgradeSpeedCallback,
                },
                {
                    id: 'multishot',
                    title: `Multishot (Lvl ${multishotLevel})`,
                    desc: 'Fire an additional interceptor per shot.',
                    cost: upgradeCosts.multishot * (multishotLevel + 1),
                    available: multishotLevel < 3,
                    maxed: multishotLevel >= 3,
                    callback: callbacks.upgradeMultishotCallback,
                },
                {
                    id: 'blastRadius',
                    title: `Flak Warheads (Lvl ${blastRadiusLevel})`,
                    desc: 'Increase interceptor blast radius.',
                    cost: upgradeCosts.flakWarheads * (blastRadiusLevel + 1),
                    available: blastRadiusLevel < 5,
                    maxed: blastRadiusLevel >= 5,
                    callback: callbacks.upgradeBlastRadiusCallback,
                },
                {
                    id: 'turret',
                    title: 'Build C-RAM Turret',
                    desc: 'Construct an automated defense turret.',
                    cost: upgradeCosts.automatedTurret,
                    available: turrets.length < maxTurrets,
                    maxed: turrets.length >= maxTurrets,
                    callback: callbacks.upgradeTurretCallback,
                },
                {
                    id: 'turretSpeed',
                    title: `Turret Fire Rate (Lvl ${turretFireRateLevel})`,
                    desc: 'Increase fire rate of all turrets.',
                    cost: upgradeCosts.turretSpeed,
                    available: turrets.length > 0 && turretFireRateLevel < 3,
                    maxed: turretFireRateLevel >= 3,
                    callback: callbacks.upgradeTurretSpeedCallback,
                },
                {
                    id: 'turretRange',
                    title: `Turret Range (Lvl ${turretRangeLevel})`,
                    desc: 'Increase engagement range of turrets.',
                    cost: upgradeCosts.turretRange,
                    available: turrets.length > 0 && turretRangeLevel < 3,
                    maxed: turretRangeLevel >= 3,
                    callback: callbacks.upgradeTurretRangeCallback,
                },
            ],
        },
        tactical: {
            title: 'Tactical Gear',
            items: [
                {
                    id: 'nuke',
                    title: 'Nuke Interceptor',
                    desc: 'Single-use weapon with a massive blast.',
                    cost: upgradeCosts.nuke,
                    available: nukeIsPurchasable,
                    maxed: !nukeIsPurchasable && !activePerks.surplusValue,
                    callback: callbacks.upgradeNukeCallback,
                },
                {
                    id: 'homingMine',
                    title: 'Proximity Mine',
                    desc: 'Deploys a mine that detonates on proximity.',
                    cost: upgradeCosts.homingMine,
                    available: true,
                    maxed: false,
                    callback: callbacks.upgradeHomingMineCallback,
                },
                {
                    id: 'fieldReinforcement',
                    title: 'Field Reinforcement',
                    desc: 'Apply armor to all standing bases.',
                    cost: upgradeCosts.fieldReinforcement,
                    available: reinforcementNeeded,
                    maxed: !reinforcementNeeded,
                    callback: callbacks.upgradeFieldReinforcementCallback,
                },
                {
                    id: 'targetingScrambler',
                    title: 'Targeting Scrambler',
                    desc: '25% chance to scramble new rockets.',
                    cost: upgradeCosts.targetingScrambler,
                    available: !state.scramblerActive,
                    maxed: state.scramblerActive,
                    callback: callbacks.upgradeTargetingScramblerCallback,
                },
            ],
        },
        maintenance: {
            title: 'Base Maintenance',
            items: [
                {
                    id: 'baseArmor',
                    title: 'Permanent Armor',
                    desc: 'Permanently armor all bases for the game.',
                    cost: upgradeCosts.baseArmor,
                    available: !basesAreArmored,
                    maxed: basesAreArmored,
                    callback: callbacks.upgradeBaseArmorCallback,
                },
                {
                    id: 'repair',
                    title: 'Repair Base',
                    desc: 'Rebuild one of your destroyed cities.',
                    cost: upgradeCosts.repairCity,
                    available: cities.some((c) => c.isDestroyed),
                    maxed: false,
                    callback: callbacks.upgradeRepairCallback,
                },
            ],
        },
    };

    const generateShopItems = (items: any[]) => {
        let html = '';
        items.forEach((item) => {
            let currentCost = item.cost;
            if (activePerks.rapidDeployment && !state.firstUpgradePurchased) {
                currentCost = Math.ceil(currentCost * 0.75);
            }

            const canAfford = coins >= currentCost;
            const isDisabled = !canAfford || !item.available;

            let statusBanner = '';
            if (item.maxed) {
                statusBanner = '<div class="status-banner maxed">MAXED</div>';
            } else if (item.id === 'targetingScrambler' && state.scramblerActive) {
                statusBanner = '<div class="status-banner active">ACTIVE</div>';
            } else if (item.id === 'nuke' && state.nukeAvailable && !activePerks.surplusValue) {
                statusBanner = '<div class="status-banner active">LOADED</div>';
            }

            html += `
                <div class="shop-item ${isDisabled ? 'disabled' : ''} ${item.maxed ? 'maxed' : ''}" id="shop-${item.id}">
                    ${statusBanner}
                    <div class="shop-item-icon">${shopItemIcons[item.id] || '❓'}</div>
                    <div class="shop-item-content">
                        <h3>${item.title}</h3>
                        <p>${item.desc}</p>
                    </div>
                    <div class="shop-item-footer">
                        <div class="cost">
                            <span class="coin-icon"></span>
                            <span>${currentCost.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        return html;
    };

    modalContainer.style.display = 'flex';
    modalContent.innerHTML = `
        <div class="modal-header">
            <h1>WAVE ${currentWave + 1} COMPLETE</h1>
            <div class="shop-info-bar">
                <div>SCORE: <span>${score.toLocaleString()}</span></div>
                <div>WAVE PRESTIGE: <span>+${(Math.floor(score / 100) + currentWave * 10).toLocaleString()}</span></div>
                <div class="shop-coins">COINS: <span class="coin-icon"></span><span>${coins.toLocaleString()}</span></div>
            </div>
        </div>
        <div class="modal-body">
            <div class="shop-layout">
                <div class="shop-column">
                    <h2>${categories.core.title}</h2>
                    <div class="shop-grid">${generateShopItems(categories.core.items)}</div>
                    <h2>${categories.maintenance.title}</h2>
                    <div class="shop-grid">${generateShopItems(categories.maintenance.items)}</div>
                </div>
                <div class="shop-column">
                    <h2>${categories.tactical.title}</h2>
                    <div class="shop-grid">${generateShopItems(categories.tactical.items)}</div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button id="next-wave-button" class="modal-button next-wave-btn">START WAVE ${currentWave + 2}</button>
        </div>
    `;

    // Add event listeners to the new shop items
    Object.values(categories).forEach((cat) => {
        cat.items.forEach((item) => {
            const element = document.getElementById(`shop-${item.id}`);
            if (element && item.callback) {
                element.addEventListener('click', item.callback);
            }
        });
    });
    document.getElementById('next-wave-button')?.addEventListener('click', callbacks.nextWaveCallback);
}
