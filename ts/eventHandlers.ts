// ts/eventHandlers.ts
// * Manages all user input and UI-triggered events.

import { config } from './config';
import { Interceptor, HomingMine } from './entities/playerAbilities';
import * as UI from './ui';
import type { GameState, Rocket, Flare } from './types';

export function handleMouseMove(state: GameState, canvas: HTMLCanvasElement, e: MouseEvent): void {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
}

// --- Click Handling Logic ---

function _handleMineDeployment(state: GameState, x: number, y: number, height: number): boolean {
    if (state.homingMinesAvailable > 0 && y > height * config.homingMineDeploymentZone) {
        state.homingMines.push(new HomingMine(x, height - 10));
        state.homingMinesAvailable--;
        return true;
    }
    return false;
}

function _handleEmpClick(state: GameState, x: number, y: number): boolean {
    for (let i = state.empPowerUps.length - 1; i >= 0; i--) {
        const emp = state.empPowerUps[i];
        if (Math.hypot(x - emp.x, y - emp.y) < emp.radius) {
            state.empActiveTimer = config.empDuration;
            state.empShockwave = { radius: 0, alpha: 1 };
            state.empPowerUps.splice(i, 1);
            return true;
        }
    }
    return false;
}

function _handleInterceptorLaunch(state: GameState, width: number, height: number): boolean {
    if (state.targetedRocket) {
        const nukeIsAvailable = state.nukeAvailable && !state.activePerks.surplusValue;

        if (nukeIsAvailable) {
            state.interceptors.push(
                new Interceptor(
                    width / 2,
                    height,
                    state.targetedRocket,
                    state.interceptorSpeed,
                    config.nukeBlastRadius,
                    'nuke'
                )
            );
            state.nukeAvailable = false;
        } else {
            const numShots = 1 + state.multishotLevel;
            const centralLauncherX = width / 2;
            const spread = (numShots - 1) * 10;
            const startX = centralLauncherX - spread / 2;

            for (let i = 0; i < numShots; i++) {
                const launchX = startX + i * 10;
                state.interceptors.push(
                    new Interceptor(
                        launchX,
                        height,
                        state.targetedRocket,
                        state.interceptorSpeed,
                        state.interceptorBlastRadius,
                        'standard'
                    )
                );
            }
        }
        return true;
    }
    return false;
}

export function handleClick(state: GameState, canvas: HTMLCanvasElement, e: MouseEvent): void {
    if (state.gameState !== 'IN_WAVE') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { width, height } = canvas;

    if (_handleMineDeployment(state, x, y, height)) return;
    if (_handleEmpClick(state, x, y)) return;
    if (_handleInterceptorLaunch(state, width, height)) return;
}

// --- Touch Handling Logic ---

export function handleTouchStart(state: GameState, canvas: HTMLCanvasElement, e: TouchEvent): void {
    e.preventDefault();
    if (state.gameState !== 'IN_WAVE') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    const { width, height } = canvas;

    let closestDist = config.touchTargetingRadius;
    let touchTarget: Rocket | Flare | null = null;
    const potentialTargets: (Rocket | Flare)[] = [...state.rockets, ...state.flares];

    for (const target of potentialTargets) {
        if (target.type === 'stealth' && 'isVisible' in target && !target.isVisible) continue;
        const dist = Math.hypot(target.x - x, target.y - y);
        if (dist < closestDist) {
            closestDist = dist;
            touchTarget = target;
        }
    }

    if (touchTarget) {
        state.interceptors.push(
            new Interceptor(
                width / 2,
                height,
                touchTarget,
                state.interceptorSpeed,
                state.interceptorBlastRadius,
                'standard'
            )
        );
    }
}

// --- Pause/Resume Logic ---

export function togglePause(state: GameState, restartCallback: () => void): void {
    if (state.gameState === 'IN_WAVE') {
        state.gameState = 'PAUSED';
        UI.showPauseScreen(() => togglePause(state, restartCallback), restartCallback);
    } else if (state.gameState === 'PAUSED') {
        state.gameState = 'IN_WAVE';
        UI.hideModal();
    }
}
