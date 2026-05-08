import {
    Rectangle,
    TextBlock,
    Control,
    Image,
    ScrollViewer,
    AdvancedDynamicTexture,
    Button,
    Grid,
} from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { OnOpenShop, type ShopItem } from "../../core/interfaces/ShopEvents";
import { ItemSlotComponent } from "../components/ItemSlotComponent";
import { Observable } from "@babylonjs/core";

export class ShopView extends BaseView {
    private readonly COLUMNS_COUNT = 5;

    private _mainContainer!: Rectangle;
    private _itemGrid!: Grid;

    private _detailName!: TextBlock;
    private _detailIcon!: Image;
    private _detailDesc!: TextBlock;
    private _detailPrice!: TextBlock;
    private _buyButton!: Button;

    private _slots: ItemSlotComponent[] = [];
    private _selectedItem: ShopItem | null = null;
    public onBackObservable = new Observable<void>();

    // Police Lore plus affirmée
    private readonly LORE_FONT = "Georgia, 'Times New Roman', serif";

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "ShopView");
        this.buildUI();
        this.hide();

        OnOpenShop.add((data) => {
            this.populateShop(data.inventory);
            this.show();
        });
    }

    protected buildUI(): void {
        this.rootContainer.background = "rgba(0,0,0,0.6)";

        this._mainContainer = new Rectangle("ShopContainer");
        this._mainContainer.width = "90%";
        this._mainContainer.height = "85%";
        this._mainContainer.thickness = 0;
        this.rootContainer.addControl(this._mainContainer);

        // Panel GAUCHE (Inventaire)
        const leftPanel = new Rectangle("LeftPanel");
        leftPanel.width = "63%"; // Un peu réduit pour donner plus d'espace aux détails
        leftPanel.height = "100%";
        leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftPanel.background = "rgba(10, 10, 14, 0.7)";
        leftPanel.color = "rgba(255, 255, 255, 0.1)";
        leftPanel.thickness = 1;
        this._mainContainer.addControl(leftPanel);

        const scrollViewer = new ScrollViewer("InventoryScroll");
        scrollViewer.width = "96%";
        scrollViewer.height = "94%";
        scrollViewer.thickness = 0;
        scrollViewer.forceVerticalBar = false;
        scrollViewer.forceHorizontalBar = false;
        leftPanel.addControl(scrollViewer);

        this._itemGrid = new Grid("ItemGrid");
        this._itemGrid.width = "100%";
        for (let i = 0; i < this.COLUMNS_COUNT; i++) {
            this._itemGrid.addColumnDefinition(1 / this.COLUMNS_COUNT, false);
        }
        scrollViewer.addControl(this._itemGrid);

        // Panel DROITE (Détails)
        const rightPanel = new Rectangle("RightPanel");
        rightPanel.width = "35%";
        rightPanel.height = "100%";
        rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.background = "rgba(15, 15, 20, 0.8)";
        rightPanel.color = "rgba(255, 255, 255, 0.1)";
        rightPanel.thickness = 1;
        // Padding global pour le panneau de détails
        rightPanel.paddingLeft = "25px";
        rightPanel.paddingRight = "25px";
        this._mainContainer.addControl(rightPanel);

        this._buildDetailsPanel(rightPanel);

        // --- BOUTON FERMER (Positionnement Relatif) ---
        const buttonWidthPercent = 0.05; // 5% de la largeur du container
        const screenRatio = 16 / 9; // Ratio standard 1920x1080
        const containerWidthFactor = 0.9;
        const containerHeightFactor = 0.85;

        // Calcul du ratio interne du container (Largeur px / Hauteur px)
        const internalRatio =
            (screenRatio * containerWidthFactor) / containerHeightFactor;

        const closeBtn = Button.CreateSimpleButton("CloseBtn", "X");

        // Largeur en %
        closeBtn.width = buttonWidthPercent * 50 + "%";

        // Hauteur corrigée pour rester 1:1 (Carré)
        closeBtn.height = buttonWidthPercent * internalRatio * 50 + "%";

        // Style & Font
        closeBtn.fontFamily = this.LORE_FONT;
        closeBtn.fontSize = "3%";
        closeBtn.background = "rgba(180, 30, 30, 0.8)";
        closeBtn.color = "white";
        closeBtn.thickness = 1;

        // Positionnement relatif
        closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        closeBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        closeBtn.top = "2%";
        closeBtn.left = "-2.5%"; // Un peu plus de marge à droite

        closeBtn.onPointerUpObservable.add(() => {
            this.hide();
            this.onBackObservable.notifyObservers();
        });

        this._mainContainer.addControl(closeBtn);
    }

    private _buildDetailsPanel(container: Rectangle): void {
        // --- 1. TITRE (En haut, aligné gauche, padding interne) ---
        this._detailName = new TextBlock("DetailName", "");
        this._detailName.fontFamily = this.LORE_FONT;
        this._detailName.color = "white";
        this._detailName.fontSize = 28;
        this._detailName.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailName.height = "60px";
        this._detailName.paddingLeft = "20px"; // Padding sur le texte uniquement
        this._detailName.paddingTop = "10px";
        container.addControl(this._detailName);

        // --- 2. CADRE DE L'IMAGE (Prend toute la largeur du panel) ---
        const iconBox = new Rectangle("IconBox");
        iconBox.width = "100%";
        iconBox.height = "280px";
        iconBox.top = "70px";
        iconBox.thickness = 0;
        iconBox.background = "rgba(0, 0, 0, 0.4)";
        iconBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(iconBox);

        this._detailIcon = new Image("DetailIcon", "");
        this._detailIcon.stretch = Image.STRETCH_UNIFORM;
        this._detailIcon.width = "90%";
        iconBox.addControl(this._detailIcon);

        // --- 3. PRIX (Juste sous l'image, padding gauche) ---
        this._detailPrice = new TextBlock("DetailPrice", "");
        this._detailPrice.top = "360px";
        this._detailPrice.height = "40px";
        this._detailPrice.fontFamily = this.LORE_FONT;
        this._detailPrice.color = "#FFD700";
        this._detailPrice.fontSize = 24;
        this._detailPrice.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._detailPrice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailPrice.paddingLeft = "20px";
        container.addControl(this._detailPrice);

        // --- 4. DESCRIPTION / LORE (Optimisé pour un rendu "Bloc") ---
        this._detailDesc = new TextBlock("DetailDesc", "");
        this._detailDesc.width = "100%";
        this._detailDesc.textWrapping = true;
        this._detailDesc.fontFamily = this.LORE_FONT;
        this._detailDesc.color = "rgba(255, 255, 255, 0.7)";
        this._detailDesc.fontSize = 20;
        this._detailDesc.lineSpacing = "6px"; // Augmenté pour l'élégance

        // LE SECRET : On aligne à gauche pour avoir un bord droit (bord gauche du texte)
        // Le bord droit restera irrégulier (c'est une limite de Babylon),
        // mais c'est bien plus lisible que le centré.
        this._detailDesc.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailDesc.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        // On équilibre avec des paddings identiques pour centrer le bloc de texte
        this._detailDesc.paddingLeft = "30px";
        this._detailDesc.paddingRight = "30px";

        this._detailDesc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailDesc.top = "420px"; // Ajusté pour être sous le prix (360px + 60px)
        container.addControl(this._detailDesc);

        // --- 5. BOUTON ÉCHANGER (Ancré en bas, pleine largeur) ---
        this._buyButton = Button.CreateSimpleButton("BuyBtn", "ÉCHANGER");
        this._buyButton.width = "100%";
        this._buyButton.height = "70px";
        this._buyButton.background = "#1a472a";
        this._buyButton.color = "white";
        this._buyButton.thickness = 1;
        this._buyButton.cornerRadius = 0;
        this._buyButton.fontFamily = this.LORE_FONT;
        this._buyButton.fontSize = 22;
        this._buyButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

        this._buyButton.onPointerEnterObservable.add(
            () => (this._buyButton.background = "#2d7a48"),
        );
        this._buyButton.onPointerOutObservable.add(
            () => (this._buyButton.background = "#1a472a"),
        );

        container.addControl(this._buyButton);
    }

    public populateShop(inventory: ShopItem[]): void {
        this._itemGrid.clearControls();
        while (this._itemGrid.rowCount > 0)
            this._itemGrid.removeRowDefinition(0);
        this._slots = [];

        const rowCount = Math.ceil(inventory.length / this.COLUMNS_COUNT);
        for (let i = 0; i < rowCount; i++) {
            this._itemGrid.addRowDefinition(160, true);
        }

        inventory.forEach((item, index) => {
            const slot = new ItemSlotComponent(item, (cItem, cSlot) =>
                this.selectItem(cItem, cSlot),
            );
            this._itemGrid.addControl(
                slot,
                Math.floor(index / this.COLUMNS_COUNT),
                index % this.COLUMNS_COUNT,
            );
            this._slots.push(slot);
        });

        if (this._slots.length > 0)
            this.selectItem(this._slots[0].itemData, this._slots[0]);
    }

    private selectItem(item: ShopItem, slot: ItemSlotComponent): void {
        this._selectedItem = item;
        this._slots.forEach((s) => s.setSelected(false));
        slot.setSelected(true);

        this._detailName.text = item.name.toUpperCase();
        this._detailDesc.text = item.description;
        this._detailPrice.text = `${item.price} FRAGMENTS`;

        // Gestion de l'icône avec fallback
        this._detailIcon.source = item.iconPath;
        const imgCheck = new window.Image();
        imgCheck.src = item.iconPath;
        imgCheck.onerror = () =>
            (this._detailIcon.source = "assets/ui/icons/default.png");
    }
}
