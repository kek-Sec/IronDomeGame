/**
 * main.js
 * * This is the main entry point and controller for the game.
 * It initializes the game, manages the game state, and runs the main game loop.
 */

// --- Module Imports ---
import { config, difficultySettings } from './config.js';
import { random } from './utils.js';
import { City } from './entities/structures.js';
import * as UI from './ui.js';
import { getInitialState } from './state.js';
import { update } from './gameLogic.js';
import { draw } from './drawing.js';
import * as events from './eventHandlers.js';
import { startNextWave, refreshUpgradeScreen } from './flow.js';
import { loadPlayerData } from './saveManager.js';

// --- DOM & Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;

// --- Game State ---
let animationFrameId;
let state = {};

// --- Core Game Flow ---
function gameLoop(timestamp) {
    state.frameCount++;
    if (timestamp - state.lastFpsUpdate > 1000) {
        state.fps = state.frameCount;
        state.frameCount = 0;
        state.lastFpsUpdate = timestamp;
    }

    // Pass callbacks for game flow control
    update(state, width, height, () => refreshUpgradeScreen(state, canvas), init); 
    draw(ctx, state, width, height);
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function resetAndStartGame(difficulty = 'normal') {
    state = getInitialState();
    state.difficulty = difficulty;
    // Set starting coins based on the chosen difficulty
    state.coins = difficultySettings[difficulty].startingCoins;
    
    state.currentWave = -1; // Will be incremented to 0 by startNextWave
    createCities();
    startNextWave(state, canvas);
}

// --- Helper Functions ---
function createCities() {
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

const resizeCanvas = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    if (state.gameState && state.gameState !== 'IN_WAVE') {
        // THE FIX: Instead of calling createCities(), update existing city and turret positions.
        // This preserves their state (destroyed, armored, etc.).
        if (state.cities && state.cities.length > 0) {
            const citySlotWidth = width / config.cityCount;
            state.cities.forEach((city, i) => {
                // Recalculate x to be centered within its new slot, preserving its width.
                city.x = (i * citySlotWidth) + (citySlotWidth - city.width) / 2;
                // Recalculate y based on the new canvas height, preserving its height.
                city.y = height - city.height;
            });
        }

        if (state.turrets && state.turrets.length > 0) {
            state.turrets.forEach((turret, index) => {
                // Reposition turrets based on new width and height.
                turret.x = index === 0 ? width * 0.25 : width * 0.75;
                turret.y = height - 10; // Turrets are positioned near the bottom of the canvas.
            });
        }

        // After updating positions, redraw everything.
        draw(ctx, state, width, height);
    }
};

// --- Initialization ---
function init() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    state = getInitialState();
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', (e) => events.handleMouseMove(state, canvas, e));
    canvas.addEventListener('click', (e) => events.handleClick(state, canvas, e));
    document.getElementById('pause-button').addEventListener('click', () => events.togglePause(state, init));
    
    // Add logic to pause the game when showing the info screen
    document.getElementById('rocket-info-btn').addEventListener('click', () => {
        const gameWasRunning = state.gameState === 'IN_WAVE';
        if (gameWasRunning) {
            state.gameState = 'PAUSED';
            // Also update the pause button icon immediately
            UI.updateTopUI(state);
        }
        
        UI.showRocketInfoScreen(() => {
            UI.hideModal();
            // Only resume if the game was running before
            if (gameWasRunning) {
                state.gameState = 'IN_WAVE';
                UI.updateTopUI(state);
            }
        });
    });

    canvas.addEventListener('touchstart', (e) => events.handleTouchStart(state, canvas, e));
    
    const playerData = loadPlayerData();
    UI.showStartScreen(resetAndStartGame, () => UI.showArmoryScreen(playerData));
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Start the game ---
init();