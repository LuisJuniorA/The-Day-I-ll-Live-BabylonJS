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
import {
    OnOpenShop,
    OnPurchaseRequest,
    type ShopItem,
} from "../../core/interfaces/ShopEvents";
import { ItemSlotComponent } from "../components/ItemSlotComponent";
import { Observable } from "@babylonjs/core";

export class ShopView extends BaseView {
    // --- Configuration ---
    private readonly COLUMNS_COUNT = 5;
    private readonly LORE_FONT = "Georgia, 'Times New Roman', serif";
    private readonly GRID_SPACING = 8;

    // --- UI Elements ---
    private _mainContainer!: Rectangle;
    private _itemGrid!: Grid;
    private _detailName!: TextBlock;
    private _detailIcon!: Image;
    private _detailDesc!: TextBlock;
    private _detailPrice!: TextBlock;
    private _detailOwned!: TextBlock; // <-- NOUVEAU : Texte de possession
    private _buyButton!: Button;
    private _currencyText!: TextBlock;

    // --- State & Logic ---
    private _slots: ItemSlotComponent[] = [];
    private _selectedItem: ShopItem | null = null;
    public onBackObservable = new Observable<void>();

    private _originalPriceLeft: string | null = null;
    private _isAnimatingError: boolean = false;

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

        const leftPanel = this._createLeftPanel();
        const rightPanel = this._createRightPanel();

