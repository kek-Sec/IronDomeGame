/**
 * main.js
 * * This is the main entry point and controller for the game.
 * It initializes the game, manages the game state, and runs the main game loop.
 * It imports all other necessary modules and orchestrates their interactions.
 */

// --- Module Imports ---
import { config, waveDefinitions } from './config.js';
import { random } from './utils.js';
import { City, Rocket, MirvRocket, Interceptor, Particle, AutomatedTurret } from './classes.js';
import * as UI from './ui.js';

// --- DOM & Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;

// --- Game State ---
let animationFrameId;
let state = {};

// --- Game State Functions ---
function getInitialState() {
    return {
        gameState: 'START_SCREEN', // START_SCREEN, IN_WAVE, BETWEEN_WAVES, GAME_OVER
        score: 0,
        remainingInterceptors: config.initialInterceptors,
        currentWave: 0,
        rockets: [],
        interceptors: [],
        particles: [],
        cities: [],
        turrets: [], // for automated turrets
        screenShake: { intensity: 0, duration: 0 },
        waveRocketSpawn: { count: 0, timer: 0, toSpawn: [] }
    };
}

// --- Core Game Logic ---
function update() {
    if (state.gameState !== 'IN_WAVE') return;
    
    handleRocketSpawning();
    updateRockets();
    updateTurrets();
    updateInterceptors();
    updateParticles();
    checkWaveCompletion();
    checkGameOver();
}

function handleRocketSpawning() {
    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];
    state.waveRocketSpawn.timer++;
    
    if (state.waveRocketSpawn.timer > waveDef.delay && state.waveRocketSpawn.toSpawn.length > 0) {
        const rocketType = state.waveRocketSpawn.toSpawn.pop();
        if (rocketType === 'standard') {
            state.rockets.push(new Rocket(undefined, undefined, undefined, undefined, width));
        } else if (rocketType === 'mirv') {
            state.rockets.push(new MirvRocket(width, height));
        }
        state.waveRocketSpawn.timer = 0;
    }
}

function updateRockets() {
    for (let i = state.rockets.length - 1; i >= 0; i--) {
        const rocket = state.rockets[i];
        rocket.update();
        
        if (rocket.type === 'mirv' && rocket.hasSplit) {
            const childRockets = rocket.split();
            state.rockets.push(...childRockets);
            state.rockets.splice(i, 1);
            continue;
        }

        if (rocket.y > height - 100) {
            let hitCity = false;
            state.cities.forEach(city => {
               if (!city.isDestroyed && rocket.x > city.x && rocket.x < city.x + city.width && rocket.y > city.y) {
                   city.isDestroyed = true;
                   hitCity = true;
                   createExplosion(rocket.x, rocket.y, 100, 0);
                   triggerScreenShake(15, 30);
               }
            });

            if (hitCity || rocket.y >= height) {
                if (!hitCity) createExplosion(rocket.x, rocket.y, 50, 0);
                state.rockets.splice(i, 1);
            }
        }
    }
}

function updateTurrets() {
    for (const turret of state.turrets) {
        const target = turret.update(state.rockets);
        if (target && state.remainingInterceptors > 0) {
            state.interceptors.push(new Interceptor(turret.x, turret.y, target.x, target.y, width, height, config.interceptorSpeed));
            state.remainingInterceptors--;
            UI.updateTopUI(state);
        }
    }
}

function updateInterceptors() {
    for (let i = state.interceptors.length - 1; i >= 0; i--) {
        const interceptor = state.interceptors[i];
        interceptor.update();

        const distToTarget = Math.hypot(interceptor.x - interceptor.targetX, interceptor.y - interceptor.targetY);
        if (distToTarget < 20 || interceptor.y < 0) {
            createExplosion(interceptor.x, interceptor.y, 50, 200);
            state.interceptors.splice(i, 1);
            continue;
        }

        for (let j = state.rockets.length - 1; j >= 0; j--) {
            const rocket = state.rockets[j];
            if (Math.hypot(interceptor.x - rocket.x, interceptor.y - rocket.y) < 15) {
                createExplosion(rocket.x, rocket.y, 100, 200);
                state.score += (rocket.type === 'mirv') ? config.mirvPoints : config.rocketPoints;
                state.rockets.splice(j, 1);
                state.interceptors.splice(i, 1);
                UI.updateTopUI(state);
                break;
            }
        }
    }
}

function updateParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

function checkWaveCompletion() {
    if (state.rockets.length === 0 && state.waveRocketSpawn.toSpawn.length === 0) {
        state.gameState = 'BETWEEN_WAVES';
        refreshUpgradeScreen();
    }
}

