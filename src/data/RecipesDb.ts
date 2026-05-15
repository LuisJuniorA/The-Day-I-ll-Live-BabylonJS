import type { ForgeRecipe } from "../core/interfaces/ForgeEvents";
import type { Item } from "../core/types/Items";

export type RawForgeRecipe = Omit<ForgeRecipe, keyof Item>;

export const RECIPES_DB: Record<string, RawForgeRecipe> = {
    // --- POTIONS (Alchimie de Forge) ---
    health_potion: {
        price: 50,
        requirements: [{ itemId: "slime_soul", amount: 2 }],
    },
    speed_elixir: {
        price: 150,
        requirements: [
            { itemId: "slime_soul", amount: 5 },
            { itemId: "dark_feather", amount: 1 },
        ],
    },
    berserker_brew: {
        price: 300,
        requirements: [
            { itemId: "monster_claw", amount: 1 },
            { itemId: "despairs_tear", amount: 1 },
        ],
    },

    // --- COMPOSANTS AVANCÉS (Transformation) ---
    imperial_steel: {
        price: 200, // Coût de forge
        requirements: [{ itemId: "slime_soul", amount: 10 }],
    },
    monster_claw: {
        price: 300,
        requirements: [{ itemId: "slime_soul", amount: 15 }],
    },
    dragon_scale: {
        price: 500,
        requirements: [{ itemId: "despairs_tear", amount: 4 }],
    },
    dark_feather: {
        price: 400,
        requirements: [{ itemId: "despairs_tear", amount: 2 }],
    },

    // --- DAGUES (Audit : 300g -> 4269g) ---
    fish_knife: {
        price: 300,
        requirements: [{ itemId: "slime_soul", amount: 5 }],
    },
    butcher_dagger: {
        price: 941,
        requirements: [{ itemId: "monster_claw", amount: 2 }],
    },
    noble_dagger: {
        price: 1838,
        requirements: [
            { itemId: "imperial_steel", amount: 2 },
            { itemId: "slime_soul", amount: 10 },
        ],
    },
    hunter_knife: {
        price: 2954,
        requirements: [{ itemId: "monster_claw", amount: 5 }],
    },
    crow_dagger: {
        price: 4269,
        requirements: [{ itemId: "dark_feather", amount: 6 }],
    },

    // --- ÉPÉES (Audit : 300g -> 2954g) ---
    knight_sword: {
        price: 300,
        requirements: [{ itemId: "imperial_steel", amount: 1 }],
    },
    oath_sword: {
        price: 941,
        requirements: [{ itemId: "imperial_steel", amount: 3 }],
    },
    sashimi_sword: {
        price: 1838,
        requirements: [{ itemId: "dark_feather", amount: 4 }],
    },
    scale_sword: {
        price: 2954,
        requirements: [{ itemId: "dragon_scale", amount: 4 }],
    },

    // --- ESPADONS (Audit : 300g -> 1838g) ---
    great_jade_sword: {
        price: 300,
        requirements: [{ itemId: "slime_soul", amount: 25 }],
    },
    great_imperial_sword: {
        price: 941,
        requirements: [{ itemId: "imperial_steel", amount: 4 }],
    },
    great_steel_sword: {
        price: 1838,
        requirements: [
            { itemId: "imperial_steel", amount: 6 },
            { itemId: "monster_claw", amount: 2 },
        ],
    },
};
