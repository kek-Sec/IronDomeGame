/**
 * gameLogic.js
 * * Contains the core game logic for updating the game state each frame.
 */
import { config, waveDefinitions, difficultySettings } from './config.js';
import { Rocket, MirvRocket, StealthRocket, SwarmerRocket, FlareRocket, Interceptor, EMP, ArmoredRocket, HomingMine, HiveCarrier } from './classes.js';
import { createExplosion, triggerScreenShake } from './helpers.js';
import * as UI from './ui.js';
import { savePlayerData } from './saveManager.js';

function findTargetedRocket(state) {
    let closestDist = Infinity;
    state.targetedRocket = null;
    const potentialTargets = [...state.rockets, ...state.flares];
    if (state.boss) {
        potentialTargets.push(state.boss);
    }

    for (const target of potentialTargets) {
        if (target.type === 'stealth' && !target.isVisible) continue;

        const dist = Math.hypot(target.x - state.mouse.x, target.y - state.mouse.y);
        const targetableRadius = (target instanceof HiveCarrier) ? target.radius : 50; 

        if (dist < targetableRadius && dist < closestDist) {
            closestDist = dist;
            state.targetedRocket = target;
        }
    }
}

function handleSpawning(state, width, height) {
    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];
    if (waveDef.isBossWave) return;

    const difficulty = difficultySettings[state.difficulty];
    const difficultyScale = state.currentWave > 5 ? 1 + (state.currentWave - 5) * 0.15 : 1;
    const currentWaveDelay = (waveDef.delay * difficulty.waveDelayMultiplier) / difficultyScale;
    const speedMultiplier = (1 + (state.currentWave * 0.05)) * difficultyScale;
    
    state.waveRocketSpawn.timer++;

    if (state.waveRocketSpawn.timer > currentWaveDelay && state.waveRocketSpawn.toSpawn.length > 0) {
        const rocketType = state.waveRocketSpawn.toSpawn.pop();
        const sizeMultiplier = difficulty.missileSizeMultiplier;

        if (rocketType === 'standard') { state.rockets.push(new Rocket(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier)); } 
        else if (rocketType === 'mirv') { state.rockets.push(new MirvRocket(width, height, sizeMultiplier, speedMultiplier)); }
        else if (rocketType === 'stealth') { state.rockets.push(new StealthRocket(width, sizeMultiplier, speedMultiplier)); }
        else if (rocketType === 'swarmer') { state.rockets.push(new SwarmerRocket(width, height, sizeMultiplier, speedMultiplier)); }
        else if (rocketType === 'flare') { state.rockets.push(new FlareRocket(width, sizeMultiplier, speedMultiplier)); }
        else if (rocketType === 'armored') { state.rockets.push(new ArmoredRocket(width, sizeMultiplier, speedMultiplier)); }
        
        state.waveRocketSpawn.timer = 0;
    }

    if (Math.random() < config.empSpawnChance && state.empPowerUps.length < 1 && state.empActiveTimer <= 0) {
        state.empPowerUps.push(new EMP(null, null, width, height));
    }
}

function updateBoss(state) {
    if (!state.boss) return;
    state.boss.update(state.rockets);
}

function updateRockets(state, width, height) {
    if (state.empActiveTimer > 0) return;
    for (let i = state.rockets.length - 1; i >= 0; i--) {
        const rocket = state.rockets[i];
        if (rocket.type === 'flare') { rocket.update(state.flares); } 
        else { rocket.update(); }
        
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
                       if (city.isArmored) { city.isArmored = false; } 
                       else { city.isDestroyed = true; }
                       hitCity = true;
                       createExplosion(state, rocket.x, rocket.y, 80, 0);
                       triggerScreenShake(state, 15, 30);
                   }
                });
            }
            if (hitCity || rocket.y >= height) {
                if (!hitCity && rocket.y < height + rocket.radius) createExplosion(state, rocket.x, rocket.y, 40, 0);
                state.rockets.splice(i, 1);
            }
        }
    }
}

function updateFlares(state) {
    for (let i = state.flares.length - 1; i >= 0; i--) {
        const flare = state.flares[i];
        flare.update();
        if (flare.life <= 0) { state.flares.splice(i, 1); }
    }
}

