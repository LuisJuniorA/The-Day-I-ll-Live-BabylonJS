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
                { id: "health_potion", price: 120 }, // Achat direct plus cher que le craft
                { id: "speed_elixir", price: 450 },
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
                "imperial_steel",
                "monster_claw",
                "dragon_scale",
                "dark_feather",
                "health_potion",
                "speed_elixir",
                "berserker_brew", // Consommables craftables
                "fish_knife",
                "butcher_dagger",
                "noble_dagger",
                "hunter_knife",
                "crow_dagger",
                "knight_sword",
                "oath_sword",
                "sashimi_sword",
                "scale_sword",
                "great_jade_sword",
                "great_imperial_sword",
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
