export interface ShopItemConfig {
    id: string;
    price: number;
}

export interface NPCConfig {
    name: string;
    texts: string[];
    assetPath: string; // Le chemin vers le .glb
    portrait?: string;
    metadata?: {
        shopItems?: ShopItemConfig[];
        [key: string]: any; // Permet d'ajouter d'autres trucs plus tard
    };
}

export const NPC_DATA: Record<string, NPCConfig> = {
    VILLAGER_BOB: {
        name: "Bob le Bricoleur",
        assetPath: "assets/models/characters/npcs/villager.glb",
        texts: [
            "Salut ! Beau temps pour construire, non ?",
            "Fais attention aux monstres la nuit.",
            "Si tu as besoin d'une pelle, repasse demain.",
        ],
    },
    VILLAGER_ANNA: {
        name: "Anna l'Herboriste",
        assetPath: "assets/models/characters/npcs/villager_female.glb",
        texts: [
            "Mes potions sont les meilleures du royaume !",
            "Les fleurs de ce jardin ont des propriétés magiques.",
        ],
    },
    MERCHANT_SILAS: {
        name: "Silas le Marchand",
        assetPath: "assets/models/characters/npcs/merchant.glb",
        texts: [
            "Ah, un voyageur ! Regarde mes marchandises.",
            "Je n'accepte que l'or pur, pas de crédit !",
        ],
        metadata: {
            shopItems: [
                { id: "despairs_tear", price: 150 },
                { id: "slime_soul", price: 30 },
            ],
        },
    },
};
