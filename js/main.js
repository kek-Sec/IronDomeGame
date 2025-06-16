/**
 * main.js
 * * This is the main entry point and controller for the game.
 * It initializes the game, manages the game state, and runs the main game loop.
 * It imports all other necessary modules and orchestrates their interactions.
 */

// --- Module Imports ---
import { config, waveDefinitions, difficultySettings } from './config.js';
import { random } from './utils.js';
import { City, Rocket, MirvRocket, StealthRocket, SwarmerRocket, FlareRocket, Interceptor, Particle, AutomatedTurret, EMP, Flare } from './classes.js';
import * as UI from './ui.js';

// --- DOM & Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseButton = document.getElementById('pause-button');
let width, height;

// --- Game State ---
let animationFrameId; let state = {};

// --- Game State Functions ---
function getInitialState() {
    return {
        gameState: 'START_SCREEN',
        difficulty: 'normal', score: 0,
        remainingInterceptors: 0, currentWave: 0,
        interceptorSpeed: config.initialInterceptorSpeed,
        blastRadius: config.initialBlastRadius,
        rockets: [], interceptors: [], particles: [], cities: [], turrets: [], empPowerUps: [], flares: [],
        empActiveTimer: 0, empShockwave: { radius: 0, alpha: 0 },
        screenShake: { intensity: 0, duration: 0 },
        waveRocketSpawn: { count: 0, timer: 0, toSpawn: [] },
        gameTime: 0,
        fps: 0, frameCount: 0, lastFpsUpdate: 0,
        mouse: { x: 0, y: 0 },
        targetedRocket: null,
        nukeAvailable: false, // For the new Nuke upgrade
        basesAreArmored: false, // For the new Armor upgrade
        turretFireRateLevel: 0, // For turret speed upgrade
    };
}

// --- Core Game Logic ---
function update() {
    state.gameTime++;
    UI.updateTopUI(state);

    if (state.gameState !== 'IN_WAVE') return;
    
    if (state.empActiveTimer > 0) {
        state.empActiveTimer--;
        state.empShockwave.radius += 20;
        state.empShockwave.alpha = Math.max(0, state.empShockwave.alpha - 0.01);
    } else {
        state.empShockwave = { radius: 0, alpha: 0 };
    }

    handleSpawning();
    updateRockets();
    updateFlares();
    updateTurrets();
    updateInterceptors();
    updateParticles();
    state.empPowerUps.forEach((emp, i) => {
        emp.update();
        if (emp.life <= 0) state.empPowerUps.splice(i, 1);
    });
    findTargetedRocket();
    
    checkWaveCompletion();
    checkGameOver();
}

function findTargetedRocket() {
    let closestDist = 50;
    state.targetedRocket = null;
    
    const potentialTargets = [...state.rockets, ...state.flares];

    for (const target of potentialTargets) {
        if (target.type === 'stealth' && !target.isVisible) continue;
        
        const dist = Math.hypot(target.x - state.mouse.x, target.y - state.mouse.y);
        if (dist < closestDist) {
            closestDist = dist;
            state.targetedRocket = target;
        }
    }
}

function handleSpawning() {
    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];
    const difficulty = difficultySettings[state.difficulty];
    const currentWaveDelay = waveDef.delay * difficulty.waveDelayMultiplier;
    const speedMultiplier = 1 + (state.currentWave * 0.05);
    
    state.waveRocketSpawn.timer++;
    
    if (state.waveRocketSpawn.timer > currentWaveDelay && state.waveRocketSpawn.toSpawn.length > 0) {
        const rocketType = state.waveRocketSpawn.toSpawn.pop();
        const sizeMultiplier = difficulty.missileSizeMultiplier;
        
        if (rocketType === 'standard') { state.rockets.push(new Rocket(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier)); } 
        else if (rocketType === 'mirv') { state.rockets.push(new MirvRocket(width, height, sizeMultiplier, speedMultiplier)); }
        else if (rocketType === 'stealth') { state.rockets.push(new StealthRocket(width, sizeMultiplier, speedMultiplier)); }
        else if (rocketType === 'swarmer') { state.rockets.push(new SwarmerRocket(width, height, sizeMultiplier, speedMultiplier)); }
        else if (rocketType === 'flare') { state.rockets.push(new FlareRocket(width, sizeMultiplier, speedMultiplier)); }
        
        state.waveRocketSpawn.timer = 0;
    }

    if (Math.random() < config.empSpawnChance && state.empPowerUps.length < 1 && state.empActiveTimer <= 0) {
        state.empPowerUps.push(new EMP(null, null, width, height));
    }
}

