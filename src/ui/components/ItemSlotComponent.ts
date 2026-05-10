import { Rectangle, Image, TextBlock, Control } from "@babylonjs/gui";
import type { ShopItem } from "../../core/interfaces/ShopEvents";

export class ItemSlotComponent extends Rectangle {
    private _icon?: Image;
    private _priceText?: TextBlock;
    public itemData: ShopItem | null;
    private readonly LORE_FONT = "Georgia, 'Times New Roman', serif";

    constructor(
        item: ShopItem | null,
        onClick: (item: ShopItem, slot: ItemSlotComponent) => void,
        showPrice: boolean = true, // Par défaut à true pour le Shop
    ) {
        super(item ? `slot_${item.id}` : "slot_empty");
        this.itemData = item;

        // --- Style de base ---
        this.width = "100%";
        this.height = "100%";
        this.thickness = 1;
        this.cornerRadius = 8;

        this.paddingLeft = "0px";
        this.paddingRight = "0px";
        this.paddingTop = "0px";
        this.paddingBottom = "0px";

        if (!this.itemData) {
            this.background = "rgba(8, 8, 12, 0.2)";
            this.color = "rgba(255, 255, 255, 0.05)";
            this.hoverCursor = "default";
            return;
        }

        // --- Style avec Item ---
        this.background = "rgba(8, 8, 12, 0.6)";
        this.color = "rgba(100, 110, 125, 0.15)";
        this.hoverCursor = "pointer";

        // --- Icône ---
        this._icon = new Image(`icon_${this.itemData.id}`, "");
        this._icon.stretch = Image.STRETCH_UNIFORM;
        this._icon.width = "70%";
        this._icon.height = "70%";
        this._icon.alpha = 0.7;
        this._icon.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.addControl(this._icon);

        this._setImageWithFallback(this._icon, this.itemData.iconPath);

        // --- Badge de Prix (Conditionnel) ---
        if (showPrice && this.itemData.price > 0) {
            this._priceText = new TextBlock(
                `price_${this.itemData.id}`,
                `${this.itemData.price}`,
            );
            this._priceText.fontFamily = this.LORE_FONT;
            this._priceText.color = "rgba(150, 160, 175, 0.6)";
            this._priceText.fontSize = 12;
            this._priceText.textHorizontalAlignment =
                Control.HORIZONTAL_ALIGNMENT_RIGHT;
            this._priceText.textVerticalAlignment =
                Control.VERTICAL_ALIGNMENT_BOTTOM;
            this._priceText.paddingRight = "6px";
            this._priceText.paddingBottom = "4px";
            this.addControl(this._priceText);
        }

        // --- Interactions ---
        this.onPointerEnterObservable.add(() => {
            if (this.thickness !== 1.5 && this.itemData) {
                this.background = "rgba(20, 22, 28, 0.8)";
                this.color = "rgba(180, 190, 205, 0.4)";
                if (this._icon) this._icon.alpha = 0.9;
            }
        });

        this.onPointerOutObservable.add(() => {
            if (this.thickness !== 1.5 && this.itemData) {
                this.background = "rgba(8, 8, 12, 0.6)";
                this.color = "rgba(100, 110, 125, 0.15)";
                if (this._icon) this._icon.alpha = 0.7;
            }
        });

        this.onPointerClickObservable.add(() => {
            if (this.itemData) {
                onClick(this.itemData, this);
            }
        });
    }

    private _setImageWithFallback(imageControl: Image, path: string): void {
        const defaultPath = "assets/ui/icons/default.png";
        const imgCheck = new window.Image();
        imgCheck.src = path;
        imgCheck.onload = () => {
            imageControl.source = path;
        };
        imgCheck.onerror = () => {
            imageControl.source = defaultPath;
        };
    }

    public setSelected(isSelected: boolean): void {
        if (!this.itemData) return;

        this.color = isSelected
            ? "rgba(220, 230, 255, 0.7)"
            : "rgba(100, 110, 125, 0.15)";
        this.thickness = isSelected ? 1.5 : 1;
        this.background = isSelected
            ? "rgba(15, 18, 24, 0.95)"
            : "rgba(8, 8, 12, 0.6)";

        if (this._icon) this._icon.alpha = isSelected ? 1.0 : 0.7;
        if (this._priceText) {
            this._priceText.color = isSelected
                ? "rgba(200, 210, 225, 0.9)"
                : "rgba(150, 160, 175, 0.6)";
        }
    }
}
