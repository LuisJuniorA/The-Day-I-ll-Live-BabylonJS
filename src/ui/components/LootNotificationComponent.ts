import {
    Rectangle,
    StackPanel,
    TextBlock,
    Image,
    Control,
} from "@babylonjs/gui";
import type { Item } from "../../core/types/Items";

export class LootNotificationComponent extends Rectangle {
    constructor(item: Item, amount: number) {
        super(`LootNotify_${item.id}_${Date.now()}`);

        // --- Layout du Rectangle Principal ---
        this.height = "40px";
        this.width = "240px";
        this.thickness = 0;
        this.background = "rgba(0, 0, 0, 0.6)";
        this.cornerRadius = 4;

        // On l'aligne à droite à l'intérieur du StackPanel
        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;

        // Astuce pour la marge : On utilise paddingRight et paddingTop
        // pour espacer l'élément des bords et des autres voisins
        this.paddingRight = "10px";
        this.paddingTop = "5px";

        // --- Conteneur de contenu ---
        const content = new StackPanel("Content");
        content.isVertical = false; // Mode horizontal
        content.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.addControl(content);

        // 1. Icône
        const icon = new Image("icon", item.iconPath);
        icon.width = "28px";
        icon.height = "28px";
        icon.paddingLeft = "8px"; // Espacement interne gauche
        // Correction de l'écrasement :
        icon.stretch = Image.STRETCH_UNIFORM;
        content.addControl(icon);

        // 2. Quantité en VERT
        const qtyText = new TextBlock("qty", `+${amount}`);
        qtyText.color = "#2ecc71"; // Vert flashy
        qtyText.fontWeight = "bold";
        qtyText.fontSize = 16;
        qtyText.width = "45px";
        qtyText.paddingLeft = "5px";
        content.addControl(qtyText);

        // 3. Nom de l'item
        const nameText = new TextBlock("name", item.name.toUpperCase());
        nameText.color = "white";
        nameText.fontSize = 13;
        nameText.width = "140px";
        nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        content.addControl(nameText);
    }
}
