/**
 * eventHandlers.js
 * * Manages all user input and UI-triggered events.
 */
import { config } from './config.js';
import { Interceptor, HomingMine } from './entities/playerAbilities.js';
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

    // Deploy Homing Mine
    if (state.homingMinesAvailable > 0 && y > height * 0.85 && state.gameState === 'IN_WAVE') {
        state.homingMines.push(new HomingMine(x, height - 10));
        state.homingMinesAvailable--;
        UI.updateTopUI(state);
        return;
    }

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
        const nukeIsAvailable = state.nukeAvailable || state.activePerks.surplusValue;

        if (nukeIsAvailable) {
            // Fire a single nuke, no multishot
            state.interceptors.push(new Interceptor(width / 2, height, state.targetedRocket, state.interceptorSpeed, config.nukeBlastRadius, 'nuke'));
            state.nukeAvailable = false;
        } else {
            // Standard interceptors with multishot
            const numShots = 1 + state.multishotLevel;
            const centralLauncherX = width / 2;
            const spread = (numShots - 1) * 10;
            const startX = centralLauncherX - spread / 2;
            
            for (let i = 0; i < numShots; i++) {
                const launchX = startX + i * 10;
                state.interceptors.push(new Interceptor(launchX, height, state.targetedRocket, state.interceptorSpeed, config.initialBlastRadius, 'standard'));
            }
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
            // Create a temporary state for blastRadius for the interceptor
            const interceptorBlastRadius = config.initialBlastRadius; // Use initial value
            state.interceptors.push(new Interceptor(width / 2, height, touchTarget, state.interceptorSpeed, interceptorBlastRadius));
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