function updateTurrets(state) {
    if (state.empActiveTimer > 0) return;
    for (const turret of state.turrets) {
        const newTracers = turret.update(state.rockets);
        if (newTracers.length > 0) {
            state.tracerRounds.push(...newTracers);
        }
    }
}

function updateTracerRounds(state) {
    for (let i = state.tracerRounds.length - 1; i >= 0; i--) {
        const tracer = state.tracerRounds[i];
        tracer.update();
        if (tracer.life <= 0 || tracer.y < 0) {
            state.tracerRounds.splice(i, 1);
            continue;
        }

        if (state.boss && Math.hypot(tracer.x - state.boss.x, tracer.y - state.boss.y) < state.boss.radius) {
            const isDestroyed = state.boss.takeDamage(1);
            state.score += 10;
            state.tracerRounds.splice(i, 1);
            createExplosion(state, tracer.x, tracer.y, 10, 30);
             if (isDestroyed) {
                state.score += config.bosses.hiveCarrier.points;
                createExplosion(state, state.boss.x, state.boss.y, 500, 0);
                triggerScreenShake(state, 50, 120);
                state.boss = null;
                state.bossDefeated = true;
            }
            continue;
        }

        for (let j = state.rockets.length - 1; j >= 0; j--) {
            const rocket = state.rockets[j];
            if (Math.hypot(tracer.x - rocket.x, tracer.y - rocket.y) < tracer.radius + rocket.radius) {
                let isDestroyed = true;
                if (typeof rocket.takeDamage === 'function') {
                    isDestroyed = rocket.takeDamage(1);
                }
                
                state.tracerRounds.splice(i, 1);
                createExplosion(state, tracer.x, tracer.y, 10, 30);
                
                if (isDestroyed) {
                    let points = 0;
                    if (rocket.type === 'standard') points = config.rocketPoints;
                    else if (rocket.type === 'mirv') points = config.mirvPoints;
                    else if (rocket.type === 'stealth') points = config.stealthPoints;
                    else if (rocket.type === 'swarmer') points = config.swarmerPoints;
                    else if (rocket.type === 'flare') points = config.flareRocketPoints;
                    else if (rocket.type === 'drone') points = config.dronePoints;
                    else if (rocket.type === 'armored') points = config.armoredPoints;
                    state.score += points;
                    state.rockets.splice(j, 1);
                    createExplosion(state, rocket.x, rocket.y, 40, 0);
                }
                break; 
            }
        }
    }
}

function updateInterceptors(state, width) {
    for (let i = state.interceptors.length - 1; i >= 0; i--) {
        const interceptor = state.interceptors[i];
        interceptor.update(state.rockets, state.flares, state.boss);

        if (interceptor.y < 0 || interceptor.x < 0 || interceptor.x > width) {
            state.interceptors.splice(i, 1);
            continue;
        }

        // Perk: Efficient Interceptors
        let damage = interceptor.type === 'nuke' ? 100 : 3;
        if (state.activePerks.efficientInterceptors && Math.random() < 0.10) {
            damage *= 3; // Critical Hit!
        }

        if (state.boss && Math.hypot(interceptor.x - state.boss.x, interceptor.y - state.boss.y) < state.boss.radius) {
            const isDestroyed = state.boss.takeDamage(damage);
            state.score += damage * 10;
            createExplosion(state, interceptor.x, interceptor.y, interceptor.blastRadius, 0);
            state.interceptors.splice(i, 1);
            if (isDestroyed) {
                state.score += config.bosses.hiveCarrier.points;
                createExplosion(state, state.boss.x, state.boss.y, 500, 0);
                triggerScreenShake(state, 50, 120);
                state.boss = null;
                state.bossDefeated = true;
            }
            continue;
        }


        for (let f = state.flares.length - 1; f >= 0; f--) {
            const flare = state.flares[f];
            if (Math.hypot(interceptor.x - flare.x, interceptor.y - flare.y) < interceptor.blastRadius + flare.radius) {
                state.flares.splice(f, 1);
                createExplosion(state, interceptor.x, interceptor.y, 20, 50);
                state.interceptors.splice(i, 1);
                break;
            }
        }
        if(!state.interceptors[i]) continue;

        for (let j = state.rockets.length - 1; j >= 0; j--) {
            const rocket = state.rockets[j];
            if (Math.hypot(interceptor.x - rocket.x, interceptor.y - rocket.y) < interceptor.blastRadius + rocket.radius) {
                let isDestroyed = true;
                 if (typeof rocket.takeDamage === 'function') {
                    isDestroyed = rocket.takeDamage(damage);
                }
                
                if (isDestroyed) {
                    let points = 0;
                    if (rocket.type === 'standard') points = config.rocketPoints;
                    else if (rocket.type === 'mirv') points = config.mirvPoints;
                    else if (rocket.type === 'stealth') points = config.stealthPoints;
                    else if (rocket.type === 'swarmer') points = config.swarmerPoints;
                    else if (rocket.type === 'flare') points = config.flareRocketPoints;
                    else if (rocket.type === 'drone') points = config.dronePoints;
                    else if (rocket.type === 'armored') points = config.armoredPoints;
                    state.score += points;
                    state.rockets.splice(j, 1);
                }

                createExplosion(state, rocket.x, rocket.y, 80, 200);
                state.interceptors.splice(i, 1);
                break;
            }
        }
    }
}

