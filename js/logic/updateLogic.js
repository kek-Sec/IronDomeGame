import { config, waveDefinitions, difficultySettings } from '../config.js';
import { Rocket, MirvRocket, StealthRocket, SwarmerRocket, FlareRocket, ArmoredRocket } from '../entities/rockets.js';
import { EMP } from '../entities/playerAbilities.js';
import { HiveCarrier } from '../entities/bosses.js';
import { createExplosion, triggerScreenShake } from '../utils.js';

export function findTargetedRocket(state) {
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

export function handleSpawning(state, width, height) {
    const waveDef = waveDefinitions[Math.min(state.currentWave, waveDefinitions.length - 1)];
    if (waveDef.isBossWave) return;

    const difficulty = difficultySettings[state.difficulty];
    const difficultyScale = state.currentWave > 5 ? 1 + (state.currentWave - 5) * 0.15 : 1;
    const currentWaveDelay = (waveDef.delay * difficulty.waveDelayMultiplier) / difficultyScale;
    
    // Apply the enemy speed bonus from difficulty settings
    const speedBonus = difficulty.enemySpeedBonus || 1;
    const speedMultiplier = (1 + (state.currentWave * 0.05)) * difficultyScale * speedBonus;
    
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

export function updateBoss(state) {
    if (!state.boss) return;
    state.boss.update(state.rockets);
}

export function updateRockets(state, width, height) {
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

export function updateFlares(state) {
    for (let i = state.flares.length - 1; i >= 0; i--) {
        const flare = state.flares[i];
        flare.update();
        if (flare.life <= 0) { state.flares.splice(i, 1); }
    }
}

export function updateTurrets(state) {
    if (state.empActiveTimer > 0) return;
    for (const turret of state.turrets) {
        const newTracers = turret.update(state.rockets);
        if (newTracers.length > 0) {
            state.tracerRounds.push(...newTracers);
        }
    }
}

export function updateTracerRounds(state) {
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
            state.coins += 10;
            state.tracerRounds.splice(i, 1);
            createExplosion(state, tracer.x, tracer.y, 10, 30);
             if (isDestroyed) {
                state.score += config.bosses.hiveCarrier.points;
                state.coins += config.bosses.hiveCarrier.points;
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
                    state.coins += points;
                    state.rockets.splice(j, 1);
                    createExplosion(state, rocket.x, rocket.y, 40, 0);
                }
                break; 
            }
        }
    }
}

export function updateInterceptors(state, width) {
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
            state.coins += damage * 10;
            createExplosion(state, interceptor.x, interceptor.y, interceptor.blastRadius, 0);
            state.interceptors.splice(i, 1);
            if (isDestroyed) {
                state.score += config.bosses.hiveCarrier.points;
                state.coins += config.bosses.hiveCarrier.points;
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
                    state.coins += points;
                    state.rockets.splice(j, 1);
                }

                createExplosion(state, rocket.x, rocket.y, 80, 200);
                state.interceptors.splice(i, 1);
                break;
            }
        }
    }
}

export function updateHomingMines(state) {
    for (let i = state.homingMines.length - 1; i >= 0; i--) {
        const mine = state.homingMines[i];
        if (mine.update(state.rockets)) {
            if (mine.target) {
                // Award points/coins for mine kills
                state.score += config.rocketPoints; 
                state.coins += config.rocketPoints;
                state.rockets = state.rockets.filter(r => r.id !== mine.target.id);
                createExplosion(state, mine.x, mine.y, 60, 30);
            }
            state.homingMines.splice(i, 1);
        }
    }
}

export function updateParticles(state) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}