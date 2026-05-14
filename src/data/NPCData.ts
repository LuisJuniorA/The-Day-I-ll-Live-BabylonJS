export interface ShopItemConfig {
    id: string;
    price: number;
}
export interface NPCConfig {
    name: string;
    texts: string[];
    assetPath: string;
    metadata?: {
        shopItems?: ShopItemConfig[];
        forgeRecipes?: string[];
        isForge?: boolean;
    };
}

export const NPC_DATA: Record<string, NPCConfig> = {
    MERCHANT_SILAS: {
        name: "Silas le Marchand",
        assetPath: "./assets/models/characters/npcs/merchant.glb",
        texts: [
            "Regarde mes marchandises, voyageur.",
            "L'or pur est la seule langue que je parle.",
        ],
        metadata: {
            shopItems: [
                { id: "slime_soul", price: 40 },
                { id: "despairs_tear", price: 200 },
                { id: "imperial_steel", price: 500 }, // Silas revend l'acier à prix d'or
            ],
        },
    },
    BLACKSMITH: {
        name: "Grumdur le Forgeron",
        assetPath: "./assets/models/characters/npcs/blacksmith.glb",
        texts: [
            "Le feu de la forge purifie tout.",
            "Apporte les matériaux, je ferai le reste.",
        ],
        metadata: {
            isForge: true,
            forgeRecipes: [
                // Matériaux d'abord
                "imperial_steel",
                "monster_claw",
                "dragon_scale",
                "dark_feather",
                // Puis les armes (ordre croissant)
                "knife",
                "butcher_dagger",
                "noble_dagger",
                "knight_sword",
                "scale_sword",
                "great_steel_sword",
            ],
        },
    },
    BONFIRE_MAIN: {
        name: "Feu de Camp",
        assetPath: "./assets/models/props/campfire.glb",
        texts: ["Le feu crépite doucement. Vous vous sentez reposé."],
        metadata: {},
    },
};
