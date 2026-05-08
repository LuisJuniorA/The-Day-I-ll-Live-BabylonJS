import { Rectangle, Image, TextBlock, Control } from "@babylonjs/gui";
import type { ShopItem } from "../../core/interfaces/ShopEvents";

export class ItemSlotComponent extends Rectangle {
    private _icon: Image;
    private _priceText?: TextBlock;
    public itemData: ShopItem;
    private readonly LORE_FONT = "Georgia, 'Times New Roman', serif";

    constructor(
        item: ShopItem,
        onClick: (item: ShopItem, slot: ItemSlotComponent) => void,
    ) {
        super(`slot_${item.id}`);
        this.itemData = item;

        // --- Style du Slot (Adaptatif) ---
        this.width = "95%"; // Prend presque toute la largeur de sa cellule de grille
        this.height = "95%"; // Prend presque toute la hauteur
        this.background = "rgba(8, 8, 12, 0.6)";
        this.color = "rgba(100, 110, 125, 0.15)";
        this.thickness = 1;
        // ... le reste du code reste identique ...
        this.cornerRadius = 2; // Moins rond, plus usé
        this.hoverCursor = "pointer";
        this.paddingLeft = "4px";
        this.paddingRight = "4px";
        this.paddingTop = "4px";
        this.paddingBottom = "4px";

        // --- Icône ---
        this._icon = new Image(`icon_${item.id}`, "");
        this._icon.stretch = Image.STRETCH_UNIFORM;
        this._icon.width = "70%";
        this._icon.height = "70%";
        // L'icône est un peu transparente par défaut (lumière faible)
        this._icon.alpha = 0.7;
        this._icon.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.addControl(this._icon);

        this._setImageWithFallback(this._icon, item.iconPath);

        // --- Badge de Prix (Discret, spectral) ---
        if (item.price > 0) {
            this._priceText = new TextBlock(
                `price_${item.id}`,
                `${item.price}`,
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

        // --- Interactions (La lueur s'éveille) ---
        this.onPointerEnterObservable.add(() => {
            if (this.thickness !== 1.5) {
                this.background = "rgba(20, 22, 28, 0.8)";
                this.color = "rgba(180, 190, 205, 0.4)";
                this._icon.alpha = 0.9;
            }
        });

        this.onPointerOutObservable.add(() => {
            if (this.thickness !== 1.5) {
                this.background = "rgba(8, 8, 12, 0.6)";
                this.color = "rgba(100, 110, 125, 0.15)";
                this._icon.alpha = 0.7;
            }
        });

        this.onPointerClickObservable.add(() => {
            onClick(this.itemData, this);
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
        // La "lumière" de l'âme se fixe sur l'objet
        this.color = isSelected
            ? "rgba(220, 230, 255, 0.7)"
            : "rgba(100, 110, 125, 0.15)";
        this.thickness = isSelected ? 1.5 : 1; // Reste fin, mais brillant
        this.background = isSelected
            ? "rgba(15, 18, 24, 0.95)"
            : "rgba(8, 8, 12, 0.6)";
        this._icon.alpha = isSelected ? 1.0 : 0.7; // Révèle sa vraie forme

        if (this._priceText) {
            this._priceText.color = isSelected
                ? "rgba(200, 210, 225, 0.9)"
                : "rgba(150, 160, 175, 0.6)";
        }
    }
}
