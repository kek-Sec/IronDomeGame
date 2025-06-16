/**
 * eventHandlers.js
 * * Manages all user input and UI-triggered events.
 */
import { config, difficultySettings } from './config.js';
import { Interceptor, AutomatedTurret } from './classes.js';
import * as UI from './ui.js';

export function handleMouseMove(state, canvas, e) {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
}

export function handleClick(state, canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { width, height } = canvas;

    for (let i = state.empPowerUps.length - 1; i >= 0; i--) {
        const emp = state.empPowerUps[i];
        if (Math.hypot(x - emp.x, y - emp.y) < emp.radius) {
            state.empActiveTimer = config.empDuration;
            state.empShockwave = { radius: 0, alpha: 1 };
            state.empPowerUps.splice(i, 1);
            return;
        }
    }
    
    if (state.gameState === 'IN_WAVE' && state.targetedRocket) {
        const interceptorType = state.nukeAvailable ? 'nuke' : 'standard';
        state.interceptors.push(new Interceptor(width / 2, height, state.targetedRocket, state.interceptorSpeed, state.blastRadius, interceptorType));
        if (state.nukeAvailable) {
            state.nukeAvailable = false;
        }
        UI.updateTopUI(state);
    }
}

export function handleTouchStart(state, canvas, e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    const { width, height } = canvas;
    
    if (state.gameState === 'IN_WAVE') {
        let closestDist = 100;
        let touchTarget = null;
        const potentialTargets = [...state.rockets, ...state.flares];
        for (const target of potentialTargets) {
            if (target.type === 'stealth' && !target.isVisible) continue;
            const dist = Math.hypot(target.x - x, target.y - y);
            if (dist < closestDist) {
                closestDist = dist;
                touchTarget = target;
            }
        }
        if (touchTarget) {
            state.interceptors.push(new Interceptor(width / 2, height, touchTarget, state.interceptorSpeed, state.blastRadius));
            UI.updateTopUI(state);
        }
    }
}

export function togglePause(state, init) {
    if (state.gameState === 'IN_WAVE') {
        state.gameState = 'PAUSED';
        UI.showPauseScreen(() => togglePause(state, init), () => init());
    } else if (state.gameState === 'PAUSED') {
        state.gameState = 'IN_WAVE';
        UI.hideModal();
    }
}

// --- Upgrade Handlers ---
export function handleUpgradeRepair(state, refreshUpgradeScreen) {
    if (state.score >= config.upgradeCosts.repairCity) {
        const cityToRepair = state.cities.find(c => c.isDestroyed);
        if (cityToRepair) {
            state.score -= config.upgradeCosts.repairCity;
            cityToRepair.repair();
            refreshUpgradeScreen();
        }
    }
}

export function handleUpgradeTurret(state, canvas, refreshUpgradeScreen) {
    if (state.score >= config.upgradeCosts.automatedTurret && state.turrets.length < config.maxTurrets) {
        state.score -= config.upgradeCosts.automatedTurret;
        const turretX = state.turrets.length === 0 ? canvas.width * 0.25 : canvas.width * 0.75;
        const fireRate = config.turretFireRate * difficultySettings[state.difficulty].turretFireRateMultiplier;
        state.turrets.push(new AutomatedTurret(turretX, canvas.height - 10, config.turretRange, fireRate));
        refreshUpgradeScreen();
    }
}

export function handleUpgradeSpeed(state, refreshUpgradeScreen) {
    if (state.score >= config.upgradeCosts.interceptorSpeed) {
        state.score -= config.upgradeCosts.interceptorSpeed;
        state.interceptorSpeed *= 1.2;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeBlast(state, refreshUpgradeScreen) {
    if (state.score >= config.upgradeCosts.blastRadius) {
        state.score -= config.upgradeCosts.blastRadius;
        state.blastRadius *= 1.3;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeNuke(state, refreshUpgradeScreen) {
    if(state.score >= config.upgradeCosts.nuke && !state.nukeAvailable) {
        state.score -= config.upgradeCosts.nuke;
        state.nukeAvailable = true;
        refreshUpgradeScreen();
    }
}

export function handleUpgradeBaseArmor(state, refreshUpgradeScreen) {
    if(state.score >= config.upgradeCosts.baseArmor && !state.basesAreArmored) {
        state.score -= config.upgradeCosts.baseArmor;
        state.basesAreArmored = true;
        state.cities.forEach(c => c.isArmored = true);
        refreshUpgradeScreen();
    }
}

export function handleUpgradeTurretSpeed(state, refreshUpgradeScreen) {
     if(state.score >= config.upgradeCosts.turretSpeed && state.turretFireRateLevel < 3) {
        state.score -= config.upgradeCosts.turretSpeed;
        state.turretFireRateLevel++;
        state.turrets.forEach(t => t.fireRate *= 0.75);
        refreshUpgradeScreen();
    }
}