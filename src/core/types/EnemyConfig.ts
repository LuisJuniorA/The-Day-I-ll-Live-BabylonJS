import type { CharacterStats } from "./CharacterStats";

export type SteeringWeights = {
    seek: number; // Importance de la poursuite
    separation: number; // Importance de l'évitement des autres ennemis
};

export type EnemyBehaviorConfig = {
    // Distances de décision
    detectionRange: number; // Portée de vue (Idle -> Chase)
    escapeRange: number; // Distance d'abandon (Chase -> Idle)
    interactionRange: number; // Portée d'attaque (ProximitySystem)

    // Paramètres Steering
    arrivalRadius: number; // Rayon où l'IA commence à ralentir
    weights: SteeringWeights;

    // Physique
    maxSpeed: number;
    turnSpeed: number; // Facteur de Lerp pour la rotation (ex: 0.1)
};

export type EnemyConfig = {
    id: string;
    displayName: string;
    stats: CharacterStats;
    behavior: EnemyBehaviorConfig;
};
