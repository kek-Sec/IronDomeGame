// ts/drawing.ts
// * Handles all rendering on the canvas.
import type {
    GameState,
    Rocket,
    Flare,
    HiveCarrier,
    City,
    AutomatedTurret,
    HomingMine,
    EMP,
    TracerRound,
    ArtilleryShell,
    Interceptor,
    Particle,
    Flash,
    Shockwave,
} from './types';

/**
 * Draws the targeting reticle over a rocket.
 * @param ctx - The canvas rendering context.
 * @param rocket - The rocket to target.
 * @param gameTime - The current game time for animation.
 */
function drawReticle(ctx: CanvasRenderingContext2D, rocket: Rocket | Flare | HiveCarrier, gameTime: number): void {
    const size = rocket.radius * 2;
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.rotate(gameTime * 0.05);

    ctx.beginPath();
    ctx.moveTo(-size, -size / 2);
    ctx.lineTo(-size, -size);
    ctx.lineTo(-size / 2, -size);
    ctx.moveTo(size, -size / 2);
    ctx.lineTo(size, -size);
    ctx.lineTo(size / 2, -size);
    ctx.moveTo(-size, size / 2);
    ctx.lineTo(-size, size);
    ctx.lineTo(-size / 2, size);
    ctx.moveTo(size, size / 2);
    ctx.lineTo(size, size);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    ctx.restore();
}

/**
 * The main drawing function that renders the entire game state.
 * @param ctx - The canvas rendering context.
 * @param state - The current game state.
 * @param width - The canvas width.
 * @param height - The canvas height.
 */
export function draw(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number): void {
    ctx.save();
    if (state.screenShake.duration > 0) {
        ctx.translate(
            (Math.random() - 0.5) * state.screenShake.intensity,
            (Math.random() - 0.5) * state.screenShake.intensity
        );
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
        state.turrets.forEach((turret: AutomatedTurret) => {
            ctx.beginPath();
            ctx.arc(turret.x, turret.y, turret.range, 0, Math.PI * 2);
            const alpha = 0.2 + Math.sin(state.gameTime * 0.05) * 0.1;
            ctx.fillStyle = `rgba(0, 221, 255, ${alpha})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(0, 221, 255, ${alpha * 2})`;
            ctx.setLineDash([15, 10]);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }

    ctx.fillStyle = 'rgba(0, 221, 255, 0.3)';
    ctx.fillRect(0, height - 1, width, 1);

    state.cities.forEach((city: City) => city.draw(ctx, height));
    state.turrets.forEach((turret: AutomatedTurret) => turret.draw(ctx));
    state.homingMines.forEach((mine: HomingMine) => mine.draw(ctx));
    state.empPowerUps.forEach((emp: EMP) => emp.draw(ctx));
    state.flares.forEach((flare: Flare) => flare.draw(ctx));
    state.tracerRounds.forEach((t: TracerRound) => t.draw(ctx));

    if (state.boss) {
        state.boss.draw(ctx);
    }

    if (state.targetedRocket) {
        drawReticle(ctx, state.targetedRocket, state.gameTime);
    }

    state.artilleryShells.forEach((s: ArtilleryShell) => s.draw(ctx));

    ctx.beginPath();
    ctx.moveTo(width / 2 - 20, height);
    ctx.lineTo(width / 2, height - 20);
    ctx.lineTo(width / 2 + 20, height);
    ctx.closePath();
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    state.rockets.forEach((r: Rocket) => r.draw(ctx));
    state.interceptors.forEach((i: Interceptor) => i.draw(ctx));
    state.particles.forEach((p: Particle) => p.draw(ctx));

    // Draw new visual effects
    ctx.globalCompositeOperation = 'lighter'; // Additive blending for bright effects
    state.flashes.forEach((f: Flash) => f.draw(ctx));
    ctx.globalCompositeOperation = 'source-over'; // Reset blending mode
    state.shockwaves.forEach((s: Shockwave) => s.draw(ctx));

    ctx.restore();
}
