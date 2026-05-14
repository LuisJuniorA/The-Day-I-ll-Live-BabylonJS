import { Rectangle, Image, TextBlock, Control } from "@babylonjs/gui";
import type { ShopItem } from "../../core/interfaces/ShopEvents";

export class ItemSlotComponent extends Rectangle {
    private _icon?: Image;
    private _priceText?: TextBlock;
    private _equippedBadge?: Rectangle; // Nouveau : Badge visuel
    public itemData: ShopItem | null;
    private readonly LORE_FONT = "Georgia, 'Times New Roman', serif";

    // Couleurs réutilisables
    private readonly COLOR_EQUIPPED = "rgba(46, 204, 113, 0.8)"; // Vert émeraude

    constructor(
        item: ShopItem | null,
        onClick: (item: ShopItem, slot: ItemSlotComponent) => void,
        showPrice: boolean = true,
    ) {
        super(item ? `slot_${item.id}` : "slot_empty");
        this.itemData = item;

        this.width = "100%";
        this.height = "100%";
        this.thickness = 1;
        this.cornerRadius = 8;

        if (!this.itemData) {
            this.background = "rgba(8, 8, 12, 0.2)";
            this.color = "rgba(255, 255, 255, 0.05)";
            this.hoverCursor = "default";
            return;
        }

        this.background = "rgba(8, 8, 12, 0.6)";
        this.color = "rgba(100, 110, 125, 0.15)";
        this.hoverCursor = "pointer";

        // --- Icône ---
        this._icon = new Image(`icon_${this.itemData.id}`, "");
        this._icon.stretch = Image.STRETCH_UNIFORM;
        this._icon.width = "70%";
        this._icon.height = "70%";
        this._icon.alpha = 0.7;
        this.addControl(this._icon);
        this._setImageWithFallback(this._icon, this.itemData.iconPath);

        // --- Badge Équipé (Initialement caché) ---
        this._createEquippedBadge();

        // --- Badge de Prix ---
        if (showPrice && this.itemData.price > 0) {
            this._createPriceBadge();
        }

        // --- Interactions ---
        this._setupInteractions(onClick);
    }

    private _createEquippedBadge(): void {
        this._equippedBadge = new Rectangle("equipped_badge");
        this._equippedBadge.width = "20px";
        this._equippedBadge.height = "20px";
        this._equippedBadge.background = this.COLOR_EQUIPPED;
        this._equippedBadge.thickness = 0;
        this._equippedBadge.cornerRadius = 4;
        this._equippedBadge.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._equippedBadge.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._equippedBadge.top = "4px";
        this._equippedBadge.left = "4px";
        this._equippedBadge.isVisible = false; // Caché par défaut

        const checkText = new TextBlock("E", "E");
        checkText.color = "white";
        checkText.fontSize = 10;
        checkText.fontWeight = "bold";
        this._equippedBadge.addControl(checkText);

        this.addControl(this._equippedBadge);
    }

    private _createPriceBadge(): void {
        this._priceText = new TextBlock(
            `price_${this.itemData!.id}`,
            `${this.itemData!.price}`,
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

    /**
     * Définit si l'item doit apparaître comme équipé
     */
    public setEquipped(isEquipped: boolean): void {
        if (!this.itemData || !this._equippedBadge) return;

        this._equippedBadge.isVisible = isEquipped;

        if (isEquipped) {
            // On donne une lueur ou une bordure spécifique
            this.color = this.COLOR_EQUIPPED;
            this.thickness = 1.2;
        } else {
            this.thickness = 1;
            this.color = "rgba(100, 110, 125, 0.15)";
        }
    }

    public setSelected(isSelected: boolean): void {
        if (!this.itemData) return;

        // On ne change la couleur de bordure que si l'objet n'est pas déjà "équipé"
        // pour éviter d'écraser le visuel vert de l'équipement
        const isEquipped = this._equippedBadge?.isVisible;

        this.thickness = isSelected ? 2 : 1;

        if (isSelected) {
            this.color = "rgba(220, 230, 255, 0.7)";
            this.background = "rgba(15, 18, 24, 0.95)";
        } else {
            this.color = isEquipped
                ? this.COLOR_EQUIPPED
                : "rgba(100, 110, 125, 0.15)";
            this.background = "rgba(8, 8, 12, 0.6)";
        }

        if (this._icon) this._icon.alpha = isSelected ? 1.0 : 0.7;
    }

    private _setupInteractions(onClick: Function): void {
        this.onPointerEnterObservable.add(() => {
            if (this.itemData) {
                this.background = "rgba(20, 22, 28, 0.8)";
                if (this._icon) this._icon.alpha = 0.9;
            }
        });

        this.onPointerOutObservable.add(() => {
            if (this.itemData) {
                this.background = "rgba(8, 8, 12, 0.6)";
                if (this._icon) this._icon.alpha = 0.7;
            }
        });

        this.onPointerClickObservable.add(() => {
            if (this.itemData) onClick(this.itemData, this);
        });
    }

    private _setImageWithFallback(imageControl: Image, path: string): void {
        const defaultPath = "assets/ui/icons/default.png";
        const imgCheck = new window.Image();
        imgCheck.src = path;
        imgCheck.onload = () => (imageControl.source = path);
        imgCheck.onerror = () => (imageControl.source = defaultPath);
    }
}
