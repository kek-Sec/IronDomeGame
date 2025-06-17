/**
 * main.js
 * * This is the main entry point and controller for the game.
 * It initializes the game, manages the game state, and runs the main game loop.
 */

// --- Module Imports ---
import { config } from './config.js';
import { random } from './utils.js';
import { City } from './classes.js';
import * as UI from './ui.js';
import { getInitialState } from './state.js';
import { update } from './gameLogic.js';
import { draw } from './drawing.js';
import * as events from './eventHandlers.js';
import { startNextWave, refreshUpgradeScreen } from './flow.js';

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
    state.currentWave = -1; // Will be incremented to 0 by startNextWave
    createCities();
    startNextWave(state);
}

// --- Helper Functions ---
function createCities() {
    state.cities = [];
    const cityWidth = width / config.cityCount;
    // Responsive city height calculation
    const minHeight = 30;
    const maxHeight = Math.min(height * 0.15, 120); // Cap height at 15% of screen or 120px, whichever is smaller

    for (let i = 0; i < config.cityCount; i++) {
        const h = random(minHeight, maxHeight); // Use the new responsive bounds
        const w = cityWidth * random(0.6, 0.8);
        const x = (i * cityWidth) + (cityWidth - w) / 2;
        state.cities.push(new City(x, height - h, w, h, state.basesAreArmored));
    }
}

const resizeCanvas = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (state.gameState && state.gameState !== 'IN_WAVE') {
        createCities();
        if (state.turrets) {
            state.turrets.forEach((turret, index) => {
                turret.x = index === 0 ? width * 0.25 : width * 0.75;
            });
        }
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
    canvas.addEventListener('touchstart', (e) => events.handleTouchStart(state, canvas, e));
    
    UI.showStartScreen(resetAndStartGame);
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Start the game ---
init();