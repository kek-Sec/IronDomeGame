// ts/main.ts
// * This is the main entry point and controller for the game.
// It initializes the game, manages the game state, and runs the main game loop.

// --- Module Imports ---
import { config, difficultySettings } from './config';
import { random } from './utils';
import { City } from './entities/structures';
import * as UI from './ui';
import { createInitialState } from './state';
import { update } from './gameLogic';
import { draw } from './drawing';
import * as events from './eventHandlers';
import { startNextWave, refreshUpgradeScreen } from './flow';
import { loadPlayerData } from './saveManager';
import type { GameState, StartGameCallback } from './types';
import { loadGameAssets, loadedSprites } from './assetLoader';
import { modalContent } from './ui/domElements';

// --- DOM & Canvas Setup ---
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
let width: number, height: number;

// --- Game State ---
let animationFrameId: number;
let state: GameState;

// --- Core Game Flow ---
function gameLoop(timestamp: number): void {
    if (state.gameState === 'IN_WAVE') {
        update(state, width, height, () => refreshUpgradeScreen(state, canvas));
    }

    if (state.gameState === 'GAME_OVER') {
        cancelAnimationFrame(animationFrameId);
        const pointsEarned = Math.floor(state.score / 100) + state.currentWave * 10;
        UI.showGameOverScreen(state, init, pointsEarned, state.newHighScore);
        return;
    }

    UI.updateTopUI(state);
    UI.updateBossUI(state.boss);

    state.frameCount++;
    if (timestamp - state.lastFpsUpdate > 1000) {
        state.fps = state.frameCount;
        state.frameCount = 0;
        state.lastFpsUpdate = timestamp;
    }

    draw(ctx, state, width, height);
    animationFrameId = requestAnimationFrame(gameLoop);
}

const resetAndStartGame: StartGameCallback = (difficulty = 'normal') => {
    const playerData = loadPlayerData();
    state = createInitialState(playerData);

    if ((window as any).Cypress) {
        (window as any).gameState = state;
    }

    state.difficulty = difficulty;
    state.coins = difficultySettings[difficulty].startingCoins;
    state.currentWave = -1;
    createCities();
    startNextWave(state, canvas);

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
};

// --- Helper Functions ---
function createCities(): void {
    state.cities = [];
    const citySlotWidth = width / config.cityCount;
    const minHeight = 50;
    const maxHeight = Math.min(height * 0.15, 120); // Base max height for regular buildings
    const spriteKeys = Object.keys(loadedSprites);

    for (let i = 0; i < config.cityCount; i++) {
        const randomSpriteKey = spriteKeys[Math.floor(random(0, spriteKeys.length))];
        const sprite = loadedSprites[randomSpriteKey];

        let h: number;
        if (randomSpriteKey === 'comms') {
            h = random(maxHeight, maxHeight * 1.3);
        } else {
            h = random(minHeight, maxHeight * 0.9);
        }

        const aspectRatio = sprite.naturalWidth / sprite.naturalHeight;
        const w = h * aspectRatio;
        const x = i * citySlotWidth + (citySlotWidth - w) / 2;
        const y = height - h;
        state.cities.push(new City(x, y, w, h, state.basesAreArmored, sprite));
    }
}

const resizeCanvas = (): void => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    if (state && state.gameState !== 'IN_WAVE') {
        draw(ctx, state, width, height);
    }
};

// --- Initialization ---
async function init(): Promise<void> {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    UI.showModalWithContent('<h1>Loading Assets...</h1>');

    try {
        await loadGameAssets();
        const playerData = loadPlayerData();
        state = createInitialState(playerData);

        if ((window as any).Cypress) {
            (window as any).gameState = state;
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // --- Event Handlers (re-integrated for stability) ---
        canvas.addEventListener('mousemove', (e: MouseEvent) => events.handleMouseMove(state, canvas, e));
        canvas.addEventListener('click', (e: MouseEvent) => events.handleClick(state, canvas, e));
        canvas.addEventListener('touchstart', (e: TouchEvent) => events.handleTouchStart(state, canvas, e), {
            passive: false,
        });

        document.getElementById('pause-button')?.addEventListener('click', () => events.togglePause(state, init));

        document.getElementById('rocket-info-btn')?.addEventListener('click', () => {
            const gameWasRunning = state.gameState === 'IN_WAVE';
            if (gameWasRunning) {
                events.pauseGame(state);
            }
            UI.showRocketInfoScreen(() => {
                UI.hideModal();
                if (gameWasRunning) {
                    events.resumeGame(state);
                }
            });
        });

        UI.showStartScreen(resetAndStartGame, () => UI.showArmoryScreen(playerData, resetAndStartGame));
        animationFrameId = requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Failed to load game assets:', error);
        UI.showModalWithContent(
            '<h1>Error</h1><p>Could not load game assets. Please refresh the page to try again.</p>',
            'game-over'
        );
    }
}

// --- Start the game ---
init();
