import type { ForgeRecipe } from "../core/interfaces/ForgeEvents";
import type { Item } from "../core/types/Items";

export type RawForgeRecipe = Omit<ForgeRecipe, keyof Item>;

export const RECIPES_DB: Record<string, RawForgeRecipe> = {
    // ==========================================
    // MATERIAL REFINING (Transformation)
    // ==========================================
    imperial_steel: {
        price: 100,
        requirements: [
            { itemId: "slime_soul", amount: 8 },
            { itemId: "despairs_tear", amount: 1 },
        ],
    },
    monster_claw: {
        price: 150,
        requirements: [{ itemId: "slime_soul", amount: 12 }],
    },
    dragon_scale: {
        price: 300,
        requirements: [{ itemId: "despairs_tear", amount: 8 }],
    },
    dark_feather: {
        price: 200,
        requirements: [
            { itemId: "slime_soul", amount: 5 },
            { itemId: "despairs_tear", amount: 3 },
        ],
    },

    // ==========================================
    // DAGGERS
    // ==========================================
    knife: {
        price: 50,
        requirements: [{ itemId: "slime_soul", amount: 2 }],
    },
    fish_knife: {
        price: 80,
        requirements: [{ itemId: "slime_soul", amount: 4 }],
    },
    butcher_dagger: {
        price: 150,
        requirements: [
            { itemId: "slime_soul", amount: 6 },
            { itemId: "despairs_tear", amount: 1 },
        ],
    },
    noble_dagger: {
        price: 300,
        requirements: [
            { itemId: "despairs_tear", amount: 3 },
            { itemId: "imperial_steel", amount: 1 },
        ],
    },
    hunter_knife: {
        price: 450,
        requirements: [
            { itemId: "despairs_tear", amount: 5 },
            { itemId: "monster_claw", amount: 2 },
        ],
    },

    // ==========================================
    // SWORDS
    // ==========================================
    knight_sword: {
        price: 400,
        requirements: [
            { itemId: "despairs_tear", amount: 5 },
            { itemId: "imperial_steel", amount: 2 },
        ],
    },
    scale_sword: {
        price: 550,
        requirements: [
            { itemId: "despairs_tear", amount: 6 },
            { itemId: "dragon_scale", amount: 3 },
        ],
    },
    oath_sword: {
        price: 750,
        requirements: [
            { itemId: "imperial_steel", amount: 5 },
            { itemId: "despairs_tear", amount: 10 },
        ],
    },

    // ==========================================
    // GREAT SWORDS
    // ==========================================
    great_steel_sword: {
        price: 800,
        requirements: [
            { itemId: "imperial_steel", amount: 8 },
            { itemId: "despairs_tear", amount: 15 },
        ],
    },
    great_jade_sword: {
        price: 1500,
        requirements: [
            { itemId: "despairs_tear", amount: 30 },
            { itemId: "slime_soul", amount: 40 },
        ],
    },
};