function updateRockets() {
    if (state.empActiveTimer > 0) return;

    for (let i = state.rockets.length - 1; i >= 0; i--) {
        const rocket = state.rockets[i];
        if(rocket.type === 'flare') {
            rocket.update(state.flares);
        } else {
            rocket.update();
        }
        
        if ((rocket.type === 'mirv' || rocket.type === 'swarmer') && rocket.hasSplit) {
            state.rockets.push(...rocket.split());
            state.rockets.splice(i, 1);
            continue;
        }

        if (rocket.y > height - 100 || rocket.x < 0 || rocket.x > width) {
            let hitCity = false;
            if(rocket.y > height - 100) {
                 state.cities.forEach(city => {
                   if (!city.isDestroyed && rocket.x > city.x && rocket.x < city.x + city.width && rocket.y > city.y) {
                       if (city.isArmored) {
                           city.isArmored = false;
                       } else {
                           city.isDestroyed = true;
                       }
                       hitCity = true;
                       createExplosion(rocket.x, rocket.y, 80, 0);
                       triggerScreenShake(15, 30);
                   }
                });
            }

            if (hitCity || rocket.y >= height) {
                if (!hitCity && rocket.y < height + rocket.radius) createExplosion(rocket.x, rocket.y, 40, 0);
                state.rockets.splice(i, 1);
            }
        }
    }
}

function updateFlares() {
    for (let i = state.flares.length - 1; i >= 0; i--) {
        const flare = state.flares[i];
        flare.update();
        if (flare.life <= 0) {
            state.flares.splice(i, 1);
        }
    }
}

function updateTurrets() {
    if (state.empActiveTimer > 0) return;
    for (const turret of state.turrets) {
        const target = turret.update(state.rockets);
        if (target && state.remainingInterceptors > 0) {
            state.interceptors.push(new Interceptor(turret.x, turret.y, target, state.interceptorSpeed, state.blastRadius));
            state.remainingInterceptors--;
        }
    }
}

