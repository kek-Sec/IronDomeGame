// ts/perks.ts
import { Perk } from './types';

export const perks: Record<string, Perk> = {
    veteranCommander: {
        name: 'Veteran Commander',
        description: 'Begin each run with 500 extra score.',
        cost: 150,
    },
    advancedFortifications: {
        name: 'Advanced Fortifications',
        description: 'Start each game with Base Armor already applied to all cities.',
        cost: 400,
    },
    rapidDeployment: {
        name: 'Rapid Deployment',
        description: 'The first upgrade purchased in the shop each wave is 25% cheaper.',
        cost: 300,
    },
    efficientInterceptors: {
        name: 'Efficient Interceptors',
        description: 'All interceptors have a 10% chance to be a "Critical Hit", dealing triple damage.',
        cost: 500,
    },
    surplusValue: {
        name: 'Surplus Value',
        description: 'The Nuke Interceptor can be purchased every wave (instead of one per game).',
        cost: 800,
    },
    extraMine: {
        name: 'Reserve Mine',
        description: 'Start every game with one free Homing Mine available.',
        cost: 200,
    },
};
