// ts/logic/updateLogic.ts
import { config, difficultySettings } from '../config';
import {
    Rocket,
    MirvRocket,
    StealthRocket,
    SwarmerRocket,
    FlareRocket,
    ArmoredRocket,
    ArtilleryDesignator,
    ArtilleryShell,
} from '../entities/rockets';
import { EMP, Flare } from '../entities/playerAbilities';
import { HiveCarrier } from '../entities/bosses';
import { createAdvancedExplosion, triggerScreenShake, random } from '../utils';
import { Flash, Particle } from '../entities/effects';
import * as T from '../types';
import { getWaveDefinition } from '../waveManager';

export function findTargetedRocket(state: T.GameState): void {
    let closestDist = Infinity;
    state.targetedRocket = null;
    const potentialTargets: (T.Rocket | T.Flare | T.HiveCarrier)[] = [...state.rockets, ...state.flares];
    if (state.boss) {
        potentialTargets.push(state.boss);
    }

    for (const target of potentialTargets) {
        if (target.type === 'stealth' && 'isVisible' in target && !target.isVisible) continue;

        const dist = Math.hypot(target.x - state.mouse.x, target.y - state.mouse.y);
        const targetableRadius = target instanceof HiveCarrier ? target.radius : 50;

        if (dist < targetableRadius && dist < closestDist) {
            closestDist = dist;
            state.targetedRocket = target;
        }
    }
}

export function handleSpawning(state: T.GameState, width: number, height: number): void {
    const waveDef = getWaveDefinition(state.currentWave);
    if (waveDef.isBossWave) return;

    const difficulty = difficultySettings[state.difficulty];
    const difficultyScale = state.currentWave > 5 ? 1 + (state.currentWave - 5) * 0.15 : 1;
    const currentWaveDelay = ((waveDef.delay || 85) * difficulty.waveDelayMultiplier) / difficultyScale;

    const speedBonus = difficulty.enemySpeedBonus || 1;
    const speedMultiplier = (1 + state.currentWave * 0.05) * difficultyScale * speedBonus;

    state.waveRocketSpawn.timer++;

    if (state.waveRocketSpawn.timer > currentWaveDelay && state.waveRocketSpawn.toSpawn.length > 0) {
        const rocketType = state.waveRocketSpawn.toSpawn.pop();
        const sizeMultiplier = difficulty.missileSizeMultiplier;

        let newRocket: T.Rocket | undefined;
        if (rocketType === 'standard') {
            newRocket = new Rocket(undefined, undefined, undefined, undefined, width, sizeMultiplier, speedMultiplier);
        } else if (rocketType === 'mirv') {
            newRocket = new MirvRocket(width, height, sizeMultiplier, speedMultiplier);
        } else if (rocketType === 'stealth') {
            newRocket = new StealthRocket(width, sizeMultiplier, speedMultiplier);
        } else if (rocketType === 'swarmer') {
            newRocket = new SwarmerRocket(width, height, sizeMultiplier, speedMultiplier);
        } else if (rocketType === 'flare_rocket') {
            newRocket = new FlareRocket(width, sizeMultiplier, speedMultiplier);
        } else if (rocketType === 'armored') {
            newRocket = new ArmoredRocket(width, sizeMultiplier, speedMultiplier);
        } else if (rocketType === 'designator') {
            newRocket = new ArtilleryDesignator(width, height, state.cities, sizeMultiplier, speedMultiplier);
        }

        if (newRocket) {
            if (state.scramblerActive && Math.random() < 0.25) {
                newRocket.vx = random(-4, 4);
                newRocket.vy *= 0.8;
            }
            state.rockets.push(newRocket);
        }

        state.waveRocketSpawn.timer = 0;
    }

    if (Math.random() < config.empSpawnChance && state.empPowerUps.length < 1 && state.empActiveTimer <= 0) {
        state.empPowerUps.push(new EMP(null, null, width, height));
    }
}

export function updateBoss(state: T.GameState) {
    if (!state.boss) return;
    state.boss.update(state.rockets);
}

