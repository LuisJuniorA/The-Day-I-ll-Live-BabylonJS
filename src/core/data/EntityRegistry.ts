import { NPC_REGISTRY } from "./NPCRegistry";
import { ENEMY_REGISTRY } from "./EnemyRegistry";

export const ENTITY_REGISTRY: Record<string, any> = {
    ...NPC_REGISTRY,
    ...ENEMY_REGISTRY
};