function updateHomingMines(state) {
    for (let i = state.homingMines.length - 1; i >= 0; i--) {
        const mine = state.homingMines[i];
        if (mine.update(state.rockets)) {
            if (mine.target) {
                state.rockets = state.rockets.filter(r => r.id !== mine.target.id);
                createExplosion(state, mine.x, mine.y, 60, 30);
            }
            state.homingMines.splice(i, 1);
        }
    }
}

function updateParticles(state) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

export function update(state, width, height, refreshUpgradeScreen, init) {
    state.gameTime++;
    UI.updateTopUI(state);
    UI.updateBossUI(state.boss);
    if (state.gameState !== 'IN_WAVE') return;

    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];

    if (!waveDef.isBossWave && state.rockets.length === 0 && state.waveRocketSpawn.toSpawn.length > 0) {
        state.timeSinceLastRocket++;
    } else {
        state.timeSinceLastRocket = 0;
    }
    
    if (state.empActiveTimer > 0) {
        state.empActiveTimer--;
        state.empShockwave.radius += 20;
        state.empShockwave.alpha = Math.max(0, state.empShockwave.alpha - 0.01);
    } else {
        state.empShockwave = { radius: 0, alpha: 0 };
    }

    handleSpawning(state, width, height);
    updateBoss(state);
    updateRockets(state, width, height);
    updateFlares(state);
    updateTurrets(state);
    updateInterceptors(state, width);
    updateTracerRounds(state);
    updateHomingMines(state);
    updateParticles(state);
    state.empPowerUps.forEach((emp, i) => {
        emp.update();
        if (emp.life <= 0) state.empPowerUps.splice(i, 1);
    });
    findTargetedRocket(state);
    
    let waveIsOver = false;

    if (state.timeSinceLastRocket > 1200) {
        waveIsOver = true;
        console.warn("Failsafe triggered: Wave ended due to timeout.");
        state.waveRocketSpawn.toSpawn = []; 
    }

    if (waveDef.isBossWave) {
        if (state.bossDefeated && state.rockets.length === 0) {
            waveIsOver = true;
        }
    } else {
        if (state.rockets.length === 0 && state.waveRocketSpawn.toSpawn.length === 0) {
            waveIsOver = true;
        }
    }

    if (waveIsOver) {
        state.gameState = 'BETWEEN_WAVES';
        state.targetedRocket = null;
        state.flares = [];
        state.nukeAvailable = false;
        state.firstUpgradePurchased = false; // Reset for Rapid Deployment perk
        refreshUpgradeScreen();
    }
    
    const destroyedCities = state.cities.filter(c => c.isDestroyed).length;
    if (destroyedCities === config.cityCount) {
        state.gameState = 'GAME_OVER';

        // Award Prestige Points and save data
        const pointsEarned = Math.floor(state.score / 100) + state.currentWave * 10;
        state.playerData.prestigePoints += pointsEarned;
        savePlayerData(state.playerData);

        UI.showGameOverScreen(state, init, pointsEarned);
    }
}