function checkGameOver() {
    const destroyedCities = state.cities.filter(c => c.isDestroyed).length;
    if (destroyedCities === config.cityCount || (state.remainingInterceptors <= 0 && state.rockets.length > 0 && state.interceptors.length === 0)) {
        state.gameState = 'GAME_OVER';
        UI.showGameOverScreen(state, resetAndStartGame);
    }
}

// --- Drawing ---
function draw() {
    ctx.save();
    if (state.screenShake.duration > 0) {
        ctx.translate((Math.random() - 0.5) * state.screenShake.intensity, (Math.random() - 0.5) * state.screenShake.intensity);
        state.screenShake.duration--;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, height - 10, width, 10);
    
    state.cities.forEach(city => city.draw(ctx, height));
    state.turrets.forEach(turret => turret.draw(ctx));

    // Player's main battery
    ctx.beginPath();
    ctx.moveTo(width / 2 - 20, height);
    ctx.lineTo(width / 2, height - 20);
    ctx.lineTo(width / 2 + 20, height);
    ctx.closePath();
    ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;

    state.rockets.forEach(r => r.draw(ctx));
    state.interceptors.forEach(i => i.draw(ctx));
    state.particles.forEach(p => p.draw(ctx));
    ctx.restore();
}

// --- Game Flow ---
function gameLoop() {
    if (state.gameState === 'IN_WAVE') {
        update();
        draw();
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function startNextWave() {
    state.currentWave++;
    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];
    
    let spawnList = [];
    for(let i=0; i<waveDef.standard; i++) spawnList.push('standard');
    for(let i=0; i<waveDef.mirv; i++) spawnList.push('mirv');
    state.waveRocketSpawn.toSpawn = spawnList.sort(() => Math.random() - 0.5);

    state.waveRocketSpawn.timer = 0;
    
    state.gameState = 'IN_WAVE';
    UI.hideModal();
    UI.updateTopUI(state);
}

function resetAndStartGame() {
    state = getInitialState();
    state.currentWave = -1;
    createCities();
    startNextWave();
}

// --- Helper & Event Handler Functions ---
const resizeCanvas = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (state.gameState !== 'IN_WAVE') {
        createCities();
        state.turrets.forEach((turret, index) => {
            turret.x = index === 0 ? width * 0.25 : width * 0.75;
        });
        draw();
    }
};

function createCities() {
    state.cities = [];
    const cityWidth = width / config.cityCount;
    for (let i = 0; i < config.cityCount; i++) {
        const h = random(40, 100);
        const w = cityWidth * random(0.6, 0.8);
        const x = (i * cityWidth) + (cityWidth - w) / 2;
        state.cities.push(new City(x, height - h, w, h));
    }
}

function createExplosion(x, y, count, baseColor) {
    for (let i = 0; i < count; i++) {
        state.particles.push(new Particle(x, y, baseColor + random(-20, 20)));
    }
}

function triggerScreenShake(intensity, duration) {
    state.screenShake.intensity = intensity;
    state.screenShake.duration = duration;
}

function launchInterceptor(e) {
    if (state.gameState !== 'IN_WAVE' || state.remainingInterceptors <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    state.interceptors.push(new Interceptor(width / 2, height, x, y, width, height, config.interceptorSpeed));
    state.remainingInterceptors--;
    UI.updateTopUI(state);
}

function handleUpgradeInterceptors() {
    if (state.score >= config.upgradeCosts.interceptors) {
        state.score -= config.upgradeCosts.interceptors;
        state.remainingInterceptors += 5;
        refreshUpgradeScreen();
    }
}

function handleUpgradeRepair() {
    if (state.score >= config.upgradeCosts.repairCity) {
        const cityToRepair = state.cities.find(c => c.isDestroyed);
        if (cityToRepair) {
            state.score -= config.upgradeCosts.repairCity;
            cityToRepair.repair();
            draw();
            refreshUpgradeScreen();
        }
    }
}

function handleUpgradeTurret() {
    if (state.score >= config.upgradeCosts.automatedTurret && state.turrets.length < config.maxTurrets) {
        state.score -= config.upgradeCosts.automatedTurret;
        const turretX = state.turrets.length === 0 ? width * 0.25 : width * 0.75;
        state.turrets.push(new AutomatedTurret(turretX, height - 15, config.turretRange, config.turretFireRate));
        draw();
        refreshUpgradeScreen();
    }
}

function refreshUpgradeScreen() {
    UI.updateTopUI(state);
    UI.showBetweenWaveScreen(state, {
        upgradeInterceptorsCallback: handleUpgradeInterceptors,
        upgradeRepairCallback: handleUpgradeRepair,
        upgradeTurretCallback: handleUpgradeTurret,
        nextWaveCallback: startNextWave
    }, config);
}

// --- Initialization ---
function init() {
    state = getInitialState();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('click', launchInterceptor);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        launchInterceptor(e.touches[0]);
    });

    UI.showStartScreen(resetAndStartGame);
    gameLoop();
}

init();
