import { ItemType, type Item } from "../core/types/Items";

export const ItemData: Record<string, Item> = {
    gold_coin: {
        id: "gold_coin",
        name: "Fragment d'espoir",
        description:
            "Un vestige d'un monde délabré. Cette monnaie n'achète pas la vie, mais elle permet d'échanger l'essence des ombres contre de quoi tenir un jour de plus dans ce silence épais.",
        iconPath: "assets/ui/icons/gold_coin.png",
        type: ItemType.CURRENCY,
    },
    despairs_tear: {
        id: "despairs_tear",
        name: "Larme du Désespoir",
        description:
            "Cristallisation d'un cri qui fige l'esprit. Ces larmes sont lâchées par les Effrois, ces êtres avides qui guettent dans l'ombre pour consumer votre lumière. Elles portent en elles l'écho d'une chute brutale dans la crevasse.",
        iconPath: "assets/ui/icons/despairs_tear.png",
        type: ItemType.MATERIAL,
    },
    slime_soul: {
        id: "slime_soul",
        name: "Âme de Slime",
        description:
            "Une substance instable prélevée sur des formes humanoïdes inachevées. C'est une matière chaotique qui hésite entre plusieurs formes, cherchant désespérément à être comprise. Elle frémit encore, comme si elle tentait de mimer un battement de cœur.",
        iconPath: "assets/ui/icons/slime_soul.png",
        type: ItemType.MATERIAL,
    },
};
