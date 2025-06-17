/**
 * drawing.js
 * * Handles all rendering on the canvas.
 */

/**
 * Draws the targeting reticle over a rocket.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {object} rocket - The rocket to target.
 * @param {number} gameTime - The current game time for animation.
 */
function drawReticle(ctx, rocket, gameTime) {
    const size = rocket.radius * 2;
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.rotate(gameTime * 0.05);

    ctx.beginPath();
    ctx.moveTo(-size, -size / 2); ctx.lineTo(-size, -size); ctx.lineTo(-size / 2, -size);
    ctx.moveTo(size, -size / 2); ctx.lineTo(size, -size); ctx.lineTo(size / 2, -size);
    ctx.moveTo(-size, size / 2); ctx.lineTo(-size, size); ctx.lineTo(-size / 2, size);
    ctx.moveTo(size, size / 2); ctx.lineTo(size, size); ctx.lineTo(size / 2, size);
    ctx.stroke();
    
    ctx.restore();
}

/**
 * The main drawing function that renders the entire game state.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {object} state - The current game state.
 * @param {number} width - The canvas width.
 * @param {number} height - The canvas height.
 */
export function draw(ctx, state, width, height) {
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
    state.homingMines.forEach(mine => mine.draw(ctx));
    state.empPowerUps.forEach(emp => emp.draw(ctx));
    state.flares.forEach(flare => flare.draw(ctx));
    state.tracerRounds.forEach(t => t.draw(ctx));
    
    if (state.boss) {
        state.boss.draw(ctx);
    }

    if (state.targetedRocket) {
        drawReticle(ctx, state.targetedRocket, state.gameTime);
    }

    ctx.beginPath(); ctx.moveTo(width / 2 - 20, height); ctx.lineTo(width / 2, height - 20); ctx.lineTo(width / 2 + 20, height);
    ctx.closePath(); ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;

    state.rockets.forEach(r => r.draw(ctx));
    state.interceptors.forEach(i => i.draw(ctx));
    state.particles.forEach(p => p.draw(ctx));
    ctx.restore();
}