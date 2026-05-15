import { ItemType, type Item } from "../core/types/Items";

export const ItemData: Record<string, Item> = {
    // --- CURRENCY ---
    gold_coin: {
        id: "gold_coin",
        name: "Fragment of Hope",
        description:
            "A remnant from a decaying world. This currency allows you to exchange the essence of shadows for enough strength to last one more day.",
        iconPath: "./assets/ui/icons/gold_coin.png",
        type: ItemType.CURRENCY,
    },

    // --- MONSTER DROPS (Raw Materials) ---
    despairs_tear: {
        id: "despairs_tear",
        name: "Tear of Despair",
        description:
            "A jagged, dark crystal formed from a frozen scream. It pulses with a cold, sorrowful energy. Dropped by Dread-wraiths.",
        iconPath: "./assets/ui/icons/materials/despairs_tear.png",
        type: ItemType.MATERIAL,
    },
    slime_soul: {
        id: "slime_soul",
        name: "Slime Soul",
        description:
            "A translucent, unstable substance harvested from unfinished forms. It still quivers with a faint, rhythmic heartbeat.",
        iconPath: "./assets/ui/icons/materials/slime_soul.png",
        type: ItemType.MATERIAL,
    },

    // --- REFINED MATERIALS (Forged) ---
    imperial_steel: {
        id: "imperial_steel",
        name: "Imperial Steel",
        description:
            "A cold, heavy metal forged from compressed souls. Spectral silver veins trace its matte charcoal surface.",
        iconPath: "./assets/ui/icons/materials/imperial_steel.png",
        type: ItemType.MATERIAL,
    },
    monster_claw: {
        id: "monster_claw",
        name: "Predator's Claw",
        description:
            "A curved, serrated point that seems to vibrate when near living flesh, as if still hunting its next prey.",
        iconPath: "./assets/ui/icons/materials/monster_claw.png",
        type: ItemType.MATERIAL,
    },
    dragon_scale: {
        id: "dragon_scale",
        name: "Calamity Scale",
        description:
            "A thick, hexagonal plate of volcanic stone. Burning orange cracks leak the heat of a thousand-year-old fire.",
        iconPath: "./assets/ui/icons/materials/dragon_scale.png",
        type: ItemType.MATERIAL,
    },
    dark_feather: {
        id: "dark_feather",
        name: "Ebony Feather",
        description:
            "A feather heavier than lead that devours surrounding light. Its pitch-black surface reflects nothing but the void.",
        iconPath: "./assets/ui/icons/materials/dark_feather.png",
        type: ItemType.MATERIAL,
    },
    obsidian_shard: {
        id: "obsidian_shard",
        name: "Obsidian Shard",
        description:
            "Volcanic glass with edges so impossibly thin they can sever shadows and spirits alike.",
        iconPath: "./assets/ui/icons/materials/obsidian_shard.png",
        type: ItemType.MATERIAL,
    },
    mystic_jade: {
        id: "mystic_jade",
        name: "Dreaming Jade",
        description:
            "A polished emerald stone. Deep within its core, misty landscapes and ancient forests seem to shift and move.",
        iconPath: "./assets/ui/icons/materials/mystic_jade.png",
        type: ItemType.MATERIAL,
    },

    // --- CONSUMABLES ---

    // HEALING POTION
    health_potion: {
        id: "health_potion",
        name: "Life Potion",
        description:
            "Instantly restores 50 HP through a surge of vital energy.",
        iconPath: "./assets/ui/icons/utils/health_potion.png",
        type: ItemType.CONSUMABLE,
        effects: [{ type: "heal", value: 50 }],
    },

    // SPEED POTION
    speed_elixir: {
        id: "speed_elixir",
        name: "Elixir of Haste",
        description:
            "Heightens your reflexes, increasing movement speed by 30% for 10 minutes.",
        iconPath: "./assets/ui/icons/utils/speed_elixir.png",
        type: ItemType.CONSUMABLE,
        effects: [{ type: "speed", value: 0.3, duration: 10 * 60 }],
    },

    // COMBAT POTION
    berserker_brew: {
        id: "berserker_brew",
        name: "Berserker's Brew",
        description:
            "A violent concoction that restores 20 HP and boosts damage output by 20% for 1 minute.",
        iconPath: "./assets/ui/icons/utils/berserker_brew.png",
        type: ItemType.CONSUMABLE,
        effects: [
            { type: "heal", value: 20 },
            { type: "damage", value: 0.2, duration: 60 },
        ],
    },
};
