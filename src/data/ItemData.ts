import { ItemType, type Item } from "../core/types/Items";

export const ItemData: Record<string, Item> = {
    gold_coin: {
        id: "gold_coin",
        name: "Pièce d'or",
        description: "Monnaie d'échange universelle.",
        iconPath: "assets/ui/icons/gold_coin.png",
        type: ItemType.CURRENCY,
    },
    despairs_tear: {
        id: "despairs_tear",
        name: "Larme du Désespoir",
        description: "Un cristal sombre lâché par les créatures maudites.",
        iconPath: "assets/ui/icons/despairs_tear.png",
        type: ItemType.MATERIAL,
    },
    slime_gel: {
        id: "slime_gel",
        name: "Gel de Slime",
        description:
            "Une substance gluante et translucide, étrangement malléable.",
        iconPath: "assets/ui/icons/slime_gel.png",
        type: ItemType.MATERIAL,
    },
};
