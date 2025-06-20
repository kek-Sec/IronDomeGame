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
import { loadGameAssets } from './assetLoader';
import { modalContainer, modalContent } from './ui/domElements';

// --- DOM & Canvas Setup ---
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
let width: number, height: number;

// --- Game State ---
let animationFrameId: number;
let state: GameState;

// --- Core Game Flow ---
function gameLoop(timestamp: number): void {
    // --- State-based Game Flow Control ---
    // Only run the core game logic if the state is 'IN_WAVE'
    if (state.gameState === 'IN_WAVE') {
        update(state, width, height, () => refreshUpgradeScreen(state, canvas));
    }

    // --- Post-Update UI Handling ---
    // Check if the game is over after the update
    if (state.gameState === 'GAME_OVER') {
        // Stop the loop and show the game over screen
        cancelAnimationFrame(animationFrameId);
        const newHighScore = state.score > state.playerData.highScores[state.difficulty];
        const pointsEarned = Math.floor(state.score / 100) + state.currentWave * 10;
        UI.showGameOverScreen(state, init, pointsEarned, newHighScore);
        return; // Exit the loop
    }

    // --- Rendering ---
    // Update UI elements that change every frame
    UI.updateTopUI(state);
    UI.updateBossUI(state.boss);

    // Calculate FPS
    state.frameCount++;
    if (timestamp - state.lastFpsUpdate > 1000) {
        state.fps = state.frameCount;
        state.frameCount = 0;
        state.lastFpsUpdate = timestamp;
    }

    // Draw the entire scene
    draw(ctx, state, width, height);

    // Request the next frame
    animationFrameId = requestAnimationFrame(gameLoop);
}

const resetAndStartGame: StartGameCallback = (difficulty = 'normal') => {
    // Re-load player data to ensure perks are current
    const playerData = loadPlayerData();
    state = createInitialState(playerData);
    state.difficulty = difficulty;
    state.coins = difficultySettings[difficulty].startingCoins;

    state.currentWave = -1;
    createCities();
    startNextWave(state, canvas);

    // If the game loop was stopped, restart it
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
};

// --- Helper Functions ---
function createCities(): void {
    state.cities = [];
    const cityWidth = width / config.cityCount;
    const minHeight = 30;
    const maxHeight = Math.min(height * 0.15, 120);

    for (let i = 0; i < config.cityCount; i++) {
        const h = random(minHeight, maxHeight);
        const w = cityWidth * random(0.6, 0.8);
        const x = i * cityWidth + (cityWidth - w) / 2;
        state.cities.push(new City(x, height - h, w, h, state.basesAreArmored));
    }
}

const resizeCanvas = (): void => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    if (state && state.gameState !== 'IN_WAVE') {
        if (state.cities && state.cities.length > 0) {
            const citySlotWidth = width / config.cityCount;
            state.cities.forEach((city, i) => {
                city.x = i * citySlotWidth + (citySlotWidth - city.width) / 2;
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
async function init(): Promise<void> {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Display a loading message while assets are being fetched
    modalContainer.style.display = 'flex';
    modalContent.innerHTML = '<h1>Loading Assets...</h1>';

    try {
        // Wait for all images to load before proceeding
        await loadGameAssets();

        const playerData = loadPlayerData();
        state = createInitialState(playerData);
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

        UI.showStartScreen(resetAndStartGame, () => UI.showArmoryScreen(playerData, resetAndStartGame));
        animationFrameId = requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Failed to load game assets:', error);
        modalContent.innerHTML = '<h1>Error</h1><p>Could not load game assets. Please refresh the page to try again.</p>';
    }
}

// --- Start the game ---
init();