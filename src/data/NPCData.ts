import type { ChestReward } from "../core/interfaces/Interactable";

export interface ShopItemConfig {
    id: string;
    price: number;
}
export interface NPCConfig {
    name: string;
    texts: string[];
    assetPath: string;
    portrait?: string;
    metadata?: {
        shopItems?: ShopItemConfig[];
        forgeRecipes?: string[];
        isForge?: boolean;
        reward?: ChestReward; // Correction : Ajout explicite du type ChestReward
    };
}

export const NPC_DATA: Record<string, NPCConfig> = {
    MERCHANT_SILAS: {
        name: "Silas le Marchand",
        assetPath: "./assets/models/characters/enemies/effroi.glb",
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
    MERCHANT: {
        name: "Silas le Marchand",
        assetPath: "./assets/models/characters/enemies/effroi.glb",
        texts: [
            "Gaze upon my wares, traveler.",
            "Or are you merely a wanderer in search of nothing?",
            "Spare me the chatter. Only gold holds any weight here.",
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
    CHEST_SPELL: {
        name: "Coffre Arcanique",
        assetPath: "procedural",
        texts: ["Une aura mystique émane de ce coffre."],
        metadata: {
            reward: {
                spells: ["fire_nova"], // ID utilisé dans le switch du listener
            },
        },
    },
    CHEST_DRAGON: {
        name: "Coffre de Dragon",
        assetPath: "procedural",
        texts: ["Les écailles brillent d'un éclat ancien."],
        metadata: {
            reward: {
                items: [
                    { slot: "material", id: "dragon_scale" },
                    { slot: "material", id: "dragon_scale" },
                ],
            },
        },
    },
    CHEST_IMPERIAL: {
        name: "Coffre Impérial",
        assetPath: "procedural",
        texts: ["Le sceau impérial scelle ce coffre."],
        metadata: {
            reward: {
                items: [
                    { slot: "material", id: "imperial_steel" },
                    { slot: "material", id: "imperial_steel" },
                    { slot: "material", id: "imperial_steel" },
                ],
            },
        },
    },
    CORPSE: {
        name: "...",
        assetPath: "procedural",
        texts: [
            "The armor is still warm, as if he died only a moment ago.",
            "Etched on the chest plate, the name 'Valerius' is barely visible.",
            "He was a traveler like you, someone who dared to dream of the surface.",
            "He didn't make it, but his struggle is now your legacy.",
            "[Press E to open inventory and equip your new gear]",
        ],
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
