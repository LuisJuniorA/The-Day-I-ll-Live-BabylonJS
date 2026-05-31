import { Effroi } from "../entities/enemies/Effroi";
import { ShadowBoss } from "../entities/enemies/ShadowBoss";
import { Slime } from "../entities/enemies/Slime";

export const ENEMY_REGISTRY: Record<string, any> = {
    slime: Slime,
    effroi: Effroi,
    shadowboss: ShadowBoss,
};