        this._mainContainer.addControl(leftPanel);
        this._mainContainer.addControl(rightPanel);
    }

    private _createLeftPanel(): Rectangle {
        const leftPanel = new Rectangle("LeftPanel");
        leftPanel.width = "63%";
        leftPanel.height = "100%";
        leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftPanel.background = "rgba(10, 10, 14, 0.7)";
        leftPanel.color = "rgba(255, 255, 255, 0.1)";
        leftPanel.thickness = 1;

        leftPanel.addControl(this._createInventoryScroll());
        leftPanel.addControl(this._createFooter());

        return leftPanel;
    }

    private _createInventoryScroll(): ScrollViewer {
        const scrollViewer = new ScrollViewer("InventoryScroll");
        scrollViewer.width = "100%";
        scrollViewer.height = "90%";
        scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        scrollViewer.thickness = 0;
        scrollViewer.forceVerticalBar = false;

        scrollViewer.paddingLeft = "20px";
        scrollViewer.paddingRight = "20px";
        scrollViewer.paddingTop = "20px";
        scrollViewer.paddingBottom = "20px";

        this._itemGrid = new Grid("ItemGrid");
        this._itemGrid.width = "100%";
        this._itemGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        this._itemGrid.paddingLeft = this.GRID_SPACING;
        this._itemGrid.paddingRight = this.GRID_SPACING;
        this._itemGrid.paddingTop = this.GRID_SPACING;
        this._itemGrid.paddingBottom = this.GRID_SPACING;

        for (let i = 0; i < this.COLUMNS_COUNT; i++) {
            this._itemGrid.addColumnDefinition(1 / this.COLUMNS_COUNT, false);
        }

        scrollViewer.addControl(this._itemGrid);
        return scrollViewer;
    }

    private _createFooter(): Rectangle {
        const footer = new Rectangle("InventoryFooter");
        footer.width = "100%";
        footer.height = "10%";
        footer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        footer.background = "rgba(0, 0, 0, 0.4)";
        footer.thickness = 0;

        this._currencyText = new TextBlock("CurrencyText", "0 FRAGMENTS");
        this._currencyText.fontFamily = this.LORE_FONT;
        this._currencyText.color = "#FFD700";
        this._currencyText.fontSize = "22px";
        this._currencyText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._currencyText.paddingRight = "30px";

        footer.addControl(this._currencyText);
        return footer;
    }

    private _createRightPanel(): Rectangle {
        const rightPanel = new Rectangle("RightPanel");
        rightPanel.width = "35%";
        rightPanel.height = "100%";
        rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.background = "rgba(15, 15, 20, 0.8)";
        rightPanel.color = "rgba(255, 255, 255, 0.1)";
        rightPanel.thickness = 1;
        rightPanel.paddingLeft = "25px";
        rightPanel.paddingRight = "25px";

        this._buildDetailsPanel(rightPanel);
        return rightPanel;
    }

    private _buildDetailsPanel(container: Rectangle): void {
        // 1. Info de possession (Tout en haut à droite désormais)
        this._detailOwned = new TextBlock("DetailOwned", "EN POSSESSION : 0");
        this._detailOwned.fontFamily = this.LORE_FONT;
        this._detailOwned.color = "rgba(255, 255, 255, 0.5)"; // Légèrement plus brillant
        this._detailOwned.fontSize = 16;
        this._detailOwned.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._detailOwned.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailOwned.height = "40px";
        this._detailOwned.paddingRight = "20px";
        this._detailOwned.top = "20px";
        container.addControl(this._detailOwned);

        // 2. Nom de l'item (Un peu plus bas)
        this._detailName = new TextBlock("DetailName", "");
        this._detailName.fontFamily = this.LORE_FONT;
        this._detailName.color = "white";
        this._detailName.fontSize = 26;
        this._detailName.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailName.height = "50px";
        this._detailName.top = "10px"; // Laisse de la place au dessus
        this._detailName.paddingLeft = "20px";
        container.addControl(this._detailName);

        // 3. Icon Box
        const iconBox = new Rectangle("IconBox");
        iconBox.width = "100%";
        iconBox.height = "280px";
        iconBox.top = "90px"; // Décalé vers le bas
        iconBox.paddingRight = "20px";
        iconBox.paddingLeft = "20px";
        iconBox.thickness = 0;
        iconBox.background = "rgba(0, 0, 0, 0.4)";
        iconBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(iconBox);

        this._detailIcon = new Image("DetailIcon", "");
        this._detailIcon.stretch = Image.STRETCH_UNIFORM;
        this._detailIcon.width = "85%";
        iconBox.addControl(this._detailIcon);

        // 4. Prix
        this._detailPrice = new TextBlock("DetailPrice", "");
        this._detailPrice.top = "380px";
        this._detailPrice.height = "40px";
        this._detailPrice.fontFamily = this.LORE_FONT;
        this._detailPrice.color = "#FFD700";
        this._detailPrice.fontSize = 24;
        this._detailPrice.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._detailPrice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(this._detailPrice);

        // 5. Description
        this._detailDesc = new TextBlock("DetailDesc", "");
        this._detailDesc.width = "100%";
        this._detailDesc.textWrapping = true;
        this._detailDesc.fontFamily = this.LORE_FONT;
        this._detailDesc.color = "rgba(255, 255, 255, 0.7)";
        this._detailDesc.fontSize = 18;
        this._detailDesc.lineSpacing = "4px";
        this._detailDesc.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailDesc.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailDesc.paddingLeft = "20px";
        this._detailDesc.paddingRight = "20px";
        this._detailDesc.top = "430px";
        container.addControl(this._detailDesc);

        // 6. Bouton d'achat (En bas)
        this._buyButton = Button.CreateSimpleButton("BuyBtn", "ÉCHANGER");
        this._buyButton.width = "100%";
        this._buyButton.height = "60px";
        this._buyButton.background = "#1a472a";
        this._buyButton.color = "white";
        this._buyButton.cornerRadius = 0;
        this._buyButton.fontFamily = this.LORE_FONT;
        this._buyButton.fontSize = 20;
        this._buyButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._buyButton.onPointerUpObservable.add(() => {
            if (this._selectedItem)
                OnPurchaseRequest.notifyObservers(this._selectedItem);
        });
        container.addControl(this._buyButton);

        // --- LA CROIX DE FERMETURE (Maintenant au dessus du bouton) ---
        const closeBtn = Button.CreateSimpleButton(
            "CloseBtn",
            "ANNULER / QUITTER",
        );
        closeBtn.width = "100%";
        closeBtn.height = "30px";
        closeBtn.color = "rgba(255, 255, 255, 0.3)";
        closeBtn.thickness = 1;
        closeBtn.fontFamily = this.LORE_FONT;
        closeBtn.fontSize = 14;
        closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.top = "-70px"; // Juste au dessus du bouton Échanger

        closeBtn.onPointerEnterObservable.add(() => (closeBtn.color = "white"));
        closeBtn.onPointerOutObservable.add(
            () => (closeBtn.color = "rgba(255, 255, 255, 0.3)"),
        );
        closeBtn.onPointerUpObservable.add(() => {
            this.hide();
            this.onBackObservable.notifyObservers();
        });
        container.addControl(closeBtn);
    }

    public updateCurrencyDisplay(amount: number): void {
        if (this._currencyText) {
            this._currencyText.text = `${amount} FRAGMENTS`;
        }
    }

    public playBuySuccessAnimation(): void {
        this._flashPrice();
        const originalBg = "#1a472a";
        this._buyButton.background = "#2ecc71";
        this._buyButton.scaleX = 0.95;
        this._buyButton.scaleY = 0.95;

        setTimeout(() => {
            this._buyButton.background = originalBg;
            this._buyButton.scaleX = 1.0;
            this._buyButton.scaleY = 1.0;

            if (this._buyButton.textBlock) {
                const oldText = this._buyButton.textBlock.text;
                this._buyButton.textBlock.text = "ACQUIS !";
                this._buyButton.textBlock.color = "#FFD700";
                setTimeout(() => {
                    if (this._buyButton.textBlock) {
                        this._buyButton.textBlock.text = oldText;
                        this._buyButton.textBlock.color = "white";
                    }
                }, 1000);
            }
        }, 150);
    }

    public playBuyErrorAnimation(): void {
        if (this._isAnimatingError) return;
        this._isAnimatingError = true;

        if (this._originalPriceLeft === null)
            this._originalPriceLeft = this._detailPrice.left as string;

        const errorColor = "#ff4757";
        const originalPriceColor = "#FFD700";
        const originalBtnColor = "#1a472a";

        this._buyButton.isEnabled = false;
        this._detailPrice.color = errorColor;
        this._buyButton.background = errorColor;
        if (this._buyButton.textBlock)
            this._buyButton.textBlock.text = "FONDS INSUFFISANTS";

        const baseLeft = parseFloat(this._originalPriceLeft);
        const shake = (offset: number) => {
            this._detailPrice.left = baseLeft + offset + "px";
            this._buyButton.left = offset + "px";
        };

        setTimeout(() => shake(10), 50);
        setTimeout(() => shake(-10), 100);
        setTimeout(() => shake(10), 150);
        setTimeout(() => shake(0), 200);

        setTimeout(() => {
            this._detailPrice.color = originalPriceColor;
            this._buyButton.background = originalBtnColor;
            this._detailPrice.left = this._originalPriceLeft!;
            this._buyButton.left = "0px";
            if (this._buyButton.textBlock)
                this._buyButton.textBlock.text = "ÉCHANGER";
            this._buyButton.isEnabled = true;
            this._isAnimatingError = false;
        }, 1800);
    }

    private _flashPrice(): void {
        const originalColor = "#FFD700";
        this._detailPrice.color = "white";
        this._detailPrice.fontSize = 28;
        setTimeout(() => {
            this._detailPrice.color = originalColor;
            this._detailPrice.fontSize = 24;
        }, 200);
    }

    public populateShop(inventory: ShopItem[]): void {
        this._itemGrid.clearControls();
        while (this._itemGrid.rowCount > 0)
            this._itemGrid.removeRowDefinition(0);
        this._slots = [];

        const MIN_SLOTS = 20;
        const totalSlotsToDisplay = Math.max(inventory.length, MIN_SLOTS);
        const rowCount = Math.ceil(totalSlotsToDisplay / this.COLUMNS_COUNT);

        const engine = this.advancedTexture.getScene()?.getEngine();
        const canvasWidth = engine ? engine.getRenderWidth() : 1920;
        const leftPanelWidth = canvasWidth * 0.9 * 0.63;

        const availableWidth = leftPanelWidth - 40;
        const cellWidth =
            availableWidth / this.COLUMNS_COUNT - this.GRID_SPACING * 2;
        const squareHeight = cellWidth;

        for (let i = 0; i < rowCount; i++) {
            this._itemGrid.addRowDefinition(squareHeight, true);
        }

        const totalGridHeight =
            (squareHeight + this.GRID_SPACING * 2) * rowCount;
        this._itemGrid.height = `${totalGridHeight}px`;

        for (let index = 0; index < totalSlotsToDisplay; index++) {
            const item = inventory[index] || null;

            const slot = new ItemSlotComponent(item, (cItem, cSlot) =>
                this.selectItem(cItem, cSlot),
            );

            slot.paddingLeft = this.GRID_SPACING;
            slot.paddingRight = this.GRID_SPACING;
            slot.paddingTop = this.GRID_SPACING;
            slot.paddingBottom = this.GRID_SPACING;

            this._itemGrid.addControl(
                slot,
                Math.floor(index / this.COLUMNS_COUNT),
                index % this.COLUMNS_COUNT,
            );

            if (item) this._slots.push(slot);
        }

        if (this._slots.length > 0) {
            this.selectItem(this._slots[0].itemData!, this._slots[0]);
        }
    }

    private selectItem(item: ShopItem, slot: ItemSlotComponent): void {
        this._selectedItem = item;
        this._slots.forEach((s) => s.setSelected(false));
        slot.setSelected(true);

        this._detailName.text = item.name.toUpperCase();
        this._detailDesc.text = item.description;
        this._detailPrice.text = `${item.price} FRAGMENTS`;

        // Mise à jour de la possession
        // On suppose que l'interface ShopItem contient un champ 'ownedCount' ou similaire
        // Si ce n'est pas le cas, remplace item.ownedCount par la donnée de ton choix
        const count = (item as any).ownedCount ?? 0;
        this._detailOwned.text = `EN POSSESSION : ${count}`;

        this._detailIcon.source = item.iconPath;
        const imgCheck = new window.Image();
        imgCheck.src = item.iconPath;
        imgCheck.onerror = () =>
            (this._detailIcon.source = "assets/ui/icons/default.png");
    }
}
