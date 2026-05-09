import { Rectangle, Image, TextBlock, Control } from "@babylonjs/gui";

export class RequirementRowComponent extends Rectangle {
    constructor(
        id: string,
        name: string,
        current: number,
        needed: number,
        iconPath: string,
        font: string,
        isCurrency: boolean = false,
    ) {
        super(`req_${id}`);

        const hasEnough = current >= needed;
        const statusColor = hasEnough ? "#2ecc71" : "#ff4757";

        this.height = "35px";
        this.width = "100%";
        this.thickness = 1;
        this.color = "rgba(255,255,255,0.05)";
        this.background = isCurrency
            ? "rgba(255, 215, 0, 0.08)"
            : "rgba(0,0,0,0.2)";
        this.paddingBottom = "4px";

        // Icône
        const iconContainer = new Rectangle("iconContainer");
        iconContainer.width = iconContainer.height = "27px";
        iconContainer.thickness = 1;
        iconContainer.color = isCurrency ? "#FFD700" : "rgba(255,255,255,0.1)";
        iconContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        iconContainer.left = "4px";
        this.addControl(iconContainer);

        const icon = new Image("icon", iconPath);
        icon.stretch = Image.STRETCH_UNIFORM;
        iconContainer.addControl(icon);

        // Nom
        const nameText = new TextBlock(
            "name",
            name.replace(/_/g, " ").toUpperCase(),
        );
        nameText.color = isCurrency ? "#FFD700" : "rgba(255,255,255,0.8)";
        nameText.fontSize = 12;
        nameText.fontFamily = font;
        nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        nameText.paddingLeft = "40px";
        this.addControl(nameText);

        // Quantité (Owned/Needed)
        const countText = new TextBlock("count", `${current}/${needed}`);
        countText.color = statusColor;
        countText.fontSize = 13;
        countText.fontWeight = "bold";
        countText.fontFamily = "monospace";
        countText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        countText.paddingRight = "10px";
        this.addControl(countText);
    }
}
