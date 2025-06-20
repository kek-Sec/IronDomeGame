// ts/types.ts

// =================================================================
// Core Game State and System
// =================================================================

export interface GameState {
    // Core Game State
    gameState: 'START_SCREEN' | 'IN_WAVE' | 'BETWEEN_WAVES' | 'PAUSED' | 'GAME_OVER';
    difficulty: 'easy' | 'normal' | 'hard';
    score: number;
    coins: number;
    currentWave: number;

    // Game Entities
    rockets: Rocket[];
    interceptors: Interceptor[];
    particles: Particle[];
    cities: City[];
    turrets: AutomatedTurret[];
    tracerRounds: TracerRound[];
    homingMines: HomingMine[];
    empPowerUps: EMP[];
    flares: Flare[];
    artilleryShells: ArtilleryShell[];
    boss: HiveCarrier | null;

    // Visual Effects
    flashes: Flash[];
    shockwaves: Shockwave[];

    // Flags & Timers
    bossDefeated: boolean;
    timeSinceLastRocket: number;
    waveStartTime: number;
    empActiveTimer: number;
    empShockwave: { radius: number; alpha: number };
    screenShake: { intensity: number; duration: number };
    waveRocketSpawn: { count: number; timer: number; toSpawn: string[] };

    // System & Player Info
    gameTime: number;
    fps: number;
    frameCount: number;
    lastFpsUpdate: number;
    mouse: { x: number; y: number };
    targetedRocket: Rocket | Flare | HiveCarrier | null;

    // Upgrades & Perks State
    interceptorSpeed: number;
    interceptorBlastRadius: number;
    blastRadiusLevel: number;
    multishotLevel: number;
    nukeAvailable: boolean;
    basesAreArmored: boolean;
    turretFireRateLevel: number;
    turretRangeLevel: number;
    homingMinesAvailable: number;
    firstUpgradePurchased: boolean;
    scramblerActive: boolean;

    // Persistent Data
    playerData: PlayerData;
    activePerks: Record<string, boolean>;
}

export interface PlayerData {
    prestigePoints: number;
    unlockedPerks: Record<string, boolean>;
    highScores: {
        easy: number;
        normal: number;
        hard: number;
    };
}

// =================================================================
// Entity Interfaces
// =================================================================

export interface Drawable {
    draw(ctx: CanvasRenderingContext2D, ...args: any[]): void;
}

export interface Updatable {
    update(...args: any[]): void;
}

export interface GameEntity extends Drawable, Updatable {
    x: number;
    y: number;
    radius: number;
}

export interface Rocket extends GameEntity {
    id: number;
    type: string;
    vx: number;
    vy: number;
    life: number;
    isVisible?: boolean;
    hasSplit?: boolean;
    takeDamage?(amount: number): boolean;
    split?(): Rocket[];
}

export interface City extends Drawable {
    x: number;
    y: number;
    width: number;
    height: number;
    isDestroyed: boolean;
    isArmored: boolean;
    isSmoking: boolean;
    destroy(): void;
    repair(): void;
    draw(ctx: CanvasRenderingContext2D, height: number): void;
}

export interface AutomatedTurret extends Drawable {
    x: number;
    y: number;
    range: number;
    fireRate: number;
    update(rockets: Rocket[]): TracerRound[];
}

export interface HiveCarrier extends GameEntity {
    id: number;
    type: string;
    name: string;
    health: number;
    maxHealth: number;
    takeDamage(amount: number): boolean;
    update(rockets: Rocket[]): void;
}

export interface Interceptor extends GameEntity {
    type: 'standard' | 'nuke';
    blastRadius: number;
    update(rockets: Rocket[], flares: Flare[], boss: HiveCarrier | null): void;
}

export interface Particle extends GameEntity {
    life: number;
}
export interface TracerRound extends GameEntity {
    life: number;
}
export interface Flare extends GameEntity {
    id: number;
    life: number;
    type: string;
}
export interface HomingMine extends GameEntity {
    update(rockets: Rocket[]): boolean;
}
export interface EMP extends GameEntity {
    life: number;
}
export interface ArtilleryShell extends Drawable {
    targetX: number;
    targetY: number;
    update(): boolean;
}
export interface Flash extends Drawable {
    alpha: number;
    update(): void;
}
export interface Shockwave extends Drawable {
    alpha: number;
    update(): void;
}

// =================================================================
// Configuration Types
// =================================================================

export interface DifficultySetting {
    name: string;
    description: string;
    waveDelayMultiplier: number;
    missileSizeMultiplier: number;
    turretFireRateMultiplier: number;
    enemySpeedBonus: number;
    startingCoins: number;
}

export interface WaveDefinition {
    standard?: number;
    mirv?: number;
    stealth?: number;
    swarmer?: number;
    flare_rocket?: number;
    armored?: number;
    designator?: number;
    delay?: number;
    isBossWave?: boolean;
    bossType?: string;
    composition?: string[];
}

export interface Perk {
    name: string;
    description: string;
    cost: number;
}

// =================================================================
// Callback Types
// =================================================================

export type VoidCallback = () => void;
export type StartGameCallback = (difficulty: 'easy' | 'normal' | 'hard') => void;