export function updateRockets(state: T.GameState, width: number, height: number) {
    if (state.empActiveTimer > 0) return;

    for (let i = state.rockets.length - 1; i >= 0; i--) {
        const rocket = state.rockets[i];

        rocket.update(state.flares);

        if (rocket instanceof ArtilleryDesignator && rocket.isDesignating) {
            if (rocket.designationTimer > rocket.designationDuration) {
                if (rocket.targetCity) {
                    state.artilleryShells.push(
                        new ArtilleryShell(rocket.targetCity.x + rocket.targetCity.width / 2, rocket.targetCity.y)
                    );
                }
                state.rockets.splice(i, 1);
                continue;
            }
        }

        if (rocket.life > config.rocketMaxLifetime) {
            state.rockets.splice(i, 1);
            continue;
        }

        const bounds = rocket.radius;
        if (rocket.y >= height || rocket.x < -bounds || rocket.x > width + bounds) {
            state.rockets.splice(i, 1);
            continue;
        }

        let hitCity = false;
        if (rocket.type !== 'designator') {
            for (const city of state.cities) {
                if (!city.isDestroyed && rocket.x > city.x && rocket.x < city.x + city.width && rocket.y > city.y) {
                    if (city.isArmored) {
                        city.isArmored = false;
                    } else {
                        city.destroy();
                    }

                    hitCity = true;
                    createAdvancedExplosion(state, rocket.x, rocket.y);
                    triggerScreenShake(state, 15, 30);
                    break;
                }
            }
        }

        if (hitCity) {
            state.rockets.splice(i, 1);
            continue;
        }

        if (rocket.type === 'mirv' || rocket.type === 'swarmer') {
            const splittableRocket = rocket as MirvRocket | SwarmerRocket;
            if (splittableRocket.hasSplit && typeof splittableRocket.split === 'function') {
                state.rockets.push(...splittableRocket.split());
                state.rockets.splice(i, 1);
                continue;
            }
        }
    }
}

export function updateArtilleryShells(state: T.GameState) {
    for (let i = state.artilleryShells.length - 1; i >= 0; i--) {
        const shell = state.artilleryShells[i];
        if (shell.update()) {
            for (const city of state.cities) {
                if (!city.isDestroyed && shell.targetX > city.x && shell.targetX < city.x + city.width) {
                    city.destroy();
                    break;
                }
            }
            createAdvancedExplosion(state, shell.targetX, shell.targetY + 50);
            triggerScreenShake(state, 40, 60);
            state.artilleryShells.splice(i, 1);
        }
    }
}

export function updateFlares(state: T.GameState) {
    for (let i = state.flares.length - 1; i >= 0; i--) {
        const flare = state.flares[i];
        flare.update();
        if (flare.life <= 0) {
            state.flares.splice(i, 1);
        }
    }
}

export function updateTurrets(state: T.GameState) {
    if (state.empActiveTimer > 0) return;
    for (const turret of state.turrets) {
        const newTracers = turret.update(state.rockets);
        if (newTracers.length > 0) {
            state.tracerRounds.push(...newTracers);
        }
    }
}

export function updateTracerRounds(state: T.GameState) {
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
            state.flashes.push(new Flash(tracer.x, tracer.y, 20, '255, 255, 255'));
            if (isDestroyed) {
                state.score += config.points.boss;
                state.coins += config.points.boss;
                createAdvancedExplosion(state, state.boss.x, state.boss.y);
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
                const damage = rocket.type === 'armored' ? 2 : 1;

                if (typeof rocket.takeDamage === 'function') {
                    isDestroyed = rocket.takeDamage(damage);
                }

                state.tracerRounds.splice(i, 1);

                if (isDestroyed) {
                    let points = config.points.standard;
                    if (rocket.type === 'mirv') points = config.points.mirv;
                    else if (rocket.type === 'stealth') points = config.points.stealth;
                    else if (rocket.type === 'swarmer') points = config.points.swarmer;
                    else if (rocket.type === 'flare_rocket') points = config.points.flare_rocket;
                    else if (rocket.type === 'drone') points = config.points.drone;
                    else if (rocket.type === 'armored') points = config.points.armored;
                    else if (rocket.type === 'designator') points = config.points.designator;

                    state.score += points;
                    state.coins += points;
                    state.rockets.splice(j, 1);
                    createAdvancedExplosion(state, rocket.x, rocket.y);
                } else {
                    state.flashes.push(new Flash(tracer.x, tracer.y, 20, '255, 255, 255'));
                }
                break;
            }
        }
    }
}