function updateInterceptors() {
    for (let i = state.interceptors.length - 1; i >= 0; i--) {
        const interceptor = state.interceptors[i];
        interceptor.update(state.rockets, state.flares);

        if (interceptor.y < 0 || interceptor.x < 0 || interceptor.x > width) {
            state.interceptors.splice(i, 1);
            continue;
        }

        // Check collision with flares first
        for (let f = state.flares.length - 1; f >= 0; f--) {
            const flare = state.flares[f];
            if (Math.hypot(interceptor.x - flare.x, interceptor.y - flare.y) < interceptor.blastRadius + flare.radius) {
                state.flares.splice(f, 1);
                createExplosion(interceptor.x, interceptor.y, 20, 50);
                state.interceptors.splice(i, 1);
                break;
            }
        }
        if(!state.interceptors[i]) continue;

        for (let j = state.rockets.length - 1; j >= 0; j--) {
            const rocket = state.rockets[j];
            if (Math.hypot(interceptor.x - rocket.x, interceptor.y - rocket.y) < interceptor.blastRadius + rocket.radius) {
                let points = 0;
                if (rocket.type === 'standard') points = config.rocketPoints;
                else if (rocket.type === 'mirv') points = config.mirvPoints;
                else if (rocket.type === 'stealth') points = config.stealthPoints;
                else if (rocket.type === 'swarmer') points = config.swarmerPoints;
                else if (rocket.type === 'flare') points = config.flareRocketPoints;
                else if (rocket.type === 'drone') points = config.dronePoints;
                state.score += points;
                
                state.rockets.splice(j, 1);
                createExplosion(rocket.x, rocket.y, 80, 200);
                state.interceptors.splice(i, 1);
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
        state.targetedRocket = null;
        state.flares = [];
        state.nukeAvailable = false; // Reset nuke availability
        refreshUpgradeScreen();
    }
}

function checkGameOver() {
    const destroyedCities = state.cities.filter(c => c.isDestroyed).length;
    if (destroyedCities === config.cityCount || (state.remainingInterceptors <= 0 && state.rockets.length > 0 && state.interceptors.length === 0)) {
        state.gameState = 'GAME_OVER';
        UI.showGameOverScreen(state, init);
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
    
    if (state.empShockwave.alpha > 0) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, state.empShockwave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 180, 255, ${state.empShockwave.alpha})`;
        ctx.lineWidth = 15;
        ctx.stroke();
    }
    
    if (state.gameState === 'BETWEEN_WAVES') {
        state.turrets.forEach(turret => {
            ctx.beginPath(); ctx.arc(turret.x, turret.y, turret.range, 0, Math.PI * 2);
            const alpha = 0.2 + (Math.sin(state.gameTime * 0.05) * 0.1);
            ctx.fillStyle = `rgba(0, 221, 255, ${alpha})`; ctx.fill();
            ctx.strokeStyle = `rgba(0, 221, 255, ${alpha * 2})`; ctx.setLineDash([15, 10]);
            ctx.stroke(); ctx.setLineDash([]);
        });
    }

    ctx.fillStyle = 'rgba(0, 221, 255, 0.3)'; ctx.fillRect(0, height - 1, width, 1);

    state.cities.forEach(city => city.draw(ctx, height));
    state.turrets.forEach(turret => turret.draw(ctx));
    state.empPowerUps.forEach(emp => emp.draw(ctx));
    state.flares.forEach(flare => flare.draw(ctx));

    if (state.targetedRocket) {
        drawReticle(state.targetedRocket);
    }

    ctx.beginPath(); ctx.moveTo(width / 2 - 20, height); ctx.lineTo(width / 2, height - 20); ctx.lineTo(width / 2 + 20, height);
    ctx.closePath(); ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;

    state.rockets.forEach(r => r.draw(ctx));
    state.interceptors.forEach(i => i.draw(ctx));
    state.particles.forEach(p => p.draw(ctx));
    ctx.restore();
}

function drawReticle(rocket) {
    const size = rocket.radius * 2;
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.rotate(state.gameTime * 0.05);

    ctx.beginPath();
    ctx.moveTo(-size, -size / 2); ctx.lineTo(-size, -size); ctx.lineTo(-size / 2, -size);
    ctx.moveTo(size, -size / 2); ctx.lineTo(size, -size); ctx.lineTo(size / 2, -size);
    ctx.moveTo(-size, size / 2); ctx.lineTo(-size, size); ctx.lineTo(-size / 2, size);
    ctx.moveTo(size, size / 2); ctx.lineTo(size, size); ctx.lineTo(size / 2, size);
    ctx.stroke();
    
    ctx.restore();
}

// --- Game Flow ---
function gameLoop(timestamp) {
    state.frameCount++;
    if (timestamp - state.lastFpsUpdate > 1000) {
        state.fps = state.frameCount;
        state.frameCount = 0;
        state.lastFpsUpdate = timestamp;
    }

    update(); 
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function startNextWave() {
    state.currentWave++;
    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];
    
    let spawnList = [];
    for(let i=0; i<waveDef.standard; i++) spawnList.push('standard');
    for(let i=0; i<waveDef.mirv; i++) spawnList.push('mirv');
    for(let i=0; i<waveDef.stealth; i++) spawnList.push('stealth');
    for(let i=0; i<waveDef.swarmer; i++) spawnList.push('swarmer');
    for(let i=0; i<waveDef.flare; i++) spawnList.push('flare');
    state.waveRocketSpawn.toSpawn = spawnList.sort(() => Math.random() - 0.5);

    state.waveRocketSpawn.timer = 0;
    state.gameState = 'IN_WAVE';
    UI.hideModal();
    UI.updateTopUI(state);
}

function resetAndStartGame(difficulty = 'normal') {
    state = getInitialState();
    state.difficulty = difficulty;
    state.remainingInterceptors = difficultySettings[difficulty].initialInterceptors;
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
        const h = random(40, height * 0.2);
        const w = cityWidth * random(0.6, 0.8);
        const x = (i * cityWidth) + (cityWidth - w) / 2;
        state.cities.push(new City(x, height - h, w, h, state.basesAreArmored));
    }
}

function createExplosion(x, y, count, baseColor) {
    if (state.particles.length > config.maxParticles) return;
    for (let i = 0; i < count; i++) {
        state.particles.push(new Particle(x, y, baseColor + random(-20, 20)));
    }
}

function triggerScreenShake(intensity, duration) {
    state.screenShake.intensity = intensity;
    state.screenShake.duration = duration;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
}

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = state.empPowerUps.length - 1; i >= 0; i--) {
        const emp = state.empPowerUps[i];
        if (Math.hypot(x - emp.x, y - emp.y) < emp.radius) {
            state.empActiveTimer = config.empDuration;
            state.empShockwave = { radius: 0, alpha: 1 };
            state.empPowerUps.splice(i, 1);
            return;
        }
    }
    
    if (state.gameState === 'IN_WAVE' && state.remainingInterceptors > 0 && state.targetedRocket) {
        const interceptorType = state.nukeAvailable ? 'nuke' : 'standard';
        state.interceptors.push(new Interceptor(width / 2, height, state.targetedRocket, state.interceptorSpeed, state.blastRadius, interceptorType));
        if (state.nukeAvailable) {
            state.nukeAvailable = false;
        } else {
            state.remainingInterceptors--;
        }
        UI.updateTopUI(state);
    }
}

function togglePause() {
    if (state.gameState === 'IN_WAVE') {
        state.gameState = 'PAUSED';
        UI.showPauseScreen(togglePause, init);
    } else if (state.gameState === 'PAUSED') {
        state.gameState = 'IN_WAVE';
        UI.hideModal();
    }
}


function handleUpgradeInterceptors() {
    if (state.score >= config.upgradeCosts.interceptors) {
        state.score -= config.upgradeCosts.interceptors; state.remainingInterceptors += 5;
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
        const fireRate = config.turretFireRate * difficultySettings[state.difficulty].turretFireRateMultiplier;
        state.turrets.push(new AutomatedTurret(turretX, height - 10, config.turretRange, fireRate));
        draw();
        refreshUpgradeScreen();
    }
}

function handleUpgradeSpeed() {
    if (state.score >= config.upgradeCosts.interceptorSpeed) {
        state.score -= config.upgradeCosts.interceptorSpeed;
        state.interceptorSpeed *= 1.2;
        refreshUpgradeScreen();
    }
}

function handleUpgradeBlast() {
    if (state.score >= config.upgradeCosts.blastRadius) {
        state.score -= config.upgradeCosts.blastRadius;
        state.blastRadius *= 1.3;
        refreshUpgradeScreen();
    }
}

function handleUpgradeNuke() {
    if(state.score >= config.upgradeCosts.nuke && !state.nukeAvailable) {
        state.score -= config.upgradeCosts.nuke;
        state.nukeAvailable = true;
        refreshUpgradeScreen();
    }
}
function handleUpgradeBaseArmor() {
    if(state.score >= config.upgradeCosts.baseArmor && !state.basesAreArmored) {
        state.score -= config.upgradeCosts.baseArmor;
        state.basesAreArmored = true;
        state.cities.forEach(c => c.isArmored = true);
        refreshUpgradeScreen();
    }
}
function handleUpgradeTurretSpeed() {
     if(state.score >= config.upgradeCosts.turretSpeed && state.turretFireRateLevel < 3) {
        state.score -= config.upgradeCosts.turretSpeed;
        state.turretFireRateLevel++;
        state.turrets.forEach(t => t.fireRate *= 0.75); // 25% faster
        refreshUpgradeScreen();
    }
}

function refreshUpgradeScreen() {
    UI.updateTopUI(state);
    UI.showBetweenWaveScreen(state, {
        upgradeInterceptorsCallback: handleUpgradeInterceptors,
        upgradeRepairCallback: handleUpgradeRepair,
        upgradeTurretCallback: handleUpgradeTurret,
        upgradeSpeedCallback: handleUpgradeSpeed,
        upgradeBlastCallback: handleUpgradeBlast,
        upgradeNukeCallback: handleUpgradeNuke,
        upgradeBaseArmorCallback: handleUpgradeBaseArmor,
        upgradeTurretSpeedCallback: handleUpgradeTurretSpeed,
        nextWaveCallback: startNextWave
    }, config);
}

// --- Initialization ---
function init() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    state = getInitialState();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    pauseButton.addEventListener('click', togglePause);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        if (state.gameState === 'IN_WAVE' && state.remainingInterceptors > 0) {
            let closestDist = 100;
            let touchTarget = null;
            const potentialTargets = [...state.rockets, ...state.flares];
            for (const target of potentialTargets) {
                 if(target.type === 'stealth' && !target.isVisible) continue;
                const dist = Math.hypot(target.x - x, target.y - y);
                if (dist < closestDist) {
                    closestDist = dist;
                    touchTarget = target;
                }
            }
            if (touchTarget) {
                 state.interceptors.push(new Interceptor(width / 2, height, touchTarget, state.interceptorSpeed, state.blastRadius));
                 state.remainingInterceptors--;
                 UI.updateTopUI(state);
            }
        }
    });

    UI.showStartScreen(resetAndStartGame);
    animationFrameId = requestAnimationFrame(gameLoop);
}

init();