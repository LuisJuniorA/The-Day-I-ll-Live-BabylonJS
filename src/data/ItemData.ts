import { ItemType, type Item } from "../core/types/Items";

export const ItemData: Record<string, Item> = {
    // --- CURRENCY ---
    gold_coin: {
        id: "gold_coin",
        name: "Fragment d'espoir",
        description:
            "Un vestige d'un monde délabré. Cette monnaie permet d'échanger l'essence des ombres contre de quoi tenir un jour de plus.",
        iconPath: "/assets/ui/icons/gold_coin.png",
        type: ItemType.CURRENCY,
    },

    // --- MONSTER DROPS (Matériaux Bruts) ---
    despairs_tear: {
        id: "despairs_tear",
        name: "Larme du Désespoir",
        description:
            "Cristallisation d'un cri qui fige l'esprit. Lâchée par les Effrois.",
        iconPath: "/assets/ui/icons/despairs_tear.png",
        type: ItemType.MATERIAL,
    },
    slime_soul: {
        id: "slime_soul",
        name: "Âme de Slime",
        description:
            "Une substance instable prélevée sur des formes inachevées. Elle frémit encore.",
        iconPath: "/assets/ui/icons/slime_soul.png",
        type: ItemType.MATERIAL,
    },

    // --- REFINED MATERIALS (Craftés à la Forge) ---
    imperial_steel: {
        id: "imperial_steel",
        name: "Acier Impérial",
        description:
            "Un métal froid et lourd, forgé à partir d'âmes compressées.",
        iconPath: "/assets/ui/icons/materials/imperial_steel.png",
        type: ItemType.MATERIAL,
    },
    monster_claw: {
        id: "monster_claw",
        name: "Griffe de Prédateur",
        description: "Une pointe acérée qui semble encore chercher une proie.",
        iconPath: "/assets/ui/icons/materials/monster_claw.png",
        type: ItemType.MATERIAL,
    },
    dragon_scale: {
        id: "dragon_scale",
        name: "Écaille de Calamité",
        description:
            "Une plaque protectrice brûlante, issue d'un feu millénaire.",
        iconPath: "/assets/ui/icons/materials/dragon_scale.png",
        type: ItemType.MATERIAL,
    },
    dark_feather: {
        id: "dark_feather",
        name: "Plume d'Ébène",
        description:
            "Une plume plus lourde que le plomb qui absorbe la lumière.",
        iconPath: "/assets/ui/icons/materials/dark_feather.png",
        type: ItemType.MATERIAL,
    },
    obsidian_shard: {
        id: "obsidian_shard",
        name: "Éclat d'Obsidienne",
        description:
            "Verre volcanique capable de trancher les ombres elles-mêmes.",
        iconPath: "/assets/ui/icons/materials/obsidian_shard.png",
        type: ItemType.MATERIAL,
    },
    mystic_jade: {
        id: "mystic_jade",
        name: "Jade Onirique",
        description:
            "Une pierre verte qui semble contenir des paysages en mouvement.",
        iconPath: "/assets/ui/icons/materials/mystic_jade.png",
        type: ItemType.MATERIAL,
    },
};
