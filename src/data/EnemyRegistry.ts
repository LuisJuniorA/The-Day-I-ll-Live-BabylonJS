import { Enemy } from "../core/abstracts/Enemy";
import { Effroi } from "../entities/enemies/Effroi";

export const ENEMY_REGISTRY: Record<string, any> = {
    enemy: Enemy,
    effroi: Effroi,
};
