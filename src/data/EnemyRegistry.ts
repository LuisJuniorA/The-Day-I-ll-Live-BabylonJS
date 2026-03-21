import { Enemy } from "../core/abstracts/Enemy";
import { Effroi } from "../entities/Effroi";

export const ENEMY_REGISTRY: Record<string, any> = {
    "enemy": Enemy,
    "effroi": Effroi,
};