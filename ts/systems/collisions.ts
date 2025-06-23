// ts/systems/collisions.ts
import * as T from '../types';
import { config } from '../config';
import { createAdvancedExplosion, triggerScreenShake } from '../utils';
import { Flash } from '../entities/effects';

function awardPoints(state: T.GameState, rocketType: string) {
    const points = config.points[rocketType as keyof typeof config.points] || config.points.standard;
    state.score += points;
    state.coins += points;
}

export function handleInterceptorCollisions(state: T.GameState): void {
    for (let i = state.interceptors.length - 1; i >= 0; i--) {
        const interceptor = state.interceptors[i];
        let detonated = false;

        // Check collision with boss
        if (state.boss && Math.hypot(interceptor.x - state.boss.x, interceptor.y - state.boss.y) < state.boss.radius) {
            detonated = true;
            const damage = interceptor.type === 'nuke' ? config.nukeDamage : config.interceptorDamage;
            if (state.boss.takeDamage(damage)) {
                awardPoints(state, 'boss');
                createAdvancedExplosion(state, state.boss.x, state.boss.y);
                triggerScreenShake(state, 50, 120);
                state.boss = null;
                state.bossDefeated = true;
            }
        }

        // Check collision with rockets
        for (let j = state.rockets.length - 1; j >= 0 && !detonated; j--) {
            const rocket = state.rockets[j];
            if (Math.hypot(interceptor.x - rocket.x, interceptor.y - rocket.y) < interceptor.blastRadius + rocket.radius) {
                detonated = true;
                const damage = config.interceptorDamage * (state.activePerks.efficientInterceptors && Math.random() < 0.1 ? 3 : 1);
                const isDestroyed = rocket.takeDamage ? rocket.takeDamage(damage) : true;
                
                if (isDestroyed) {
                    awardPoints(state, rocket.type);
                    state.rockets.splice(j, 1);
                }
            }
        }

        // Check collision with flares
        for (let f = state.flares.length - 1; f >= 0 && !detonated; f--) {
            const flare = state.flares[f];
            if (Math.hypot(interceptor.x - flare.x, interceptor.y - flare.y) < interceptor.blastRadius + flare.radius) {
                detonated = true;
                state.flares.splice(f, 1);
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

export function handleTracerCollisions(state: T.GameState): void {
    for (let i = state.tracerRounds.length - 1; i >= 0; i--) {
        const tracer = state.tracerRounds[i];
        let hit = false;
        
        // Check collision with rockets
        for (let j = state.rockets.length - 1; j >= 0; j--) {
            const rocket = state.rockets[j];
            if (Math.hypot(tracer.x - rocket.x, tracer.y - rocket.y) < tracer.radius + rocket.radius) {
                hit = true;
                const damage = rocket.type === 'armored' ? 2 : 1;
                const isDestroyed = rocket.takeDamage ? rocket.takeDamage(damage) : true;

                if (isDestroyed) {
                    awardPoints(state, rocket.type);
                    state.rockets.splice(j, 1);
                    createAdvancedExplosion(state, tracer.x, tracer.y);
                } else {
                    state.flashes.push(new Flash(tracer.x, tracer.y, 20, '255, 255, 255'));
                }
                break; 
            }
        }
        
        if (hit) {
            state.tracerRounds.splice(i, 1);
        }
    }
}