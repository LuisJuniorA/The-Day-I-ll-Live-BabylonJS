import type { CharacterStats } from "./CharacterStats";

export type SteeringWeights = {
    seek: number; // Importance de la poursuite
    separation: number; // Importance de l'évitement des autres ennemis
};
export type EnemyBehaviorConfig = {
    detectionRange: number;
    escapeRange: number;
    interactionRange: number; // Quand l'IA s'arrête pour frapper
    attackRange: number; // Portée réelle des dégâts (Hitbox)

    arrivalRadius: number;
    weights: SteeringWeights;
    maxSpeed: number;
    turnSpeed: number;
    maxForce: number;
};

export type EnemyConfig = {
    id: string;
    displayName: string;
    assetPath: string;
    stats: CharacterStats;
    behavior: EnemyBehaviorConfig;
};
