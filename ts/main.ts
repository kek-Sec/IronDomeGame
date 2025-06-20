// ts/main.ts
// * This is the main entry point and controller for the game.
// It initializes the game, manages the game state, and runs the main game loop.

// --- Module Imports ---
import { config, difficultySettings } from './config';
import { random } from './utils';
import { City } from './entities/structures';
import * as UI from './ui';
import { getInitialState } from './state';
import { update } from './gameLogic';
import { draw } from './drawing';
import * as events from './eventHandlers';
import { startNextWave, refreshUpgradeScreen } from './flow';
import { loadPlayerData } from './saveManager';
import type { GameState } from './types';
import { StartGameCallback } from './types';

// --- DOM & Canvas Setup ---
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
let width: number, height: number;

// --- Game State ---
let animationFrameId: number;
let state: GameState = getInitialState();

// --- Core Game Flow ---
function gameLoop(timestamp: number): void {
    state.frameCount++;
    if (timestamp - state.lastFpsUpdate > 1000) {
        state.fps = state.frameCount;
        state.frameCount = 0;
        state.lastFpsUpdate = timestamp;
    }

    update(state, width, height, () => refreshUpgradeScreen(state, canvas), init);
    draw(ctx, state, width, height);

    animationFrameId = requestAnimationFrame(gameLoop);
}

const resetAndStartGame: StartGameCallback = (difficulty = 'normal') => {
    state = getInitialState();
    state.difficulty = difficulty;
    state.coins = difficultySettings[difficulty].startingCoins;

    state.currentWave = -1;
    createCities();
    startNextWave(state, canvas);
}

// --- Helper Functions ---
function createCities(): void {
    state.cities = [];
    const cityWidth = width / config.cityCount;
    const minHeight = 30;
    const maxHeight = Math.min(height * 0.15, 120);

    for (let i = 0; i < config.cityCount; i++) {
        const h = random(minHeight, maxHeight);
        const w = cityWidth * random(0.6, 0.8);
        const x = (i * cityWidth) + (cityWidth - w) / 2;
        state.cities.push(new City(x, height - h, w, h, state.basesAreArmored));
    }
}

const resizeCanvas = (): void => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    if (state.gameState && state.gameState !== 'IN_WAVE') {
        if (state.cities && state.cities.length > 0) {
            const citySlotWidth = width / config.cityCount;
            state.cities.forEach((city, i) => {
                city.x = (i * citySlotWidth) + (citySlotWidth - city.width) / 2;
                city.y = height - city.height;
            });
        }

        if (state.turrets && state.turrets.length > 0) {
            state.turrets.forEach((turret, index) => {
                turret.x = index === 0 ? width * 0.25 : width * 0.75;
                turret.y = height - 10;
            });
        }

        draw(ctx, state, width, height);
    }
};

// --- Initialization ---
function init(): void {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    state = getInitialState();
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', (e: MouseEvent) => events.handleMouseMove(state, canvas, e));
    canvas.addEventListener('click', (e: MouseEvent) => events.handleClick(state, canvas, e));
    document.getElementById('pause-button')?.addEventListener('click', () => events.togglePause(state, init));

    document.getElementById('rocket-info-btn')?.addEventListener('click', () => {
        const gameWasRunning = state.gameState === 'IN_WAVE';
        if (gameWasRunning) {
            state.gameState = 'PAUSED';
            UI.updateTopUI(state);
        }

        UI.showRocketInfoScreen(() => {
            UI.hideModal();
            if (gameWasRunning) {
                state.gameState = 'IN_WAVE';
                UI.updateTopUI(state);
            }
        });
    });

    canvas.addEventListener('touchstart', (e: TouchEvent) => events.handleTouchStart(state, canvas, e));

    const playerData = loadPlayerData();
    UI.showStartScreen(resetAndStartGame, () => UI.showArmoryScreen(playerData, resetAndStartGame));
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Start the game ---
init();