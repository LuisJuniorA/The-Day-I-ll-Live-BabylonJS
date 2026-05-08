import { Merchant } from "../entities/villagers/Merchant";
import { Villager } from "../entities/villagers/Villager";

export const NPC_REGISTRY: Record<string, any> = {
    VILLAGER_BOB: Villager,
    VILLAGER_ANNA: Villager,
    MERCHANT_SILAS: Merchant,
};