export function updateInterceptors(state: T.GameState, width: number) {
    for (let i = state.interceptors.length - 1; i >= 0; i--) {
        const interceptor = state.interceptors[i];
        interceptor.update(state.rockets, state.flares, state.boss);

        let detonated = false;
        if (interceptor.y < 0 || interceptor.x < 0 || interceptor.x > width) {
            state.interceptors.splice(i, 1);
            continue;
        }

        let damage = interceptor.type === 'nuke' ? config.nukeDamage : config.interceptorDamage;
        if (state.activePerks.efficientInterceptors && Math.random() < 0.1) {
            damage *= 3;
        }

        if (state.boss && Math.hypot(interceptor.x - state.boss.x, interceptor.y - state.boss.y) < state.boss.radius) {
            const isDestroyed = state.boss.takeDamage(damage);
            state.score += damage * 10;
            state.coins += damage * 10;
            detonated = true;
            if (isDestroyed) {
                state.score += config.points.boss;
                state.coins += config.points.boss;
                createAdvancedExplosion(state, state.boss.x, state.boss.y);
                triggerScreenShake(state, 50, 120);
                state.boss = null;
                state.bossDefeated = true;
            }
        }

        if (!detonated) {
            for (let f = state.flares.length - 1; f >= 0; f--) {
                const flare = state.flares[f];
                if (
                    Math.hypot(interceptor.x - flare.x, interceptor.y - flare.y) <
                    interceptor.blastRadius + flare.radius
                ) {
                    state.flares.splice(f, 1);
                    detonated = true;
                    break;
                }
            }
        }

        if (!detonated) {
            for (let j = state.rockets.length - 1; j >= 0; j--) {
                const rocket = state.rockets[j];
                if (
                    Math.hypot(interceptor.x - rocket.x, interceptor.y - rocket.y) <
                    interceptor.blastRadius + rocket.radius
                ) {
                    let isDestroyed = true;
                    if (typeof rocket.takeDamage === 'function') {
                        isDestroyed = rocket.takeDamage(damage);
                    }

                    if (isDestroyed) {
                        let points = config.points.standard;
                        if (rocket.type === 'mirv') points = config.points.mirv;
                        else if (rocket.type === 'stealth') points = config.points.stealth;
                        else if (rocket.type === 'swarmer') points = config.points.swarmer;
                        else if (rocket.type === 'flare_rocket') points = config.points.flare_rocket;
                        else if (rocket.type === 'drone') points = config.points.drone;
                        else if (rocket.type === 'armored') points = config.points.armored;
                        else if (rocket.type === 'designator') points = config.points.designator;

                        state.score += points;
                        state.coins += points;
                        state.rockets.splice(j, 1);
                    }
                    detonated = true;
                    break;
                }
            }
        }

        if (detonated) {
            createAdvancedExplosion(state, interceptor.x, interceptor.y);
            if (interceptor.type === 'nuke') {
                state.empActiveTimer = config.nukeEmpDuration;
                state.empShockwave = { radius: 0, alpha: 1 };
                triggerScreenShake(state, 30, 60);
            }
            state.interceptors.splice(i, 1);
        }
    }
}

export function updateHomingMines(state: T.GameState) {
    for (let i = state.homingMines.length - 1; i >= 0; i--) {
        const mine = state.homingMines[i];
        if (mine.update(state.rockets)) {
            createAdvancedExplosion(state, mine.x, mine.y);
            triggerScreenShake(state, 10, 20);

            for (let j = state.rockets.length - 1; j >= 0; j--) {
                const rocket = state.rockets[j];
                if (Math.hypot(mine.x - rocket.x, mine.y - rocket.y) < config.homingMineDetonationRadius) {
                    let points = config.points.standard;
                    if (rocket.type === 'mirv') points = config.points.mirv;
                    else if (rocket.type === 'stealth') points = config.points.stealth;
                    else if (rocket.type === 'swarmer') points = config.points.swarmer;
                    else if (rocket.type === 'flare_rocket') points = config.points.flare_rocket;
                    else if (rocket.type === 'drone') points = config.points.drone;
                    else if (rocket.type === 'armored') points = config.points.armored;
                    else if (rocket.type === 'designator') points = config.points.designator;

                    state.score += points;
                    state.coins += points;
                    state.rockets.splice(j, 1);
                }
            }
            state.homingMines.splice(i, 1);
        }
    }
}

export function updateParticles(state: T.GameState) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

export function updateCityEffects(state: T.GameState, height: number) {
    state.cities.forEach((city) => {
        if (city.isSmoking && Math.random() < 0.03) {
            const smokeX = city.x + random(0, city.width);
            const smokeY = height - random(0, city.height * 0.5);
            state.particles.push(new Particle(smokeX, smokeY, null, 'smoke'));
        }
    });
}
