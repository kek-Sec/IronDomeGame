"use strict";
(() => {
  // ts/config.ts
  var difficultySettings = {
    easy: {
      name: "Recruit",
      description: "A balanced introduction to the battlefield. Enemies are slightly slower and you start with more funding.",
      waveDelayMultiplier: 1.25,
      missileSizeMultiplier: 1.5,
      turretFireRateMultiplier: 0.8,
      enemySpeedBonus: 0.85,
      startingCoins: 250
    },
    normal: {
      name: "Veteran",
      description: "The standard combat scenario. A true test of your defensive capabilities against a determined foe.",
      waveDelayMultiplier: 1,
      missileSizeMultiplier: 1.25,
      turretFireRateMultiplier: 1,
      enemySpeedBonus: 1,
      startingCoins: 150
    },
    hard: {
      name: "Elite",
      description: "For seasoned commanders only. The enemy is faster, smarter, and relentless. Expect smaller targets and less time to react.",
      waveDelayMultiplier: 0.6,
      missileSizeMultiplier: 0.9,
      turretFireRateMultiplier: 1.75,
      enemySpeedBonus: 1.2,
      startingCoins: 100
    }
  };
  var config = {
    // Gameplay Constants
    cityCount: 5,
    initialInterceptorSpeed: 7,
    initialBlastRadius: 15,
    nukeBlastRadius: 150,
    maxTurrets: 2,
    turretFireRate: 90,
    // Lower is faster
    turretRange: 350,
    empSpawnChance: 5e-4,
    empDuration: 300,
    // 5 seconds at 60fps
    nukeEmpDuration: 120,
    // 2 seconds
    rocketMaxLifetime: 2700,
    // 45 seconds
    homingMineDetonationRadius: 100,
    homingMineDeploymentZone: 0.85,
    // Mines can only be placed in the bottom 15% of the screen
    flareDistractionRadius: 100,
    touchTargetingRadius: 100,
    interceptorDamage: 3,
    nukeDamage: 100,
    // Particle & Effect Constants
    maxParticles: 300,
    // Point & Coin Values
    points: {
      standard: 100,
      mirv: 200,
      stealth: 300,
      swarmer: 150,
      drone: 25,
      flare_rocket: 200,
      armored: 500,
      designator: 400,
      boss: 5e3
    },
    // Upgrade Costs
    upgradeCosts: {
      repairCity: 1e3,
      automatedTurret: 2500,
      interceptorSpeed: 750,
      multishot: 1500,
      flakWarheads: 1200,
      nuke: 3500,
      baseArmor: 2e3,
      turretSpeed: 1500,
      turretRange: 1800,
      homingMine: 800,
      fieldReinforcement: 1250,
      targetingScrambler: 1750
    },
    // Boss Configuration
    bosses: {
      hiveCarrier: {
        health: 250,
        droneSpawnRate: 90
      }
    },
    // Static Wave Definitions (used by waveManager)
    waveDefinitions: [
      { standard: 6, delay: 120 },
      { standard: 8, mirv: 1, delay: 115 },
      { standard: 7, stealth: 1, flare_rocket: 1, delay: 110 },
      { standard: 8, mirv: 2, swarmer: 1, delay: 100 },
      { isBossWave: true, bossType: "hiveCarrier", delay: 95 },
      { standard: 5, mirv: 3, stealth: 1, swarmer: 2, flare_rocket: 2, armored: 1, delay: 90 },
      { standard: 8, mirv: 2, stealth: 2, swarmer: 2, flare_rocket: 2, armored: 2, designator: 1, delay: 85 }
    ]
  };
  var rocketInfo = {
    standard: {
      name: "Standard Rocket",
      threat: "Low",
      description: "A common, straightforward projectile. Predictable and unarmored."
    },
    armored: {
      name: "Armored Rocket",
      threat: "Medium",
      description: "A slow but tough rocket that requires multiple hits to destroy."
    },
    mirv: { name: "MIRV", threat: "High", description: "Splits into three standard rockets mid-flight." },
    swarmer: { name: "Swarmer", threat: "High", description: "Deploys a swarm of six fast-moving but fragile drones." },
    drone: {
      name: "Drone",
      threat: "Low",
      description: "A small, fast-moving projectile deployed by Swarmer rockets."
    },
    stealth: { name: "Stealth Rocket", threat: "Medium", description: "Periodically cloaks, making it untargetable." },
    flare_rocket: {
      name: "Flare Rocket",
      threat: "Medium",
      description: "Continuously deploys decoy flares that distract interceptors."
    },
    designator: {
      name: "Artillery Designator",
      threat: "Critical",
      description: "Targets a city for a devastating artillery strike. Must be destroyed quickly."
    }
  };

  // ts/entities/effects.ts
  var Particle = class {
    constructor(x, y, color, type = "debris") {
      this.x = x;
      this.y = y;
      this.life = random(60, 100);
      this.initialLife = this.life;
      this.type = type;
      if (this.type === "smoke") {
        this.radius = random(3, 8);
        this.vy = -random(0.2, 0.5);
        this.vx = random(-0.2, 0.2);
        this.gravity = 0;
        this.color = `rgba(120, 120, 120, 1)`;
      } else {
        this.radius = random(1, 4);
        const angle = random(0, Math.PI * 2);
        const speed = this.type === "spark" ? random(3, 7) : random(1, 6);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = this.type === "spark" ? 0.01 : 0.05;
        this.color = `hsla(${color}, 100%, ${random(60, 80)}%, 1)`;
      }
    }
    update() {
      this.life--;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      if (this.type === "smoke") {
        this.radius *= 1.015;
      }
    }
    draw(ctx2) {
      const alpha = Math.max(0, this.life / this.initialLife);
      ctx2.beginPath();
      if (this.type === "spark") {
        ctx2.moveTo(this.x, this.y);
        ctx2.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx2.strokeStyle = this.color.replace("1)", `${alpha})`);
        ctx2.lineWidth = this.radius * 0.8;
        ctx2.stroke();
      } else {
        const color = this.type === "smoke" ? this.color.replace("1)", `${alpha * 0.5})`) : this.color.replace("1)", `${alpha})`);
        ctx2.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx2.fillStyle = color;
        ctx2.fill();
      }
    }
  };
  var Flash = class {
    constructor(x, y, radius, color) {
      this.x = x;
      this.y = y;
      this.maxRadius = radius;
      this.radius = 0;
      this.speed = 4;
      this.alpha = 1;
      this.color = color;
    }
    update() {
      this.radius += this.maxRadius / this.speed;
      if (this.radius > this.maxRadius) this.radius = this.maxRadius;
      this.alpha -= 1 / this.speed;
    }
    draw(ctx2) {
      ctx2.beginPath();
      ctx2.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(${this.color}, ${Math.max(0, this.alpha)})`;
      ctx2.fill();
    }
  };
  var Shockwave = class {
    constructor(x, y, radius) {
      this.x = x;
      this.y = y;
      this.maxRadius = radius;
      this.radius = 0;
      this.speed = 10;
      this.alpha = 1;
      this.lineWidth = 5;
    }
    update() {
      this.radius += this.maxRadius / this.speed;
      this.alpha -= 1 / (this.speed * 1.2);
      this.lineWidth *= 0.95;
    }
    draw(ctx2) {
      ctx2.beginPath();
      ctx2.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx2.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, this.alpha)})`;
      ctx2.lineWidth = Math.max(0, this.lineWidth);
      ctx2.stroke();
    }
  };

  // ts/utils.ts
  var random = (min, max) => Math.random() * (max - min) + min;
  function createAdvancedExplosion(state2, x, y) {
    if (state2.particles.length > config.maxParticles) return;
    state2.flashes.push(new Flash(x, y, 40, "255, 255, 255"));
    state2.shockwaves.push(new Shockwave(x, y, 60));
    for (let i = 0; i < 20; i++) {
      state2.particles.push(new Particle(x, y, random(20, 40), "debris"));
    }
    for (let i = 0; i < 15; i++) {
      state2.particles.push(new Particle(x, y, random(45, 60), "spark"));
    }
    triggerScreenShake(state2, 5, 15);
  }
  function createGroundImpact(state2, x, y) {
    if (state2.particles.length > config.maxParticles) return;
    state2.flashes.push(new Flash(x, y, 25, "200, 200, 200"));
    state2.shockwaves.push(new Shockwave(x, y, 30));
    for (let i = 0; i < 10; i++) {
      const p = new Particle(x, y, random(20, 40), "debris");
      p.vy = -Math.abs(p.vy) * 0.7;
      state2.particles.push(p);
    }
    triggerScreenShake(state2, 2, 8);
  }
  function triggerScreenShake(state2, intensity, duration) {
    if (state2.screenShake.duration > 0 && intensity < state2.screenShake.intensity) return;
    state2.screenShake.intensity = intensity;
    state2.screenShake.duration = duration;
  }

  // ts/entities/playerAbilities.ts
  var Interceptor = class {
    constructor(startX, startY, target, speed, blastRadius, type = "standard") {
      this.trail = [];
      this.hasBeenDistracted = false;
      this.x = startX;
      this.y = startY;
      this.target = target;
      this.radius = type === "nuke" ? 10 : 3;
      this.speed = speed;
      this.blastRadius = type === "nuke" ? config.nukeBlastRadius : blastRadius;
      this.type = type;
      this.isHoming = !!target;
      this.vx = 0;
      this.vy = -speed;
    }
    update(rockets, flares, boss) {
      if (this.isHoming && this.target) {
        const targetIsRocket = this.target.type !== "flare" && this.target.type !== "hive_carrier" && !rockets.find((r) => r.id === this.target.id);
        const targetIsFlare = this.target.type === "flare" && !flares.find((f) => f.id === this.target.id);
        const targetIsBoss = this.target.type === "hive_carrier" && !boss;
        if (targetIsRocket || targetIsFlare || targetIsBoss) {
          this.isHoming = false;
        }
      }
      if (this.isHoming && !this.hasBeenDistracted && this.target.type !== "flare") {
        for (const flare of flares) {
          if (Math.hypot(this.x - flare.x, this.y - flare.y) < config.flareDistractionRadius) {
            this.target = flare;
            this.hasBeenDistracted = true;
            break;
          }
        }
      }
      if (this.isHoming && this.target) {
        const targetX = this.target.x;
        const targetY = this.target.y;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
      }
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 25) this.trail.shift();
      this.x += this.vx;
      this.y += this.vy;
    }
    draw(ctx2) {
      ctx2.beginPath();
      if (this.trail.length > 0) {
        ctx2.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) ctx2.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx2.strokeStyle = this.type === "nuke" ? `rgba(255, 100, 0, 0.7)` : `rgba(0, 255, 255, 0.5)`;
      ctx2.lineWidth = this.type === "nuke" ? 5 : 2;
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx2.fillStyle = "white";
      ctx2.fill();
      ctx2.shadowColor = this.type === "nuke" ? "orange" : "cyan";
      ctx2.shadowBlur = 20;
      ctx2.fill();
      ctx2.shadowBlur = 0;
    }
  };
  var Flare = class {
    constructor(x, y) {
      this.type = "flare";
      this.x = x;
      this.y = y;
      this.vx = random(-2, 2);
      this.vy = random(-1, 1);
      this.radius = 5;
      this.life = 120;
      this.id = random(0, 1e6);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
    }
    draw(ctx2) {
      const alpha = this.life / 120;
      ctx2.beginPath();
      ctx2.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
      ctx2.shadowColor = `rgba(255, 215, 0, 1)`;
      ctx2.shadowBlur = 15;
      ctx2.fill();
      ctx2.shadowBlur = 0;
    }
  };
  var TracerRound = class {
    constructor(startX, startY, angle, speed) {
      this.trail = [];
      this.type = "tracer";
      this.x = startX;
      this.y = startY;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = 2;
      this.life = 80;
      this.color = "rgba(255, 100, 0, 1)";
    }
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 8) this.trail.shift();
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
    }
    draw(ctx2) {
      if (this.trail.length > 0) {
        ctx2.beginPath();
        ctx2.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) ctx2.lineTo(this.trail[i].x, this.trail[i].y);
        ctx2.strokeStyle = "rgba(255, 165, 0, 0.6)";
        ctx2.lineWidth = this.radius * 2;
        ctx2.stroke();
      }
      ctx2.beginPath();
      ctx2.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx2.fillStyle = this.color;
      ctx2.shadowColor = "red";
      ctx2.shadowBlur = 10;
      ctx2.fill();
      ctx2.shadowBlur = 0;
    }
  };
  var HomingMine = class {
    constructor(x, y) {
      this.type = "homing_mine";
      this.x = x;
      this.y = y;
      this.vy = 0;
      this.radius = 8;
      this.armingTime = 120;
      this.isArmed = false;
      this.isLaunching = false;
      this.target = null;
      this.range = 250;
    }
    update(rockets) {
      if (!this.isArmed) {
        this.armingTime--;
        if (this.armingTime <= 0) {
          this.isArmed = true;
        }
        return false;
      }
      if (this.isArmed && !this.isLaunching) {
        for (const rocket of rockets) {
          if (Math.hypot(this.x - rocket.x, this.y - rocket.y) < this.range) {
            this.isLaunching = true;
            this.vy = -12;
            return true;
          }
        }
      }
      if (this.isLaunching) {
        this.y += this.vy;
        return this.y < this.y - this.range;
      }
      return false;
    }
    draw(ctx2) {
      ctx2.save();
      if (this.isLaunching) {
        ctx2.beginPath();
        ctx2.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx2.fillStyle = "#ff9800";
        ctx2.fill();
        ctx2.shadowColor = "#ff9800";
        ctx2.shadowBlur = 15;
        ctx2.fill();
      } else {
        ctx2.fillStyle = "#424242";
        ctx2.fillRect(this.x - 10, this.y - 5, 20, 5);
        ctx2.beginPath();
        ctx2.arc(this.x, this.y - 5, this.radius, Math.PI, 0);
        ctx2.fillStyle = "#616161";
        ctx2.fill();
        if (this.isArmed && Math.floor(Date.now() / 200) % 2 === 0) {
          ctx2.beginPath();
          ctx2.arc(this.x, this.y - 8, 3, 0, Math.PI * 2);
          ctx2.fillStyle = "#e53935";
          ctx2.fill();
          ctx2.shadowColor = "#e53935";
          ctx2.shadowBlur = 10;
          ctx2.fill();
        }
      }
      ctx2.restore();
    }
  };
  var EMP = class {
    constructor(x, y, width2, height2) {
      this.type = "emp";
      this.x = x ?? random(width2 * 0.2, width2 * 0.8);
      this.y = y ?? random(height2 * 0.2, height2 * 0.6);
      this.radius = 20;
      this.life = 600;
      this.time = 0;
    }
    update() {
      this.life--;
      this.time++;
    }
    draw(ctx2) {
      ctx2.save();
      ctx2.beginPath();
      ctx2.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx2.fillStyle = "rgba(0, 150, 255, 0.7)";
      ctx2.fill();
      ctx2.strokeStyle = "white";
      ctx2.lineWidth = 3;
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.arc(this.x, this.y, this.radius + Math.sin(this.time * 0.1) * 5, 0, Math.PI * 2);
      ctx2.strokeStyle = "rgba(0, 150, 255, 0.8)";
      ctx2.stroke();
      ctx2.restore();
    }
  };

  // ts/entities/structures.ts
  var City = class {
    constructor(x, y, w, h, isArmored = false, sprite) {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
      this.isDestroyed = false;
      this.isArmored = isArmored;
      this.sprite = sprite;
      this.rubbleShape = null;
      this.isSmoking = false;
    }
    draw(ctx2, height2) {
      ctx2.save();
      if (this.isDestroyed) {
        this.drawRubble(ctx2, height2);
      } else {
        if (this.sprite && this.sprite.complete) {
          ctx2.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        }
        if (this.isArmored) {
          this.drawEnergyShield(ctx2);
        }
      }
      ctx2.restore();
    }
    drawEnergyShield(ctx2) {
      ctx2.save();
      const shieldPadding = 8;
      const shieldX = this.x - shieldPadding;
      const shieldY = this.y - shieldPadding;
      const shieldW = this.width + shieldPadding * 2;
      const shieldH = this.height + shieldPadding;
      const layers = 3;
      for (let i = 0; i < layers; i++) {
        ctx2.beginPath();
        ctx2.rect(shieldX - i, shieldY - i, shieldW + i * 2, shieldH + i * 2);
        ctx2.lineWidth = 1 + i;
        ctx2.strokeStyle = `rgba(0, 221, 255, ${0.4 - i * 0.1})`;
        ctx2.shadowColor = "cyan";
        ctx2.shadowBlur = 10 + i * 2;
        ctx2.stroke();
      }
      ctx2.restore();
    }
    drawRubble(ctx2, height2) {
      if (!this.rubbleShape) return;
      this.rubbleShape.forEach((shape) => {
        ctx2.fillStyle = shape.color;
        const x = this.x + shape.xOffset;
        const y = height2 - shape.h - shape.yOffset;
        ctx2.beginPath();
        ctx2.moveTo(x + shape.points[0].x * shape.w, y + shape.points[0].y * shape.h);
        for (let i = 1; i < shape.points.length; i++) {
          ctx2.lineTo(x + shape.points[i].x * shape.w, y + shape.points[i].y * shape.h);
        }
        ctx2.closePath();
        ctx2.fill();
      });
    }
    destroy() {
      this.isDestroyed = true;
      this.isSmoking = true;
      this.rubbleShape = [];
      const rubbleColors = ["#495057", "#343a40", "#6c757d", "#5a5a5a"];
      for (let i = 0; i < 8; i++) {
        this.rubbleShape.push({
          w: random(this.width * 0.2, this.width * 0.6),
          h: random(this.height * 0.1, this.height * 0.5),
          xOffset: random(0, this.width * 0.4),
          yOffset: random(-this.height * 0.1, this.height * 0.2),
          color: rubbleColors[i % rubbleColors.length],
          points: [
            { x: 0, y: 1 },
            { x: random(0.1, 0.3), y: random(0.1, 0.3) },
            { x: random(0.7, 0.9), y: random(0.1, 0.3) },
            { x: 1, y: 1 }
          ]
        });
      }
    }
    repair() {
      this.isDestroyed = false;
      this.isSmoking = false;
      this.rubbleShape = null;
    }
  };
  var AutomatedTurret = class {
    constructor(x, y, range, fireRate) {
      this.tracerSpeed = 25;
      this.x = x;
      this.y = y;
      this.range = range;
      this.fireRate = fireRate;
      this.fireCooldown = 0;
      this.angle = -Math.PI / 2;
      this.radarAngle = 0;
      this.currentTarget = null;
      this.isFiring = false;
      this.shotTimer = 0;
      this.delayBetweenShots = 2;
    }
    update(rockets) {
      if (this.fireCooldown > 0) this.fireCooldown--;
      this.updateTarget(rockets);
      if (this.currentTarget) {
        return this.aimAndFire(this.currentTarget);
      } else {
        this.radarAngle += 0.02;
        this.isFiring = false;
      }
      return [];
    }
    updateTarget(rockets) {
      if (this.currentTarget) {
        const targetExists = rockets.some((r) => r.id === this.currentTarget.id);
        const targetInRange = targetExists && Math.hypot(this.x - this.currentTarget.x, this.y - this.currentTarget.y) < this.range;
        if (!targetExists || !targetInRange) {
          this.currentTarget = null;
        }
      }
      if (!this.currentTarget && this.fireCooldown <= 0) {
        this.currentTarget = this.findTarget(rockets);
        if (this.currentTarget) {
          this.fireCooldown = this.fireRate;
        }
      }
    }
    aimAndFire(target) {
      const dist = Math.hypot(this.x - target.x, this.y - target.y);
      const timeToImpact = dist / this.tracerSpeed;
      const predictedX = target.x + target.vx * timeToImpact;
      const predictedY = target.y + target.vy * timeToImpact;
      this.angle = Math.atan2(predictedY - this.y, predictedX - this.x);
      this.isFiring = true;
      this.shotTimer++;
      if (this.shotTimer % this.delayBetweenShots === 0) {
        const fireAngle = this.angle + random(-0.5, 0.5) * 0.02;
        return [new TracerRound(this.x, this.y, fireAngle, this.tracerSpeed)];
      }
      return [];
    }
    findTarget(rockets) {
      const inRange = rockets.filter((r) => Math.hypot(this.x - r.x, this.y - r.y) < this.range && r.y < this.y);
      if (inRange.length === 0) return null;
      const highPriority = inRange.filter(
        (r) => r.type === "swarmer" || r.type === "stealth" || r.type === "mirv" || r.type === "flare_rocket" || r.type === "armored"
      );
      if (highPriority.length > 0) {
        return highPriority.sort((a, b) => a.y - b.y)[0];
      }
      return inRange.reduce((closest, current) => {
        const closestDist = Math.hypot(this.x - closest.x, this.y - closest.y);
        const currentDist = Math.hypot(this.x - current.x, this.y - current.y);
        return currentDist < closestDist ? current : closest;
      });
    }
    draw(ctx2) {
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.fillStyle = "#6c757d";
      ctx2.beginPath();
      ctx2.moveTo(-15, 10);
      ctx2.lineTo(15, 10);
      ctx2.lineTo(10, 0);
      ctx2.lineTo(-10, 0);
      ctx2.closePath();
      ctx2.fill();
      if (!this.isFiring) {
        ctx2.save();
        ctx2.rotate(this.radarAngle);
        ctx2.fillStyle = "#adb5bd";
        ctx2.fillRect(0, -1.5, 15, 3);
        ctx2.restore();
      }
      ctx2.rotate(this.angle);
      if (this.isFiring) {
        this.drawMuzzleFlash(ctx2);
      }
      ctx2.fillStyle = "#495057";
      ctx2.fillRect(0, -4, 25, 8);
      ctx2.fillStyle = "#00ddff";
      ctx2.beginPath();
      ctx2.arc(0, 0, 8, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
    }
    drawMuzzleFlash(ctx2) {
      ctx2.fillStyle = `rgba(255, ${random(180, 220)}, 0, ${random(0.5, 1)})`;
      ctx2.beginPath();
      const flashLength = random(20, 40);
      const flashWidth = random(8, 12);
      ctx2.moveTo(20, 0);
      ctx2.lineTo(20 + flashLength, -flashWidth / 2);
      ctx2.lineTo(20 + flashLength, flashWidth / 2);
      ctx2.closePath();
      ctx2.fill();
    }
  };

  // ts/perks.ts
  var perks = {
    veteranCommander: {
      name: "Veteran Commander",
      description: "Begin each run with 500 extra score.",
      cost: 150
    },
    advancedFortifications: {
      name: "Advanced Fortifications",
      description: "Start each game with Base Armor already applied to all cities.",
      cost: 400
    },
    rapidDeployment: {
      name: "Rapid Deployment",
      description: "The first upgrade purchased in the shop each wave is 25% cheaper.",
      cost: 300
    },
    efficientInterceptors: {
      name: "Efficient Interceptors",
      description: 'All interceptors have a 10% chance to be a "Critical Hit", dealing triple damage.',
      cost: 500
    },
    surplusValue: {
      name: "Surplus Value",
      description: "The Nuke Interceptor can be purchased every wave (instead of one per game).",
      cost: 800
    },
    extraMine: {
      name: "Reserve Mine",
      description: "Start every game with one free Homing Mine available.",
      cost: 200
    }
  };

  // ts/saveManager.ts
  var SAVE_KEY = "ironDomePlayerData_TS";
  function getInitialPlayerData() {
    const unlockedPerks = {};
    Object.keys(perks).forEach((key) => {
      unlockedPerks[key] = false;
    });
    return {
      prestigePoints: 0,
      unlockedPerks,
      highScores: {
        easy: 0,
        normal: 0,
        hard: 0
      }
    };
  }
  function loadPlayerData() {
    const initialData = getInitialPlayerData();
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return {
          ...initialData,
          ...parsedData,
          highScores: {
            ...initialData.highScores,
            ...parsedData.highScores || {}
          },
          unlockedPerks: {
            ...initialData.unlockedPerks,
            ...parsedData.unlockedPerks || {}
          }
        };
      }
    } catch (error) {
      console.error("Failed to load player data:", error);
      localStorage.removeItem(SAVE_KEY);
    }
    return initialData;
  }
  function savePlayerData(playerData) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(playerData));
    } catch (error) {
      console.error("Failed to save player data:", error);
    }
  }

  // ts/ui/domElements.ts
  var fpsCounterEl = document.getElementById("fps-counter");
  var scoreEl = document.getElementById("score");
  var coinsEl = document.getElementById("coins");
  var waveEl = document.getElementById("wave");
  var modalContainer = document.getElementById("modal-container");
  var modalContent = document.getElementById("modal-content-main");
  var pauseButton = document.getElementById("pause-button");
  var pauseIcon = document.getElementById("pause-icon");
  var bossUiContainer = document.getElementById("boss-ui-container");
  var bossNameEl = document.getElementById("boss-name");
  var bossHealthBarEl = document.getElementById("boss-health-bar");

  // ts/ui/shopScreen.ts
  function showBetweenWaveScreen(state2, callbacks, gameConfig) {
    const {
      score,
      coins,
      currentWave,
      cities,
      turrets,
      basesAreArmored,
      turretFireRateLevel,
      turretRangeLevel,
      activePerks,
      multishotLevel,
      blastRadiusLevel
    } = state2;
    const {
      upgradeRepairCallback,
      nextWaveCallback,
      upgradeTurretCallback,
      upgradeSpeedCallback,
      upgradeMultishotCallback,
      upgradeBaseArmorCallback,
      upgradeNukeCallback,
      upgradeTurretSpeedCallback,
      upgradeTurretRangeCallback,
      upgradeHomingMineCallback,
      upgradeFieldReinforcementCallback,
      upgradeTargetingScramblerCallback,
      upgradeBlastRadiusCallback
    } = callbacks;
    const { upgradeCosts, maxTurrets } = gameConfig;
    const nukeIsPurchasable = !state2.nukeAvailable || activePerks.surplusValue;
    const reinforcementNeeded = state2.cities.some((c) => !c.isDestroyed && !c.isArmored);
    const categories = {
      core: {
        title: "Core System Upgrades",
        ids: ["speed", "multishot", "blastRadius", "turret", "turretSpeed", "turretRange", "baseArmor"]
      },
      tactical: {
        title: "Single-Wave Tactical Gear",
        ids: ["nuke", "homingMine", "fieldReinforcement", "targetingScrambler"]
      },
      maintenance: {
        title: "Base Maintenance",
        ids: ["repair"]
      }
    };
    const shopItems = [
      {
        id: "speed",
        title: "Interceptor Speed",
        desc: "Permanently increase the speed of your interceptors.",
        detailedDesc: "A permanent, stacking buff to the velocity of all interceptors you launch.",
        cost: upgradeCosts.interceptorSpeed,
        available: true,
        maxed: false
      },
      {
        id: "multishot",
        title: `Multishot (Lvl ${multishotLevel})`,
        desc: "Fire an additional interceptor per shot. Max Lvl 3.",
        detailedDesc: "Increases the number of interceptors launched with each click. Each interceptor will target the same rocket.",
        cost: upgradeCosts.multishot * (multishotLevel + 1),
        available: multishotLevel < 3,
        maxed: multishotLevel >= 3
      },
      {
        id: "blastRadius",
        title: `Flak Warheads (Lvl ${blastRadiusLevel})`,
        desc: "Increase the blast radius of standard interceptors. Max Lvl 5.",
        detailedDesc: "Increases the explosion radius of your interceptors, making them more effective against dense groups of rockets.",
        cost: upgradeCosts.flakWarheads * (blastRadiusLevel + 1),
        available: blastRadiusLevel < 5,
        maxed: blastRadiusLevel >= 5
      },
      {
        id: "turret",
        title: "Build Turret",
        desc: "Construct an automated defense turret. Max 2.",
        detailedDesc: "Builds a C-RAM turret that automatically fires at nearby rockets. Limited to two turrets.",
        cost: upgradeCosts.automatedTurret,
        available: turrets.length < maxTurrets,
        maxed: turrets.length >= maxTurrets
      },
      {
        id: "turretSpeed",
        title: `Turret Speed (Lvl ${turretFireRateLevel})`,
        desc: "Permanently increase the fire rate of all turrets. Max Lvl 3.",
        detailedDesc: "Reduces the cooldown between bursts for all owned turrets. Stacks up to 3 times.",
        cost: upgradeCosts.turretSpeed,
        available: turrets.length > 0 && turretFireRateLevel < 3,
        maxed: turretFireRateLevel >= 3
      },
      {
        id: "turretRange",
        title: `Turret Range (Lvl ${turretRangeLevel})`,
        desc: "Permanently increase the engagement range of all turrets. Max Lvl 3.",
        detailedDesc: "Increases the detection and firing radius for all owned turrets. Stacks up to 3 times.",
        cost: upgradeCosts.turretRange,
        available: turrets.length > 0 && turretRangeLevel < 3,
        maxed: turretRangeLevel >= 3
      },
      {
        id: "baseArmor",
        title: "Permanent Armor",
        desc: "Permanently armor all bases, allowing them to survive one extra hit.",
        detailedDesc: "All cities will start with one layer of armor for the rest of the game. Armor is consumed upon being hit.",
        cost: upgradeCosts.baseArmor,
        available: !basesAreArmored,
        maxed: basesAreArmored
      },
      {
        id: "nuke",
        title: "Nuke (w/ EMP)",
        desc: "A single-use interceptor with a massive blast and EMP effect.",
        detailedDesc: "Your next interceptor is a Nuke. Its massive blast destroys most rockets instantly and also triggers a 2-second global EMP, disabling all rockets on screen.",
        cost: upgradeCosts.nuke,
        available: nukeIsPurchasable,
        maxed: !nukeIsPurchasable && !activePerks.surplusValue
      },
      {
        id: "homingMine",
        title: "Buy Proximity Mine",
        desc: "An AOE mine that explodes when rockets get near.",
        detailedDesc: "Deploys a mine on the ground at your cursor. When an enemy gets close, it detonates, destroying all rockets within a large radius.",
        cost: upgradeCosts.homingMine,
        available: true,
        maxed: false
      },
      {
        id: "fieldReinforcement",
        title: "Field Reinforcement",
        desc: "Apply one layer of armor to all standing, unarmored bases.",
        detailedDesc: "A temporary, one-time boost. Instantly adds one layer of armor to any of your cities that are not already armored or destroyed. The armor is consumed on the next hit.",
        cost: upgradeCosts.fieldReinforcement,
        available: reinforcementNeeded,
        maxed: !reinforcementNeeded
      },
      {
        id: "targetingScrambler",
        title: "Targeting Scrambler",
        desc: "25% chance for new rockets to be scrambled next wave.",
        detailedDesc: "Activates a passive system for the next wave only. Each new rocket has a 25% chance to have its trajectory scrambled, causing it to fly off-target.",
        cost: upgradeCosts.targetingScrambler,
        available: !state2.scramblerActive,
        maxed: state2.scramblerActive
      },
      {
        id: "repair",
        title: "Repair Base",
        desc: "Repair one of your destroyed bases.",
        detailedDesc: "Rebuilds a single destroyed city, restoring it to full functionality.",
        cost: upgradeCosts.repairCity,
        available: cities.some((c) => c.isDestroyed),
        maxed: false
      }
    ];
    let shopHTML = '<div class="shop-container">';
    for (const categoryKey in categories) {
      const category = categories[categoryKey];
      const itemsInCategory = shopItems.filter((item) => category.ids.includes(item.id));
      const isCategoryRelevant = itemsInCategory.some(
        (item) => item.available || item.maxed === false && item.id !== "repair"
      );
      if (isCategoryRelevant || categoryKey === "maintenance" && itemsInCategory.some((item) => item.available)) {
        shopHTML += `
                <div class="shop-category">
                    <h2>${category.title}</h2>
                    <div class="shop-grid">
            `;
        itemsInCategory.forEach((item) => {
          let currentCost = item.cost;
          if (activePerks.rapidDeployment && !state2.firstUpgradePurchased) {
            currentCost = Math.ceil(currentCost * 0.75);
          }
          const affordable = coins >= currentCost;
          const disabled = !affordable || !item.available;
          let statusText = `<div class="cost">Cost: ${currentCost} <span class="coin-icon"></span></div>`;
          if (item.maxed) {
            statusText = `<div class="cost maxed-out">MAXED</div>`;
          } else if (item.id === "targetingScrambler" && state2.scramblerActive) {
            statusText = `<div class="cost active-status">ACTIVE</div>`;
          } else if (item.id === "nuke" && state2.nukeAvailable && !activePerks.surplusValue) {
            statusText = `<div class="cost active-status">LOADED</div>`;
          }
          shopHTML += `
                    <div class="shop-card ${disabled ? "disabled" : ""} ${item.maxed ? "maxed" : ""}" id="shop-${item.id}">
                        <div class="info-icon">?</div>
                        <div class="info-tooltip">${item.detailedDesc || item.desc}</div>
                        <h3>${item.title}</h3>
                        <p>${item.desc}</p>
                        ${statusText}
                    </div>
                `;
        });
        shopHTML += `</div></div>`;
      }
    }
    shopHTML += "</div>";
    modalContainer.style.display = "flex";
    modalContent.innerHTML = `
        <div class="modal-header">
            <h1>WAVE ${currentWave + 1} COMPLETE</h1>
            <div class="end-wave-stats">
                <div>SCORE: <span>${score.toLocaleString()}</span></div>
                <div>COINS: <span>${coins.toLocaleString()}</span></div>
            </div>
        </div>
        <div class="modal-body">
            ${shopHTML}
        </div>
        <div class="modal-footer">
            <button id="next-wave-button" class="modal-button next-wave-btn">START WAVE ${currentWave + 2}</button>
        </div>
    `;
    function addListenerIfPresent(id, callback) {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", callback);
      }
    }
    addListenerIfPresent("shop-speed", upgradeSpeedCallback);
    addListenerIfPresent("shop-multishot", upgradeMultishotCallback);
    addListenerIfPresent("shop-blastRadius", upgradeBlastRadiusCallback);
    addListenerIfPresent("shop-turret", upgradeTurretCallback);
    addListenerIfPresent("shop-turretSpeed", upgradeTurretSpeedCallback);
    addListenerIfPresent("shop-turretRange", upgradeTurretRangeCallback);
    addListenerIfPresent("shop-baseArmor", upgradeBaseArmorCallback);
    addListenerIfPresent("shop-nuke", upgradeNukeCallback);
    addListenerIfPresent("shop-homingMine", upgradeHomingMineCallback);
    addListenerIfPresent("shop-fieldReinforcement", upgradeFieldReinforcementCallback);
    addListenerIfPresent("shop-targetingScrambler", upgradeTargetingScramblerCallback);
    addListenerIfPresent("shop-repair", upgradeRepairCallback);
    addListenerIfPresent("next-wave-button", nextWaveCallback);
  }

  // ts/ui/armoryScreen.ts
  var perkIcons = {
    veteranCommander: "\u{1F3C6}",
    advancedFortifications: "\u{1F9F1}",
    rapidDeployment: "\u26A1",
    efficientInterceptors: "\u{1F4A5}",
    surplusValue: "\u2622\uFE0F",
    extraMine: "\u{1F4A3}"
  };
  function showArmoryScreen(playerData, startGameCallback) {
    modalContainer.style.display = "flex";
    modalContent.classList.add("armory");
    let perkHTML = '<div class="perk-grid">';
    for (const key in perks) {
      const perk = perks[key];
      const isUnlocked = playerData.unlockedPerks[key];
      const canAfford = playerData.prestigePoints >= perk.cost;
      perkHTML += `
            <div class="perk-card ${isUnlocked ? "unlocked" : ""} ${!canAfford && !isUnlocked ? "unaffordable" : ""}">
                <div class="perk-header">
                    <div class="perk-icon">${perkIcons[key] || "\u2699\uFE0F"}</div>
                    <h3>${perk.name}</h3>
                </div>
                <p class="perk-description">${perk.description}</p>
                <button
                    class="perk-button"
                    id="perk-${key}"
                    ${isUnlocked || !canAfford ? "disabled" : ""}
                >
                    ${isUnlocked ? "UNLOCKED" : `COST: ${perk.cost}`}
                </button>
            </div>
        `;
    }
    perkHTML += "</div>";
    modalContent.innerHTML = `
        <div class="armory-header">
            <h1>ARMORY</h1>
            <div class="prestige-points">
                Prestige Points: <span>${playerData.prestigePoints}</span>
            </div>
        </div>
        ${perkHTML}
        <button id="back-to-menu-button" class="modal-button">Main Menu</button>
    `;
    for (const key in perks) {
      if (!playerData.unlockedPerks[key]) {
        const perkButton = document.getElementById(`perk-${key}`);
        if (perkButton) {
          perkButton.addEventListener("click", () => {
            const perk = perks[key];
            if (playerData.prestigePoints >= perk.cost) {
              playerData.prestigePoints -= perk.cost;
              playerData.unlockedPerks[key] = true;
              savePlayerData(playerData);
              showArmoryScreen(playerData, startGameCallback);
            }
          });
        }
      }
    }
    const showArmoryAgain = () => showArmoryScreen(playerData, startGameCallback);
    document.getElementById("back-to-menu-button")?.addEventListener("click", () => showStartScreen(startGameCallback, showArmoryAgain));
  }

  // ts/ui.ts
  function updateTopUI(state2) {
    fpsCounterEl.textContent = state2.fps.toString();
    scoreEl.textContent = state2.score.toLocaleString();
    coinsEl.textContent = state2.coins.toLocaleString();
    waveEl.textContent = (state2.currentWave + 1).toString();
    const isPausable = state2.gameState === "IN_WAVE" || state2.gameState === "PAUSED";
    pauseButton.style.display = isPausable ? "flex" : "none";
    if (isPausable) {
      pauseIcon.innerHTML = state2.gameState === "PAUSED" ? "\u25B6" : "||";
    }
  }
  function updateBossUI(boss) {
    if (boss) {
      bossUiContainer.style.display = "block";
      bossNameEl.textContent = boss.name;
      const healthPercentage = boss.health / boss.maxHealth * 100;
      bossHealthBarEl.style.width = `${Math.max(0, healthPercentage)}%`;
    } else {
      bossUiContainer.style.display = "none";
    }
  }
  function hideModal() {
    modalContainer.style.display = "none";
  }
  function showModalWithContent(innerHTML, className = "") {
    modalContainer.style.display = "flex";
    modalContent.className = "modal-content";
    if (className) {
      modalContent.classList.add(className);
    }
    modalContent.innerHTML = innerHTML;
  }
  function showStartScreen(startGameCallback, showArmoryCallback) {
    const playerData = loadPlayerData();
    let difficultyCardsHTML = '<div class="difficulty-card-grid">';
    for (const key in difficultySettings) {
      const diff = difficultySettings[key];
      const highScore = playerData.highScores[key] || 0;
      difficultyCardsHTML += `
            <div class="difficulty-card" id="start-${key}" data-difficulty="${key}">
                <h3>${diff.name}</h3>
                <p>${diff.description}</p>
                <div class="card-footer">
                    <div class="difficulty-summary">
                        <span>Starts with ${diff.startingCoins} Coins</span>
                    </div>
                    <div class="high-score-display">
                        <span class="high-score-label">HIGH SCORE</span>
                        <span class="high-score-value">${highScore.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }
    difficultyCardsHTML += "</div>";
    const fullHTML = `
        <div class="start-screen-header">
            <h1>IRON DOME</h1>
            <button id="armory-button" class="armory-button">
                <span class="armory-icon">\u{1F6E1}\uFE0F</span> Armory
            </button>
        </div>
        <p class="start-screen-subtitle">Select your engagement difficulty, Commander.</p>
        ${difficultyCardsHTML}
    `;
    showModalWithContent(fullHTML);
    document.querySelectorAll(".difficulty-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const difficulty = e.currentTarget.dataset.difficulty;
        startGameCallback(difficulty);
      });
    });
    document.getElementById("armory-button")?.addEventListener("click", showArmoryCallback);
  }
  function showRocketInfoScreen(closeCallback) {
    let rocketHTML = '<div class="rocket-info-grid">';
    for (const key in rocketInfo) {
      const rocket = rocketInfo[key];
      rocketHTML += `
            <div class="rocket-info-card">
                <h3>
                    <span>${rocket.name}</span>
                    <span class="threat-level threat-${rocket.threat.toLowerCase()}">${rocket.threat} Threat</span>
                </h3>
                <p>${rocket.description}</p>
            </div>
        `;
    }
    rocketHTML += "</div>";
    const fullHTML = `
        <h1>ROCKET BESTIARY</h1>
        ${rocketHTML}
        <button id="close-info-button" class="modal-button">CLOSE</button>
    `;
    showModalWithContent(fullHTML);
    const closeButton = document.getElementById("close-info-button");
    const backgroundClickHandler = (e) => {
      if (e.target === modalContainer) {
        closeButton?.removeEventListener("click", closeCallback);
        modalContainer.removeEventListener("click", backgroundClickHandler);
        closeCallback();
      }
    };
    closeButton?.addEventListener("click", closeCallback);
    modalContainer.addEventListener("click", backgroundClickHandler);
  }
  function showGameOverScreen(state2, restartCallback, pointsEarned, newHighScore) {
    const { score, currentWave } = state2;
    const newHighScoreHTML = newHighScore ? `<p class="new-high-score-banner">\u{1F3C6} NEW HIGH SCORE! \u{1F3C6}</p>` : "";
    const fullHTML = `
        <h1>MISSION FAILED</h1>
        ${newHighScoreHTML}
        <p class="game-over-stats">FINAL SCORE: ${score.toLocaleString()}</p>
        <p class="game-over-stats">WAVES SURVIVED: ${currentWave + 1}</p>
        <p class="prestige-points">PRESTIGE EARNED: ${pointsEarned.toLocaleString()}</p>
        <button id="restart-button" class="modal-button">TRY AGAIN</button>
    `;
    showModalWithContent(fullHTML, "game-over");
    document.getElementById("restart-button")?.addEventListener("click", restartCallback);
  }
  function showPauseScreen(resumeCallback, restartCallback) {
    const fullHTML = `
        <h1>PAUSED</h1>
        <div class="upgrade-options">
            <button id="resume-button" class="modal-button">RESUME</button>
            <button id="restart-button-pause" class="modal-button">RESTART</button>
        </div>
    `;
    showModalWithContent(fullHTML);
    document.getElementById("resume-button")?.addEventListener("click", resumeCallback);
    document.getElementById("restart-button-pause")?.addEventListener("click", restartCallback);
  }

  // ts/state.ts
  function createInitialState(playerData) {
    const perks2 = playerData.unlockedPerks;
    return {
      gameState: "START_SCREEN",
      difficulty: "normal",
      score: perks2.veteranCommander ? 500 : 0,
      coins: 0,
      currentWave: 0,
      rockets: [],
      interceptors: [],
      particles: [],
      cities: [],
      turrets: [],
      tracerRounds: [],
      homingMines: [],
      empPowerUps: [],
      flares: [],
      artilleryShells: [],
      boss: null,
      flashes: [],
      shockwaves: [],
      bossDefeated: false,
      timeSinceLastRocket: 0,
      waveStartTime: 0,
      empActiveTimer: 0,
      empShockwave: { radius: 0, alpha: 0 },
      screenShake: { intensity: 0, duration: 0 },
      waveRocketSpawn: { count: 0, timer: 0, toSpawn: [] },
      newHighScore: false,
      gameTime: 0,
      fps: 0,
      frameCount: 0,
      lastFpsUpdate: 0,
      mouse: { x: 0, y: 0 },
      targetedRocket: null,
      interceptorSpeed: config.initialInterceptorSpeed,
      interceptorBlastRadius: config.initialBlastRadius,
      blastRadiusLevel: 0,
      multishotLevel: 0,
      nukeAvailable: false,
      basesAreArmored: !!perks2.advancedFortifications,
      turretFireRateLevel: 0,
      turretRangeLevel: 0,
      homingMinesAvailable: perks2.extraMine ? 1 : 0,
      firstUpgradePurchased: false,
      scramblerActive: false,
      playerData,
      activePerks: perks2
    };
  }

  // ts/waveManager.ts
  function getWaveDefinition(waveNumber) {
    if (waveNumber < config.waveDefinitions.length) {
      return config.waveDefinitions[waveNumber];
    }
    const waveFactor = waveNumber - config.waveDefinitions.length + 1;
    const totalRockets = 15 + waveFactor * 2;
    const waveData = { isBossWave: false, composition: [] };
    if (waveFactor > 0 && waveFactor % 5 === 0) {
      waveData.isBossWave = true;
      waveData.bossType = "hiveCarrier";
      return waveData;
    }
    const availableTypes = ["standard", "standard", "standard", "mirv"];
    if (waveNumber > 8) availableTypes.push("stealth");
    if (waveNumber > 10) availableTypes.push("swarmer");
    if (waveNumber > 12) availableTypes.push("armored");
    if (waveNumber > 14) availableTypes.push("flare_rocket");
    if (waveNumber > 6) availableTypes.push("designator");
    for (let i = 0; i < totalRockets; i++) {
      const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      waveData.composition.push(randomType);
    }
    return waveData;
  }

  // ts/entities/rockets/base.ts
  var Rocket = class {
    constructor(startX, startY, targetVx, targetVy, width2, sizeMultiplier = 1, speedMultiplier = 1) {
      this.type = "standard";
      this.trail = [];
      this.life = 0;
      this.angle = 0;
      this.color = "red";
      this.trailColor = "rgba(255, 100, 100, 0.6)";
      this.id = random(0, 1e6);
      this.x = startX ?? random(width2 * 0.1, width2 * 0.9);
      this.y = startY ?? 0;
      this.vx = (targetVx ?? random(-1, 1)) * speedMultiplier;
      this.vy = (targetVy ?? random(1.5, 2.5)) * speedMultiplier;
      this.radius = 5 * sizeMultiplier;
    }
    update(...args) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 20) this.trail.shift();
      this.x += this.vx;
      this.y += this.vy;
      this.angle = Math.atan2(this.vy, this.vx) - Math.PI / 2;
      this.life++;
    }
    draw(ctx2) {
      this.drawTrail(ctx2);
      this.drawHead(ctx2);
    }
    drawTrail(ctx2) {
      if (!this.trail[0]) return;
      ctx2.beginPath();
      ctx2.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        const point = this.trail[i];
        const nextPoint = this.trail[i + 1] || point;
        const xc = (point.x + nextPoint.x) / 2;
        const yc = (point.y + nextPoint.y) / 2;
        ctx2.quadraticCurveTo(point.x, point.y, xc, yc);
      }
      ctx2.strokeStyle = this.trailColor;
      ctx2.lineWidth = 3 * (this.radius / 5);
      ctx2.stroke();
    }
    drawHead(ctx2) {
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.rotate(this.angle);
      const w = this.radius;
      const h = this.radius * 3;
      ctx2.fillStyle = "rgba(255, 200, 150, 0.7)";
      ctx2.shadowColor = "orange";
      ctx2.shadowBlur = 10;
      ctx2.beginPath();
      ctx2.arc(0, h * 0.5, w * 0.8, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.shadowBlur = 0;
      ctx2.fillStyle = "#6c757d";
      ctx2.beginPath();
      ctx2.moveTo(-w, h * 0.2);
      ctx2.lineTo(-w * 1.8, h * 0.5);
      ctx2.lineTo(-w, h * 0.5);
      ctx2.moveTo(w, h * 0.2);
      ctx2.lineTo(w * 1.8, h * 0.5);
      ctx2.lineTo(w, h * 0.5);
      ctx2.fill();
      const gradient = ctx2.createLinearGradient(-w / 2, 0, w / 2, 0);
      gradient.addColorStop(0, "#8d99ae");
      gradient.addColorStop(0.5, "#dee2e6");
      gradient.addColorStop(1, "#8d99ae");
      ctx2.fillStyle = gradient;
      ctx2.fillRect(-w / 2, -h / 2, w, h);
      ctx2.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.moveTo(0, -h / 2);
      ctx2.lineTo(0, h / 2);
      ctx2.stroke();
      ctx2.fillStyle = this.color;
      ctx2.beginPath();
      ctx2.moveTo(0, -h * 0.6);
      ctx2.lineTo(-w / 2, -h / 2);
      ctx2.lineTo(w / 2, -h / 2);
      ctx2.closePath();
      ctx2.fill();
      ctx2.restore();
    }
  };

  // ts/entities/rockets/armored.ts
  var ArmoredRocket = class extends Rocket {
    constructor(width2, sizeMultiplier = 1, speedMultiplier = 1) {
      super(
        void 0,
        void 0,
        random(-0.5, 0.5),
        random(1, 1.5),
        width2,
        sizeMultiplier * 1.5,
        speedMultiplier * 0.7
      );
      this.health = 3;
      this.maxHealth = 3;
      this.hitFlashTimer = 0;
      this.type = "armored";
      this.color = "#c0c0c0";
      this.trailColor = "rgba(192, 192, 192, 0.5)";
    }
    update() {
      super.update();
      if (this.hitFlashTimer > 0) {
        this.hitFlashTimer--;
      }
    }
    takeDamage(amount) {
      this.health -= amount;
      this.hitFlashTimer = 10;
      return this.health <= 0;
    }
    drawHealthBar(ctx2) {
      const barWidth = this.radius * 3;
      const barHeight = 5;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.radius * 3;
      ctx2.fillStyle = "#333";
      ctx2.fillRect(barX, barY, barWidth, barHeight);
      const healthPercentage = this.health / this.maxHealth;
      ctx2.fillStyle = healthPercentage > 0.6 ? "#43a047" : healthPercentage > 0.3 ? "#fdd835" : "#e53935";
      ctx2.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
      ctx2.strokeStyle = "#222";
      ctx2.lineWidth = 1;
      ctx2.strokeRect(barX, barY, barWidth, barHeight);
    }
    draw(ctx2) {
      this.drawTrail(ctx2);
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.rotate(this.angle);
      super.drawHead(ctx2);
      const w = this.radius;
      const h = this.radius * 3;
      ctx2.fillStyle = "#495057";
      ctx2.fillRect(-w * 0.7, -h * 0.3, w * 1.4, h * 0.6);
      ctx2.strokeStyle = "#212529";
      ctx2.lineWidth = 2;
      ctx2.strokeRect(-w * 0.7, -h * 0.3, w * 1.4, h * 0.6);
      if (this.hitFlashTimer > 0) {
        const alpha = this.hitFlashTimer / 10 * 0.8;
        ctx2.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx2.globalCompositeOperation = "lighter";
        ctx2.fillRect(-w / 2, -h / 2, w, h);
        ctx2.globalCompositeOperation = "source-over";
      }
      ctx2.restore();
      this.drawHealthBar(ctx2);
    }
  };

  // ts/entities/rockets/stealth.ts
  var StealthRocket = class extends Rocket {
    constructor(width2, sizeMultiplier = 1, speedMultiplier = 1) {
      super(void 0, void 0, void 0, void 0, width2, sizeMultiplier * 0.8, speedMultiplier * 1.2);
      this.isVisible = true;
      this.type = "stealth";
      this.color = "#ae00ff";
      this.trailColor = "rgba(174, 0, 255, 0.4)";
    }
    update() {
      super.update();
      if (this.life % 45 === 0) {
        this.isVisible = !this.isVisible;
      }
    }
    draw(ctx2) {
      if (this.isVisible) {
        this.drawTrail(ctx2);
        this.drawHead(ctx2);
      } else {
        ctx2.save();
        ctx2.translate(this.x, this.y);
        ctx2.rotate(this.angle);
        const w = this.radius;
        const h = this.radius * 3;
        ctx2.strokeStyle = "rgba(200, 200, 255, 0.2)";
        ctx2.lineWidth = 2;
        ctx2.strokeRect(-w / 2, -h / 2, w, h);
        ctx2.restore();
      }
    }
    drawHead(ctx2) {
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.rotate(this.angle);
      const w = this.radius * 1.2;
      const h = this.radius * 3;
      ctx2.fillStyle = "#212529";
      ctx2.beginPath();
      ctx2.moveTo(0, -h / 2);
      ctx2.lineTo(w, h / 4);
      ctx2.lineTo(w / 2, h / 2);
      ctx2.lineTo(-w / 2, h / 2);
      ctx2.lineTo(-w, h / 4);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = this.color;
      ctx2.shadowColor = this.color;
      ctx2.shadowBlur = 15;
      ctx2.beginPath();
      ctx2.moveTo(0, h * 0.1);
      ctx2.lineTo(w * 0.4, h * 0.2);
      ctx2.lineTo(-w * 0.4, h * 0.2);
      ctx2.closePath();
      ctx2.fill();
      ctx2.restore();
    }
  };

  // ts/entities/rockets/drone.ts
  var Drone = class extends Rocket {
    constructor(startX, startY, targetVx, targetVy, width2, speedMultiplier = 1) {
      super(startX, startY, targetVx, targetVy, width2, 0.6, speedMultiplier * 1.5);
      this.type = "drone";
      this.radius = 3;
      this.trailColor = "rgba(255, 255, 0, 0.5)";
      this.color = "yellow";
    }
    drawHead(ctx2) {
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.rotate(this.angle);
      const r = this.radius;
      ctx2.fillStyle = this.color;
      ctx2.shadowColor = this.color;
      ctx2.shadowBlur = 15;
      ctx2.beginPath();
      ctx2.moveTo(0, -r * 2);
      ctx2.lineTo(r, r);
      ctx2.lineTo(-r, r);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = "white";
      ctx2.shadowColor = "white";
      ctx2.shadowBlur = 10;
      ctx2.beginPath();
      ctx2.arc(0, r * 0.5, r / 2, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
    }
  };

  // ts/entities/rockets/swarmer.ts
  var SwarmerRocket = class extends Rocket {
    constructor(width2, height2, sizeMultiplier = 1, speedMultiplier = 1) {
      super(void 0, void 0, void 0, void 0, width2, sizeMultiplier * 1.5, speedMultiplier * 0.8);
      this.hasSplit = false;
      this.width = width2;
      this.type = "swarmer";
      this.radius *= 1.2;
      this.color = "#32cd32";
      this.trailColor = "rgba(50, 205, 50, 0.5)";
      this.splitHeight = random(height2 * 0.3, height2 * 0.6);
      this.speedMultiplier = speedMultiplier;
    }
    update() {
      super.update();
      if (this.y > this.splitHeight && !this.hasSplit) {
        this.hasSplit = true;
      }
    }
    split() {
      const childDrones = [];
      const childCount = 6;
      for (let i = 0; i < childCount; i++) {
        const angle = random(0, Math.PI * 2);
        const speed = random(1, 3);
        const newVx = Math.cos(angle) * speed;
        const newVy = Math.sin(angle) * speed;
        childDrones.push(new Drone(this.x, this.y, newVx, newVy, this.width, this.speedMultiplier));
      }
      return childDrones;
    }
    drawHead(ctx2) {
      super.drawHead(ctx2);
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.rotate(this.angle);
      const w = this.radius;
      const h = this.radius * 3;
      ctx2.fillStyle = "#1e6a21";
      ctx2.fillRect(-w * 0.9, -h * 0.2, w * 0.4, h * 0.4);
      ctx2.fillRect(w * 0.5, -h * 0.2, w * 0.4, h * 0.4);
      ctx2.strokeStyle = "rgba(0,0,0,0.3)";
      ctx2.strokeRect(-w * 0.9, -h * 0.2, w * 0.4, h * 0.4);
      ctx2.strokeRect(w * 0.5, -h * 0.2, w * 0.4, h * 0.4);
      ctx2.restore();
    }
  };

  // ts/entities/rockets/mirv.ts
  var MirvRocket = class extends Rocket {
    constructor(width2, height2, sizeMultiplier = 1, speedMultiplier = 1) {
      super(void 0, void 0, void 0, void 0, width2, sizeMultiplier, speedMultiplier);
      this.hasSplit = false;
      this.width = width2;
      this.type = "mirv";
      this.radius = 8 * sizeMultiplier;
      this.color = "magenta";
      this.trailColor = "rgba(255, 0, 255, 0.5)";
      this.splitHeight = random(height2 * 0.2, height2 * 0.5);
      this.speedMultiplier = speedMultiplier;
    }
    update() {
      super.update();
      if (this.y > this.splitHeight && !this.hasSplit) {
        this.hasSplit = true;
      }
    }
    split() {
      const childRockets = [];
      const childCount = 3;
      const childSizeMultiplier = this.radius / 8;
      for (let i = 0; i < childCount; i++) {
        const newVx = this.vx + random(-1.5, 1.5);
        const newVy = this.vy + random(-0.5, 0.5);
        childRockets.push(
          new Rocket(this.x, this.y, newVx, newVy, this.width, childSizeMultiplier, this.speedMultiplier)
        );
      }
      return childRockets;
    }
    drawHead(ctx2) {
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.rotate(this.angle);
      const w = this.radius;
      const h = this.radius * 2.5;
      ctx2.fillStyle = "rgba(255, 100, 255, 0.5)";
      ctx2.shadowColor = this.color;
      ctx2.shadowBlur = 15;
      ctx2.beginPath();
      ctx2.arc(0, h * 0.4, w, 0, Math.PI, false);
      ctx2.fill();
      ctx2.shadowBlur = 0;
      const bodyGrad = ctx2.createLinearGradient(0, -h / 2, 0, h / 2);
      bodyGrad.addColorStop(0, "#555");
      bodyGrad.addColorStop(1, "#333");
      ctx2.fillStyle = bodyGrad;
      ctx2.beginPath();
      ctx2.moveTo(0, -h / 2);
      ctx2.bezierCurveTo(w, -h / 4, w, h / 4, 0, h / 2);
      ctx2.bezierCurveTo(-w, h / 4, -w, -h / 4, 0, -h / 2);
      ctx2.fill();
      ctx2.strokeStyle = "rgba(0,0,0,0.5)";
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.moveTo(0, -h / 2);
      ctx2.lineTo(0, h / 2);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.ellipse(0, 0, w * 0.8, h * 0.2, 0, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.fillStyle = this.color;
      ctx2.shadowColor = this.color;
      ctx2.shadowBlur = 15;
      ctx2.beginPath();
      ctx2.arc(0, -h / 2, w / 1.5, Math.PI * 0.9, Math.PI * 0.1, true);
      ctx2.closePath();
      ctx2.fill();
      ctx2.restore();
    }
  };

  // ts/entities/rockets/flare.ts
  var FlareRocket = class extends Rocket {
    constructor(width2, sizeMultiplier = 1, speedMultiplier = 1) {
      super(void 0, void 0, void 0, void 0, width2, sizeMultiplier, speedMultiplier);
      this.flareCooldown = 0;
      this.flareDeployInterval = 90;
      this.type = "flare_rocket";
      this.color = "#00ced1";
      this.trailColor = "rgba(0, 206, 209, 0.5)";
    }
    update(flares) {
      super.update();
      this.flareCooldown--;
      if (this.flareCooldown <= 0 && flares) {
        flares.push(new Flare(this.x, this.y));
        this.flareCooldown = this.flareDeployInterval;
      }
    }
    drawHead(ctx2) {
      super.drawHead(ctx2);
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.rotate(this.angle);
      const w = this.radius;
      const h = this.radius * 3;
      ctx2.fillStyle = "#2c3e50";
      ctx2.fillRect(-w * 0.4, h * 0.1, w * 0.8, h * 0.3);
      ctx2.restore();
    }
  };

  // ts/entities/rockets/designator.ts
  var ArtilleryDesignator = class extends Rocket {
    // 3 seconds at 60fps
    constructor(width2, height2, cities, sizeMultiplier = 1, speedMultiplier = 1) {
      super(void 0, 0, 0, 0, width2, sizeMultiplier, speedMultiplier);
      this.targetX = 0;
      this.targetY = 0;
      this.isDesignating = false;
      this.designationTimer = 0;
      this.designationDuration = 180;
      this.type = "designator";
      this.color = "#ff9800";
      this.trailColor = "rgba(255, 152, 0, 0.5)";
      const availableCities = cities.filter((c) => !c.isDestroyed);
      this.targetCity = availableCities.length > 0 ? availableCities[Math.floor(random(0, availableCities.length))] : null;
      if (this.targetCity) {
        this.targetX = this.targetCity.x + this.targetCity.width / 2;
        this.targetY = height2 * random(0.3, 0.5);
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        const speed = 1.5 * speedMultiplier;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
      } else {
        this.vx = 0;
        this.vy = 1.5 * speedMultiplier;
      }
    }
    update() {
      if (!this.targetCity) {
        super.update();
        return;
      }
      if (this.isDesignating) {
        this.designationTimer++;
      } else {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 20) this.trail.shift();
        if (this.y >= this.targetY) {
          this.isDesignating = true;
          this.vx = 0;
          this.vy = 0;
        } else {
          this.x += this.vx;
          this.y += this.vy;
        }
        this.angle = Math.atan2(this.vy, this.vx) - Math.PI / 2;
      }
    }
    drawTargetingLaser(ctx2) {
      if (!this.targetCity) return;
      const progress = this.designationTimer / this.designationDuration;
      const beamColor = `rgba(255, 0, 0, ${0.2 + progress * 0.6})`;
      const beamWidth = 1 + progress * 4;
      ctx2.beginPath();
      ctx2.moveTo(this.x, this.y);
      ctx2.lineTo(this.targetCity.x + this.targetCity.width / 2, this.targetCity.y);
      ctx2.strokeStyle = beamColor;
      ctx2.lineWidth = beamWidth;
      ctx2.shadowColor = "red";
      ctx2.shadowBlur = 15;
      ctx2.stroke();
      ctx2.shadowBlur = 0;
    }
    draw(ctx2) {
      this.drawTrail(ctx2);
      this.drawHead(ctx2);
      if (this.isDesignating) {
        this.drawTargetingLaser(ctx2);
      }
    }
    drawHead(ctx2) {
      ctx2.save();
      ctx2.translate(this.x, this.y);
      ctx2.rotate(this.angle);
      const w = this.radius * 2;
      const h = this.radius * 2;
      ctx2.fillStyle = "#424242";
      ctx2.beginPath();
      ctx2.moveTo(-w / 2, -h / 2);
      ctx2.lineTo(w / 2, -h / 2);
      ctx2.lineTo(w, h / 2);
      ctx2.lineTo(-w, h / 2);
      ctx2.closePath();
      ctx2.fill();
      ctx2.fillStyle = this.color;
      ctx2.shadowColor = this.color;
      ctx2.shadowBlur = 15;
      ctx2.beginPath();
      ctx2.arc(0, 0, w / 4, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.restore();
    }
  };

  // ts/entities/rockets/shell.ts
  var ArtilleryShell = class {
    constructor(targetX, targetY) {
      this.timeLeft = 30;
      // 0.5 seconds travel time
      this.startY = 0;
      this.targetX = targetX;
      this.targetY = targetY;
      this.startX = targetX + random(-50, 50);
    }
    update() {
      this.timeLeft--;
      return this.timeLeft <= 0;
    }
    draw(ctx2) {
      const progress = 1 - this.timeLeft / 30;
      ctx2.beginPath();
      ctx2.moveTo(this.startX, this.startY);
      ctx2.lineTo(this.targetX, this.targetY);
      const gradient = ctx2.createLinearGradient(this.startX, this.startY, this.targetX, this.targetY);
      const stop1 = Math.max(0, progress - 0.05);
      const stop2 = progress;
      const stop3 = Math.min(1, progress + 0.05);
      gradient.addColorStop(0, "rgba(255, 100, 0, 0)");
      gradient.addColorStop(stop1, "rgba(255, 100, 0, 0)");
      gradient.addColorStop(stop2, "white");
      gradient.addColorStop(stop3, "rgba(255, 100, 0, 0)");
      gradient.addColorStop(1, "rgba(255, 100, 0, 0)");
      ctx2.strokeStyle = gradient;
      ctx2.lineWidth = 4;
      ctx2.stroke();
    }
  };

  // ts/systems/spawning.ts
  function handleSpawning(state2, width2, height2) {
    if (state2.empActiveTimer > 0) {
      return;
    }
    const waveDef = getWaveDefinition(state2.currentWave);
    if (waveDef.isBossWave) return;
    const difficulty = difficultySettings[state2.difficulty];
    const difficultyScale = state2.currentWave > 5 ? 1 + (state2.currentWave - 5) * 0.15 : 1;
    const currentWaveDelay = (waveDef.delay || 85) * difficulty.waveDelayMultiplier / difficultyScale;
    state2.waveRocketSpawn.timer++;
    if (state2.waveRocketSpawn.timer > currentWaveDelay && state2.waveRocketSpawn.toSpawn.length > 0) {
      const rocketType = state2.waveRocketSpawn.toSpawn.pop();
      if (rocketType) {
        createRocket(state2, rocketType, width2, height2, difficulty);
      }
      state2.waveRocketSpawn.timer = 0;
    }
    if (Math.random() < config.empSpawnChance && state2.empPowerUps.length < 1 && state2.empActiveTimer <= 0) {
      state2.empPowerUps.push(new EMP(null, null, width2, height2));
    }
  }
  function createRocket(state2, type, width2, height2, difficulty) {
    const speedBonus = difficulty.enemySpeedBonus || 1;
    const difficultyScale = state2.currentWave > 5 ? 1 + (state2.currentWave - 5) * 0.15 : 1;
    const speedMultiplier = (1 + state2.currentWave * 0.05) * difficultyScale * speedBonus;
    const sizeMultiplier = difficulty.missileSizeMultiplier;
    let newRocket;
    const rocketConstructors = {
      standard: () => new Rocket(void 0, void 0, void 0, void 0, width2, sizeMultiplier, speedMultiplier),
      mirv: () => new MirvRocket(width2, height2, sizeMultiplier, speedMultiplier),
      stealth: () => new StealthRocket(width2, sizeMultiplier, speedMultiplier),
      swarmer: () => new SwarmerRocket(width2, height2, sizeMultiplier, speedMultiplier),
      flare_rocket: () => new FlareRocket(width2, sizeMultiplier, speedMultiplier),
      armored: () => new ArmoredRocket(width2, sizeMultiplier, speedMultiplier),
      designator: () => new ArtilleryDesignator(width2, height2, state2.cities, sizeMultiplier, speedMultiplier)
    };
    if (rocketConstructors[type]) {
      newRocket = rocketConstructors[type]();
      if (state2.scramblerActive && Math.random() < 0.25) {
        newRocket.vx = random(-4, 4);
        newRocket.vy *= 0.8;
      }
      state2.rockets.push(newRocket);
    }
  }

  // ts/entities/bosses.ts
  var HiveCarrier = class {
    constructor(width2, healthMultiplier = 1) {
      this.type = "hive_carrier";
      this.id = random(0, 1e6);
      this.name = "Hive Carrier";
      this.maxHealth = Math.floor(config.bosses.hiveCarrier.health * healthMultiplier);
      this.health = this.maxHealth;
      this.width = width2;
      this.y = 150;
      this.droneSpawnCooldown = 0;
      this.droneSpawnRate = config.bosses.hiveCarrier.droneSpawnRate;
      this.radius = 100;
      if (Math.random() < 0.5) {
        this.x = -this.radius;
        this.vx = 0.5;
      } else {
        this.x = this.width + this.radius;
        this.vx = -0.5;
      }
    }
    takeDamage(amount) {
      this.health -= amount;
      return this.health <= 0;
    }
    update(rockets) {
      this.x += this.vx;
      if (this.vx > 0 && this.x + this.radius > this.width) {
        this.vx *= -1;
      } else if (this.vx < 0 && this.x - this.radius < 0) {
        this.vx *= -1;
      }
      this.droneSpawnCooldown--;
      if (this.droneSpawnCooldown <= 0) {
        const droneCount = 3;
        for (let i = 0; i < droneCount; i++) {
          const angle = random(Math.PI * 0.25, Math.PI * 0.75);
          const speed = random(2, 4);
          const newVx = Math.cos(angle) * speed;
          const newVy = Math.sin(angle) * speed;
          const spawnX = this.x + random(-this.radius * 0.5, this.radius * 0.5);
          rockets.push(new Drone(spawnX, this.y + 40, newVx, newVy, this.width));
        }
        this.droneSpawnCooldown = this.droneSpawnRate;
      }
    }
    draw(ctx2) {
      ctx2.save();
      ctx2.fillStyle = "#3c4043";
      ctx2.beginPath();
      ctx2.moveTo(this.x - this.radius, this.y);
      ctx2.bezierCurveTo(
        this.x - this.radius,
        this.y - 80,
        this.x + this.radius,
        this.y - 80,
        this.x + this.radius,
        this.y
      );
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = "#2a2c2e";
      ctx2.lineWidth = 4;
      ctx2.stroke();
      ctx2.fillStyle = "#00ddff";
      ctx2.beginPath();
      ctx2.moveTo(this.x - 20, this.y - 40);
      ctx2.bezierCurveTo(this.x, this.y - 60, this.x + 20, this.y - 60, this.x + 40, this.y - 40);
      ctx2.fill();
      ctx2.shadowColor = "#00ddff";
      ctx2.shadowBlur = 20;
      ctx2.fill();
      ctx2.shadowBlur = 0;
      ctx2.fillStyle = "#212121";
      ctx2.fillRect(this.x - 60, this.y + 5, 40, 20);
      ctx2.fillRect(this.x + 20, this.y + 5, 40, 20);
      ctx2.restore();
    }
  };

  // ts/systems/targeting.ts
  function findTargetedRocket(state2) {
    let closestDist = Infinity;
    state2.targetedRocket = null;
    const potentialTargets = [...state2.rockets, ...state2.flares];
    if (state2.boss) {
      potentialTargets.push(state2.boss);
    }
    for (const target of potentialTargets) {
      if (target.type === "stealth" && "isVisible" in target && !target.isVisible) {
        continue;
      }
      const dist = Math.hypot(target.x - state2.mouse.x, target.y - state2.mouse.y);
      const targetableRadius = target instanceof HiveCarrier ? target.radius : 50;
      if (dist < targetableRadius && dist < closestDist) {
        closestDist = dist;
        state2.targetedRocket = target;
      }
    }
  }

  // ts/systems/collisions.ts
  function awardPoints(state2, rocketType) {
    const points = config.points[rocketType] || config.points.standard;
    state2.score += points;
    state2.coins += points;
  }
  function handleInterceptorCollisions(state2) {
    for (let i = state2.interceptors.length - 1; i >= 0; i--) {
      const interceptor = state2.interceptors[i];
      let detonated = false;
      if (state2.boss && Math.hypot(interceptor.x - state2.boss.x, interceptor.y - state2.boss.y) < state2.boss.radius) {
        detonated = true;
        const damage = interceptor.type === "nuke" ? config.nukeDamage : config.interceptorDamage;
        if (state2.boss.takeDamage(damage)) {
          awardPoints(state2, "boss");
          createAdvancedExplosion(state2, state2.boss.x, state2.boss.y);
          triggerScreenShake(state2, 50, 120);
          state2.boss = null;
          state2.bossDefeated = true;
        }
      }
      for (let j = state2.rockets.length - 1; j >= 0 && !detonated; j--) {
        const rocket = state2.rockets[j];
        if (Math.hypot(interceptor.x - rocket.x, interceptor.y - rocket.y) < interceptor.blastRadius + rocket.radius) {
          detonated = true;
          const damage = config.interceptorDamage * (state2.activePerks.efficientInterceptors && Math.random() < 0.1 ? 3 : 1);
          const isDestroyed = rocket.takeDamage ? rocket.takeDamage(damage) : true;
          if (isDestroyed) {
            awardPoints(state2, rocket.type);
            state2.rockets.splice(j, 1);
          }
        }
      }
      for (let f = state2.flares.length - 1; f >= 0 && !detonated; f--) {
        const flare = state2.flares[f];
        if (Math.hypot(interceptor.x - flare.x, interceptor.y - flare.y) < interceptor.blastRadius + flare.radius) {
          detonated = true;
          state2.flares.splice(f, 1);
        }
      }
      if (detonated) {
        createAdvancedExplosion(state2, interceptor.x, interceptor.y);
        if (interceptor.type === "nuke") {
          state2.empActiveTimer = config.nukeEmpDuration;
          state2.empShockwave = { radius: 0, alpha: 1 };
          triggerScreenShake(state2, 30, 60);
        }
        state2.interceptors.splice(i, 1);
      }
    }
  }
  function handleTracerCollisions(state2) {
    for (let i = state2.tracerRounds.length - 1; i >= 0; i--) {
      const tracer = state2.tracerRounds[i];
      let hit = false;
      for (let j = state2.rockets.length - 1; j >= 0; j--) {
        const rocket = state2.rockets[j];
        if (Math.hypot(tracer.x - rocket.x, tracer.y - rocket.y) < tracer.radius + rocket.radius) {
          hit = true;
          const damage = rocket.type === "armored" ? 2 : 1;
          const isDestroyed = rocket.takeDamage ? rocket.takeDamage(damage) : true;
          if (isDestroyed) {
            awardPoints(state2, rocket.type);
            state2.rockets.splice(j, 1);
            createAdvancedExplosion(state2, tracer.x, tracer.y);
          } else {
            state2.flashes.push(new Flash(tracer.x, tracer.y, 20, "255, 255, 255"));
          }
          break;
        }
      }
      if (hit) {
        state2.tracerRounds.splice(i, 1);
      }
    }
  }

  // ts/systems/effectsSystem.ts
  function updateEmpEffects(state2) {
    if (state2.empActiveTimer > 0) {
      state2.empShockwave.radius += 20;
      state2.empShockwave.alpha = Math.max(0, state2.empShockwave.alpha - 0.01);
    } else {
      if (state2.empShockwave.radius !== 0 || state2.empShockwave.alpha !== 0) {
        state2.empShockwave = { radius: 0, alpha: 0 };
      }
    }
  }
  function updateCityEffects(state2, height2) {
    state2.cities.forEach((city) => {
      if (city.isSmoking && Math.random() < 0.03) {
        const smokeX = city.x + random(0, city.width);
        const smokeY = height2 - random(0, city.height * 0.5);
        state2.particles.push(new Particle(smokeX, smokeY, null, "smoke"));
      }
    });
  }

  // ts/gameLogic.ts
  function updateEntities(state2, width2, height2) {
    if (state2.boss) state2.boss.update(state2.rockets);
    if (state2.empActiveTimer <= 0) {
      state2.turrets.forEach((t) => {
        const newTracers = t.update(state2.rockets);
        if (newTracers.length > 0) state2.tracerRounds.push(...newTracers);
      });
      for (let i = state2.rockets.length - 1; i >= 0; i--) {
        const rocket = state2.rockets[i];
        rocket.update(state2.flares);
        if (handleRocketLogic(state2, rocket, i, width2, height2)) {
          continue;
        }
      }
    }
    state2.interceptors.forEach((interceptor) => interceptor.update(state2.rockets, state2.flares, state2.boss));
    state2.tracerRounds.forEach((tracer) => tracer.update());
    state2.flares.forEach((flare) => flare.update());
    state2.empPowerUps.forEach((emp) => emp.update());
    state2.particles.forEach((p) => p.update());
    state2.flashes.forEach((f) => f.update());
    state2.shockwaves.forEach((s) => s.update());
  }
  function handleRocketLogic(state2, rocket, index, width2, height2) {
    if (rocket.y >= height2) {
      if (rocket.type !== "designator") {
        createGroundImpact(state2, rocket.x, height2 - 1);
      }
      state2.rockets.splice(index, 1);
      return true;
    }
    if (rocket.x < -rocket.radius || rocket.x > width2 + rocket.radius || rocket.life > config.rocketMaxLifetime) {
      state2.rockets.splice(index, 1);
      return true;
    }
    for (const city of state2.cities) {
      if (!city.isDestroyed && rocket.type !== "designator" && rocket.y > city.y && rocket.x > city.x && rocket.x < city.x + city.width) {
        city.isArmored ? city.isArmored = false : city.destroy();
        createAdvancedExplosion(state2, rocket.x, rocket.y);
        triggerScreenShake(state2, 15, 30);
        state2.rockets.splice(index, 1);
        return true;
      }
    }
    if ((rocket.type === "mirv" || rocket.type === "swarmer") && rocket.hasSplit && rocket.split) {
      state2.rockets.push(...rocket.split());
      state2.rockets.splice(index, 1);
      return true;
    }
    if (rocket instanceof ArtilleryDesignator && rocket.isDesignating && rocket.designationTimer > rocket.designationDuration) {
      if (rocket.targetCity) {
        state2.artilleryShells.push(
          new ArtilleryShell(rocket.targetCity.x + rocket.targetCity.width / 2, rocket.targetCity.y)
        );
      }
      state2.rockets.splice(index, 1);
      return true;
    }
    return false;
  }
  function cleanupEntities(state2, width2) {
    state2.interceptors = state2.interceptors.filter((i) => i.y > 0 && i.x > 0 && i.x < width2);
    state2.tracerRounds = state2.tracerRounds.filter((t) => t.life > 0 && t.y > 0);
    state2.flares = state2.flares.filter((f) => f.life > 0);
    state2.particles = state2.particles.filter((p) => p.life > 0);
    state2.flashes = state2.flashes.filter((f) => f.alpha > 0);
    state2.shockwaves = state2.shockwaves.filter((s) => s.alpha > 0);
    state2.empPowerUps = state2.empPowerUps.filter((e) => e.life > 0);
  }
  function checkGameState(state2, refreshUpgradeScreen2) {
    const waveDef = getWaveDefinition(state2.currentWave);
    const allEnemiesDefeated = state2.rockets.length === 0 && (!waveDef.isBossWave || state2.bossDefeated);
    const waveComplete = allEnemiesDefeated && state2.waveRocketSpawn.toSpawn.length === 0;
    if (waveComplete) {
      state2.gameState = "BETWEEN_WAVES";
      state2.targetedRocket = null;
      state2.flares = [];
      state2.nukeAvailable = state2.activePerks.surplusValue ? state2.nukeAvailable : false;
      state2.firstUpgradePurchased = false;
      state2.scramblerActive = false;
      refreshUpgradeScreen2();
      return;
    }
    const destroyedCities = state2.cities.filter((c) => c.isDestroyed).length;
    if (destroyedCities === config.cityCount) {
      state2.gameState = "GAME_OVER";
      const isNewHighScore = state2.score > state2.playerData.highScores[state2.difficulty];
      if (isNewHighScore) {
        state2.playerData.highScores[state2.difficulty] = state2.score;
        state2.newHighScore = true;
      }
      const pointsEarned = Math.floor(state2.score / 100) + state2.currentWave * 10;
      state2.playerData.prestigePoints += pointsEarned;
      savePlayerData(state2.playerData);
    }
  }
  function update(state2, width2, height2, refreshUpgradeScreen2) {
    state2.gameTime++;
    if (state2.empActiveTimer > 0) {
      state2.empActiveTimer--;
    }
    findTargetedRocket(state2);
    handleSpawning(state2, width2, height2);
    updateEntities(state2, width2, height2);
    updateCityEffects(state2, height2);
    updateEmpEffects(state2);
    handleInterceptorCollisions(state2);
    handleTracerCollisions(state2);
    cleanupEntities(state2, width2);
    checkGameState(state2, refreshUpgradeScreen2);
  }

  // ts/drawing.ts
  function drawReticle(ctx2, rocket, gameTime) {
    const size = rocket.radius * 2;
    ctx2.save();
    ctx2.translate(rocket.x, rocket.y);
    ctx2.strokeStyle = "red";
    ctx2.lineWidth = 2;
    ctx2.rotate(gameTime * 0.05);
    ctx2.beginPath();
    ctx2.moveTo(-size, -size / 2);
    ctx2.lineTo(-size, -size);
    ctx2.lineTo(-size / 2, -size);
    ctx2.moveTo(size, -size / 2);
    ctx2.lineTo(size, -size);
    ctx2.lineTo(size / 2, -size);
    ctx2.moveTo(-size, size / 2);
    ctx2.lineTo(-size, size);
    ctx2.lineTo(-size / 2, size);
    ctx2.moveTo(size, size / 2);
    ctx2.lineTo(size, size);
    ctx2.lineTo(size / 2, size);
    ctx2.stroke();
    ctx2.restore();
  }
  function draw(ctx2, state2, width2, height2) {
    ctx2.save();
    if (state2.screenShake.duration > 0) {
      ctx2.translate(
        (Math.random() - 0.5) * state2.screenShake.intensity,
        (Math.random() - 0.5) * state2.screenShake.intensity
      );
      state2.screenShake.duration--;
    }
    ctx2.clearRect(0, 0, width2, height2);
    if (state2.empShockwave.alpha > 0) {
      ctx2.beginPath();
      ctx2.arc(width2 / 2, height2 / 2, state2.empShockwave.radius, 0, Math.PI * 2);
      ctx2.strokeStyle = `rgba(0, 180, 255, ${state2.empShockwave.alpha})`;
      ctx2.lineWidth = 15;
      ctx2.stroke();
    }
    if (state2.gameState === "BETWEEN_WAVES") {
      state2.turrets.forEach((turret) => {
        ctx2.beginPath();
        ctx2.arc(turret.x, turret.y, turret.range, 0, Math.PI * 2);
        const alpha = 0.2 + Math.sin(state2.gameTime * 0.05) * 0.1;
        ctx2.fillStyle = `rgba(0, 221, 255, ${alpha})`;
        ctx2.fill();
        ctx2.strokeStyle = `rgba(0, 221, 255, ${alpha * 2})`;
        ctx2.setLineDash([15, 10]);
        ctx2.stroke();
        ctx2.setLineDash([]);
      });
    }
    ctx2.fillStyle = "rgba(0, 221, 255, 0.3)";
    ctx2.fillRect(0, height2 - 1, width2, 1);
    state2.cities.forEach((city) => city.draw(ctx2, height2));
    state2.turrets.forEach((turret) => turret.draw(ctx2));
    state2.homingMines.forEach((mine) => mine.draw(ctx2));
    state2.empPowerUps.forEach((emp) => emp.draw(ctx2));
    state2.flares.forEach((flare) => flare.draw(ctx2));
    state2.tracerRounds.forEach((t) => t.draw(ctx2));
    if (state2.boss) {
      state2.boss.draw(ctx2);
    }
    if (state2.targetedRocket) {
      drawReticle(ctx2, state2.targetedRocket, state2.gameTime);
    }
    state2.artilleryShells.forEach((s) => s.draw(ctx2));
    ctx2.beginPath();
    ctx2.moveTo(width2 / 2 - 20, height2);
    ctx2.lineTo(width2 / 2, height2 - 20);
    ctx2.lineTo(width2 / 2 + 20, height2);
    ctx2.closePath();
    ctx2.fillStyle = "#00ffff";
    ctx2.shadowColor = "#00ffff";
    ctx2.shadowBlur = 10;
    ctx2.fill();
    ctx2.shadowBlur = 0;
    state2.rockets.forEach((r) => r.draw(ctx2));
    state2.interceptors.forEach((i) => i.draw(ctx2));
    state2.particles.forEach((p) => p.draw(ctx2));
    ctx2.globalCompositeOperation = "lighter";
    state2.flashes.forEach((f) => f.draw(ctx2));
    ctx2.globalCompositeOperation = "source-over";
    state2.shockwaves.forEach((s) => s.draw(ctx2));
    ctx2.restore();
  }

  // ts/eventHandlers.ts
  function handleMouseMove(state2, canvas2, e) {
    const rect = canvas2.getBoundingClientRect();
    state2.mouse.x = e.clientX - rect.left;
    state2.mouse.y = e.clientY - rect.top;
  }
  function handleInterceptorLaunch(state2, width2, height2) {
    if (state2.targetedRocket) {
      const nukeIsAvailable = state2.nukeAvailable && !state2.activePerks.surplusValue;
      if (nukeIsAvailable) {
        state2.interceptors.push(
          new Interceptor(
            width2 / 2,
            height2,
            state2.targetedRocket,
            state2.interceptorSpeed,
            config.nukeBlastRadius,
            "nuke"
          )
        );
        state2.nukeAvailable = false;
      } else {
        const numShots = 1 + state2.multishotLevel;
        const centralLauncherX = width2 / 2;
        const spread = (numShots - 1) * 10;
        const startX = centralLauncherX - spread / 2;
        for (let i = 0; i < numShots; i++) {
          const launchX = startX + i * 10;
          state2.interceptors.push(
            new Interceptor(
              launchX,
              height2,
              state2.targetedRocket,
              state2.interceptorSpeed,
              state2.interceptorBlastRadius,
              "standard"
            )
          );
        }
      }
    }
  }
  function handleClick(state2, canvas2, e) {
    if (state2.gameState !== "IN_WAVE") return;
    const rect = canvas2.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = state2.empPowerUps.length - 1; i >= 0; i--) {
      const emp = state2.empPowerUps[i];
      if (Math.hypot(x - emp.x, y - emp.y) < emp.radius) {
        state2.empActiveTimer = config.empDuration;
        state2.empShockwave = { radius: 0, alpha: 1 };
        state2.empPowerUps.splice(i, 1);
        return;
      }
    }
    if (state2.homingMinesAvailable > 0 && y > canvas2.height * config.homingMineDeploymentZone) {
      state2.homingMines.push(new HomingMine(x, canvas2.height - 10));
      state2.homingMinesAvailable--;
      return;
    }
    handleInterceptorLaunch(state2, canvas2.width, canvas2.height);
  }
  function handleTouchStart(state2, canvas2, e) {
    e.preventDefault();
    if (state2.gameState !== "IN_WAVE") return;
    const rect = canvas2.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    let closestDist = config.touchTargetingRadius;
    let touchTarget = null;
    const potentialTargets = [...state2.rockets, ...state2.flares];
    for (const target of potentialTargets) {
      if (target.type === "stealth" && "isVisible" in target && !target.isVisible) continue;
      const dist = Math.hypot(target.x - x, target.y - y);
      if (dist < closestDist) {
        closestDist = dist;
        touchTarget = target;
      }
    }
    if (touchTarget) {
      state2.interceptors.push(
        new Interceptor(
          canvas2.width / 2,
          canvas2.height,
          touchTarget,
          state2.interceptorSpeed,
          state2.interceptorBlastRadius,
          "standard"
        )
      );
    }
  }
  function pauseGame(state2) {
    if (state2.gameState === "IN_WAVE") {
      state2.gameState = "PAUSED";
    }
  }
  function resumeGame(state2) {
    if (state2.gameState === "PAUSED") {
      state2.gameState = "IN_WAVE";
      hideModal();
    }
  }
  function togglePause(state2, restartCallback) {
    if (state2.gameState === "IN_WAVE") {
      pauseGame(state2);
      showPauseScreen(() => resumeGame(state2), restartCallback);
    } else if (state2.gameState === "PAUSED") {
      resumeGame(state2);
    }
  }

  // ts/upgrades/helpers.ts
  function applyCost(state2, baseCost) {
    if (state2.activePerks.rapidDeployment && !state2.firstUpgradePurchased) {
      state2.firstUpgradePurchased = true;
      return Math.ceil(baseCost * 0.75);
    }
    return baseCost;
  }

  // ts/upgrades/core.ts
  function handleUpgradeTurret(state2, canvas2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.automatedTurret);
    if (state2.coins >= cost && state2.turrets.length < config.maxTurrets) {
      state2.coins -= cost;
      const turretX = state2.turrets.length === 0 ? canvas2.width * 0.25 : canvas2.width * 0.75;
      const fireRate = config.turretFireRate * difficultySettings[state2.difficulty].turretFireRateMultiplier;
      const range = config.turretRange * (1 + state2.turretRangeLevel * 0.15);
      state2.turrets.push(new AutomatedTurret(turretX, canvas2.height - 10, range, fireRate));
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeSpeed(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.interceptorSpeed);
    if (state2.coins >= cost) {
      state2.coins -= cost;
      state2.interceptorSpeed *= 1.2;
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeBlastRadius(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.flakWarheads * (state2.blastRadiusLevel + 1));
    if (state2.coins >= cost && state2.blastRadiusLevel < 5) {
      state2.coins -= cost;
      state2.blastRadiusLevel++;
      state2.interceptorBlastRadius += 5;
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeMultishot(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.multishot * (state2.multishotLevel + 1));
    if (state2.coins >= cost && state2.multishotLevel < 3) {
      state2.coins -= cost;
      state2.multishotLevel++;
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeBaseArmor(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.baseArmor);
    if (state2.coins >= cost && !state2.basesAreArmored) {
      state2.coins -= cost;
      state2.basesAreArmored = true;
      state2.cities.forEach((c) => c.isArmored = true);
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeTurretSpeed(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.turretSpeed);
    if (state2.coins >= cost && state2.turretFireRateLevel < 3) {
      state2.coins -= cost;
      state2.turretFireRateLevel++;
      state2.turrets.forEach((t) => t.fireRate *= 0.75);
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeTurretRange(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.turretRange);
    if (state2.coins >= cost && state2.turretRangeLevel < 3) {
      state2.coins -= cost;
      state2.turretRangeLevel++;
      state2.turrets.forEach((t) => t.range *= 1.15);
      refreshUpgradeScreen2();
    }
  }

  // ts/upgrades/tactical.ts
  function handleUpgradeNuke(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.nuke);
    const nukeIsPurchasable = !state2.nukeAvailable || state2.activePerks.surplusValue;
    if (state2.coins >= cost && nukeIsPurchasable) {
      state2.coins -= cost;
      state2.nukeAvailable = true;
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeHomingMine(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.homingMine);
    if (state2.coins >= cost) {
      state2.coins -= cost;
      state2.homingMinesAvailable++;
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeFieldReinforcement(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.fieldReinforcement);
    if (state2.coins >= cost) {
      state2.coins -= cost;
      state2.cities.forEach((c) => {
        if (!c.isDestroyed && !c.isArmored) {
          c.isArmored = true;
        }
      });
      refreshUpgradeScreen2();
    }
  }
  function handleUpgradeTargetingScrambler(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.targetingScrambler);
    if (state2.coins >= cost && !state2.scramblerActive) {
      state2.coins -= cost;
      state2.scramblerActive = true;
      refreshUpgradeScreen2();
    }
  }

  // ts/upgrades/maintenance.ts
  function handleUpgradeRepair(state2, refreshUpgradeScreen2) {
    const cost = applyCost(state2, config.upgradeCosts.repairCity);
    if (state2.coins >= cost) {
      const cityToRepair = state2.cities.find((c) => c.isDestroyed);
      if (cityToRepair) {
        state2.coins -= cost;
        cityToRepair.repair();
        refreshUpgradeScreen2();
      }
    }
  }

  // ts/flow.ts
  function startNextWave(state2, canvas2) {
    state2.currentWave++;
    const waveDef = getWaveDefinition(state2.currentWave);
    state2.boss = null;
    state2.bossDefeated = false;
    state2.waveRocketSpawn.toSpawn = [];
    state2.waveStartTime = state2.gameTime;
    if (waveDef.isBossWave) {
      if (waveDef.bossType === "hiveCarrier") {
        const waveFactor = state2.currentWave - config.waveDefinitions.length + 1;
        const healthMultiplier = waveFactor > 0 ? 1 + Math.floor(waveFactor / 5) * 0.75 : 1;
        state2.boss = new HiveCarrier(canvas2.width, healthMultiplier);
      }
    } else {
      const composition = waveDef.composition || [];
      if (composition.length === 0) {
        for (let i = 0; i < (waveDef.standard || 0); i++) composition.push("standard");
        for (let i = 0; i < (waveDef.mirv || 0); i++) composition.push("mirv");
        for (let i = 0; i < (waveDef.stealth || 0); i++) composition.push("stealth");
        for (let i = 0; i < (waveDef.swarmer || 0); i++) composition.push("swarmer");
        for (let i = 0; i < (waveDef.flare_rocket || 0); i++) composition.push("flare_rocket");
        for (let i = 0; i < (waveDef.armored || 0); i++) composition.push("armored");
        for (let i = 0; i < (waveDef.designator || 0); i++) composition.push("designator");
      }
      state2.waveRocketSpawn.toSpawn = composition.sort(() => Math.random() - 0.5);
    }
    state2.waveRocketSpawn.timer = 0;
    state2.gameState = "IN_WAVE";
    hideModal();
    updateTopUI(state2);
    updateBossUI(state2.boss);
  }
  function refreshUpgradeScreen(state2, canvas2) {
    updateTopUI(state2);
    const refreshCallback = () => refreshUpgradeScreen(state2, canvas2);
    showBetweenWaveScreen(
      state2,
      {
        upgradeRepairCallback: () => handleUpgradeRepair(state2, refreshCallback),
        upgradeTurretCallback: () => handleUpgradeTurret(state2, canvas2, refreshCallback),
        upgradeSpeedCallback: () => handleUpgradeSpeed(state2, refreshCallback),
        upgradeMultishotCallback: () => handleUpgradeMultishot(state2, refreshCallback),
        upgradeBlastRadiusCallback: () => handleUpgradeBlastRadius(state2, refreshCallback),
        upgradeNukeCallback: () => handleUpgradeNuke(state2, refreshCallback),
        upgradeBaseArmorCallback: () => handleUpgradeBaseArmor(state2, refreshCallback),
        upgradeTurretSpeedCallback: () => handleUpgradeTurretSpeed(state2, refreshCallback),
        upgradeTurretRangeCallback: () => handleUpgradeTurretRange(state2, refreshCallback),
        upgradeHomingMineCallback: () => handleUpgradeHomingMine(state2, refreshCallback),
        upgradeFieldReinforcementCallback: () => handleUpgradeFieldReinforcement(state2, refreshCallback),
        upgradeTargetingScramblerCallback: () => handleUpgradeTargetingScrambler(state2, refreshCallback),
        nextWaveCallback: () => startNextWave(state2, canvas2)
      },
      config
    );
  }

  // ts/assetLoader.ts
  var spriteUrls = {
    bunker: "assets/bunker.png",
    dome: "assets/dome.png",
    comms: "assets/tower.png"
  };
  var loadedSprites = {};
  function loadGameAssets() {
    const promises = [];
    for (const key in spriteUrls) {
      const url = spriteUrls[key];
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          loadedSprites[key] = img;
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load sprite: ${key} at ${url}`));
        img.src = url;
      });
      promises.push(promise);
    }
    return Promise.all(promises).then(() => {
    });
  }

  // ts/main.ts
  var canvas = document.getElementById("gameCanvas");
  var ctx = canvas.getContext("2d");
  var width;
  var height;
  var animationFrameId;
  var state;
  function gameLoop(timestamp) {
    if (state.gameState === "IN_WAVE") {
      update(state, width, height, () => refreshUpgradeScreen(state, canvas));
    }
    if (state.gameState === "GAME_OVER") {
      cancelAnimationFrame(animationFrameId);
      const pointsEarned = Math.floor(state.score / 100) + state.currentWave * 10;
      showGameOverScreen(state, init, pointsEarned, state.newHighScore);
      return;
    }
    updateTopUI(state);
    updateBossUI(state.boss);
    state.frameCount++;
    if (timestamp - state.lastFpsUpdate > 1e3) {
      state.fps = state.frameCount;
      state.frameCount = 0;
      state.lastFpsUpdate = timestamp;
    }
    draw(ctx, state, width, height);
    animationFrameId = requestAnimationFrame(gameLoop);
  }
  var resetAndStartGame = (difficulty = "normal") => {
    const playerData = loadPlayerData();
    state = createInitialState(playerData);
    if (window.Cypress) {
      window.gameState = state;
    }
    state.difficulty = difficulty;
    state.coins = difficultySettings[difficulty].startingCoins;
    state.currentWave = -1;
    createCities();
    startNextWave(state, canvas);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
  };
  function createCities() {
    state.cities = [];
    const citySlotWidth = width / config.cityCount;
    const minHeight = 50;
    const maxHeight = Math.min(height * 0.15, 120);
    const spriteKeys = Object.keys(loadedSprites);
    for (let i = 0; i < config.cityCount; i++) {
      const randomSpriteKey = spriteKeys[Math.floor(random(0, spriteKeys.length))];
      const sprite = loadedSprites[randomSpriteKey];
      let h;
      if (randomSpriteKey === "comms") {
        h = random(maxHeight, maxHeight * 1.3);
      } else {
        h = random(minHeight, maxHeight * 0.9);
      }
      const aspectRatio = sprite.naturalWidth / sprite.naturalHeight;
      const w = h * aspectRatio;
      const x = i * citySlotWidth + (citySlotWidth - w) / 2;
      const y = height - h;
      state.cities.push(new City(x, y, w, h, state.basesAreArmored, sprite));
    }
  }
  var resizeCanvas = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (state && state.gameState !== "IN_WAVE") {
      draw(ctx, state, width, height);
    }
  };
  async function init() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    showModalWithContent("<h1>Loading Assets...</h1>");
    try {
      await loadGameAssets();
      const playerData = loadPlayerData();
      state = createInitialState(playerData);
      if (window.Cypress) {
        window.gameState = state;
      }
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      canvas.addEventListener("mousemove", (e) => handleMouseMove(state, canvas, e));
      canvas.addEventListener("click", (e) => handleClick(state, canvas, e));
      canvas.addEventListener("touchstart", (e) => handleTouchStart(state, canvas, e), {
        passive: false
      });
      document.getElementById("pause-button")?.addEventListener("click", () => togglePause(state, init));
      document.getElementById("rocket-info-btn")?.addEventListener("click", () => {
        const gameWasRunning = state.gameState === "IN_WAVE";
        if (gameWasRunning) {
          pauseGame(state);
        }
        showRocketInfoScreen(() => {
          hideModal();
          if (gameWasRunning) {
            resumeGame(state);
          }
        });
      });
      showStartScreen(resetAndStartGame, () => showArmoryScreen(playerData, resetAndStartGame));
      animationFrameId = requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error("Failed to load game assets:", error);
      showModalWithContent(
        "<h1>Error</h1><p>Could not load game assets. Please refresh the page to try again.</p>",
        "game-over"
      );
    }
  }
  init();
})();
//# sourceMappingURL=main.js.map
