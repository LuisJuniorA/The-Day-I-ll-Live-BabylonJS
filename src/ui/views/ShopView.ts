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
    // --- Configuration Thème ---
    private readonly COLOR_OVERLAY = "rgba(0,0,0,0.6)";
    private readonly COLOR_LEFT_PANEL_BG = "rgba(10, 10, 14, 0.7)";
    private readonly COLOR_LEFT_PANEL_BORDER = "rgba(255, 255, 255, 0.1)";
    private readonly COLOR_RIGHT_PANEL_BG = "rgba(15, 15, 20, 0.8)";
    private readonly COLOR_RIGHT_PANEL_BORDER = "rgba(255, 255, 255, 0.1)";
    private readonly COLOR_FOOTER_BG = "rgba(0, 0, 0, 0.4)";
    private readonly COLOR_ICON_BOX_BG = "rgba(0, 0, 0, 0.4)";

    private readonly COLOR_TEXT_MAIN = "white";
    private readonly COLOR_TEXT_SECONDARY = "rgba(255, 255, 255, 0.5)";
    private readonly COLOR_TEXT_MUTED = "#888888";
    private readonly COLOR_TEXT_DESC = "rgba(255, 255, 255, 0.7)";
    private readonly COLOR_TEXT_CURRENCY = "#FFD700";

    private readonly COLOR_BTN_PRIMARY = "#1a472a";
    private readonly COLOR_BTN_SUCCESS = "#2ecc71";
    private readonly COLOR_BTN_ERROR = "#ff4757";
    private readonly COLOR_BTN_CLOSE = "rgba(255, 255, 255, 0.3)";

    private readonly LORE_FONT = "Georgia, 'Times New Roman', serif";

    // --- Configuration Logique ---
    private readonly COLUMNS_COUNT = 5;
    private readonly GRID_SPACING = 8;

    // --- Éléments UI ---
    private _mainContainer!: Rectangle;
    private _itemGrid!: Grid;
    private _detailName!: TextBlock;
    private _detailIcon!: Image;
    private _detailOwned!: TextBlock;
    private _detailDesc!: TextBlock;
    private _buyButton!: Button;
    private _currencyText!: TextBlock;
    private _detailPrice!: TextBlock;

    // --- État & Logique ---
    private _slots: ItemSlotComponent[] = [];
    private _selectedItem: ShopItem | null = null;
    private _isAnimatingError: boolean = false;

    public onBackObservable = new Observable<void>();

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
        this.rootContainer.background = this.COLOR_OVERLAY;
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
        leftPanel.background = this.COLOR_LEFT_PANEL_BG;
        leftPanel.color = this.COLOR_LEFT_PANEL_BORDER;
        leftPanel.thickness = 1;
        leftPanel.addControl(this._createInventoryScroll());
        leftPanel.addControl(this._createFooter());
        return leftPanel;
    }

    private _createInventoryScroll(): ScrollViewer {
        const scrollViewer = new ScrollViewer("ShopScroll");
        scrollViewer.width = "100%";
        scrollViewer.height = "90%";
        scrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        scrollViewer.thickness = 0;
        scrollViewer.forceVerticalBar = false;
        scrollViewer.paddingLeft =
            scrollViewer.paddingRight =
            scrollViewer.paddingTop =
            scrollViewer.paddingBottom =
                "20px";

        this._itemGrid = new Grid("ShopGrid");
        this._itemGrid.width = "100%";
        this._itemGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._itemGrid.paddingLeft =
            this._itemGrid.paddingRight =
            this._itemGrid.paddingTop =
            this._itemGrid.paddingBottom =
                this.GRID_SPACING;

        for (let i = 0; i < this.COLUMNS_COUNT; i++) {
            this._itemGrid.addColumnDefinition(1 / this.COLUMNS_COUNT, false);
        }
        scrollViewer.addControl(this._itemGrid);
        return scrollViewer;
    }

    private _createFooter(): Rectangle {
        const footer = new Rectangle("ShopFooter");
        footer.width = "100%";
        footer.height = "10%";
        footer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        footer.background = this.COLOR_FOOTER_BG;
        footer.thickness = 0;

        this._currencyText = new TextBlock("CurrencyText", "0 FRAGMENTS");
        this._currencyText.fontFamily = this.LORE_FONT;
        this._currencyText.color = this.COLOR_TEXT_CURRENCY;
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
        rightPanel.background = this.COLOR_RIGHT_PANEL_BG;
        rightPanel.color = this.COLOR_RIGHT_PANEL_BORDER;
        rightPanel.thickness = 1;
        rightPanel.paddingLeft = rightPanel.paddingRight = "25px";

        // Layout aéré pour le shop
        this._addHeaderSection(rightPanel, "10px", "50px");
        this._addPreviewSection(rightPanel, "70px", "280px"); // Image plus grande (280px)
        this._addDescriptionSection(rightPanel, "370px", "120px"); // Desc descendue pour laisser la place à l'image
        this._addPriceSection(rightPanel, "530px", "40px");
        this._addActionButtons(rightPanel, "60px", "30px");

        return rightPanel;
    }

    private _addHeaderSection(
        container: Rectangle,
        top: string,
        height: string,
    ): void {
        this._detailOwned = new TextBlock("DetailOwned", "EN POSSESSION : 0");
        this._detailOwned.fontFamily = this.LORE_FONT;
        this._detailOwned.color = this.COLOR_TEXT_SECONDARY;
        this._detailOwned.fontSize = 14;
        this._detailOwned.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._detailOwned.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailOwned.height = height;
        this._detailOwned.top = parseInt(top) + 10 + "px";
        this._detailOwned.paddingRight = "20px";
        container.addControl(this._detailOwned);

        this._detailName = new TextBlock("DetailName", "");
        this._detailName.fontFamily = this.LORE_FONT;
        this._detailName.color = this.COLOR_TEXT_MAIN;
        this._detailName.fontSize = 26;
        this._detailName.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailName.height = height;
        this._detailName.top = top;
        this._detailName.paddingLeft = "20px";
        container.addControl(this._detailName);
    }

    private _addPreviewSection(
        container: Rectangle,
        top: string,
        height: string,
    ): void {
        const iconBox = new Rectangle("IconBox");
        iconBox.width = "100%";
        iconBox.height = height;
        iconBox.top = top;
        iconBox.thickness = 0;
        iconBox.paddingRight = iconBox.paddingLeft = "20px";
        iconBox.background = this.COLOR_ICON_BOX_BG;
        iconBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(iconBox);

        this._detailIcon = new Image("DetailIcon", "");
        this._detailIcon.stretch = Image.STRETCH_UNIFORM;
        this._detailIcon.width = "85%"; // Légèrement plus large pour remplir le box
        iconBox.addControl(this._detailIcon);
    }

    private _addDescriptionSection(
        container: Rectangle,
        top: string,
        height: string,
    ): void {
        const descTitle = new TextBlock("DescTitle", "DESCRIPTION");
        descTitle.fontFamily = this.LORE_FONT;
        descTitle.fontSize = 15;
        descTitle.color = this.COLOR_TEXT_MUTED;
        descTitle.height = "20px";
        descTitle.top = top;
        descTitle.paddingLeft = "20px";
        descTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        descTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.addControl(descTitle);

        this._detailDesc = new TextBlock("DetailDesc", "");
        this._detailDesc.width = "100%";
        this._detailDesc.height = parseInt(height) + "px";
        this._detailDesc.top = parseInt(top) + 25 + "px";
        this._detailDesc.textWrapping = true;
        this._detailDesc.fontFamily = this.LORE_FONT;
        this._detailDesc.color = this.COLOR_TEXT_DESC;
        this._detailDesc.fontSize = 16;
        this._detailDesc.paddingLeft = "35px";
        this._detailDesc.paddingRight = "20px";
        this._detailDesc.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailDesc.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailDesc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(this._detailDesc);
    }

    private _addPriceSection(
        container: Rectangle,
        top: string,
        height: string,
    ): void {
        this._detailPrice = new TextBlock("DetailPrice", "");
        this._detailPrice.top = top;
        this._detailPrice.height = height;
        this._detailPrice.fontFamily = this.LORE_FONT;
        this._detailPrice.color = this.COLOR_TEXT_CURRENCY;
        this._detailPrice.fontSize = 28;
        this._detailPrice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailPrice.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_CENTER;
        container.addControl(this._detailPrice);
    }

    private _addActionButtons(
        container: Rectangle,
        heightBuy: string,
        heightClose: string,
    ): void {
        this._buyButton = Button.CreateSimpleButton("BuyBtn", "ÉCHANGER");
        this._buyButton.width = "100%";
        this._buyButton.height = heightBuy;
        this._buyButton.background = this.COLOR_BTN_PRIMARY;
        this._buyButton.color = this.COLOR_TEXT_MAIN;
        this._buyButton.fontFamily = this.LORE_FONT;
        this._buyButton.fontSize = 20;
        this._buyButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._buyButton.onPointerUpObservable.add(() => {
            if (this._selectedItem)
                OnPurchaseRequest.notifyObservers(this._selectedItem);
        });
        container.addControl(this._buyButton);

        const closeBtn = Button.CreateSimpleButton(
            "CloseBtn",
            "ANNULER / QUITTER",
        );
        closeBtn.width = "100%";
        closeBtn.height = heightClose;
        closeBtn.color = this.COLOR_BTN_CLOSE;
        closeBtn.thickness = 1;
        closeBtn.fontFamily = this.LORE_FONT;
        closeBtn.fontSize = 14;
        closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.top = "-" + (parseInt(heightBuy) + 10) + "px";
        closeBtn.onPointerEnterObservable.add(() => (closeBtn.color = "white"));
        closeBtn.onPointerOutObservable.add(
            () => (closeBtn.color = this.COLOR_BTN_CLOSE),
        );
        closeBtn.onPointerUpObservable.add(() => {
            this.hide();
            this.onBackObservable.notifyObservers();
        });
        container.addControl(closeBtn);
    }

    public updateCurrencyDisplay(amount: number): void {
        if (this._currencyText) this._currencyText.text = `${amount} FRAGMENTS`;
    }

    public updateOwnedDisplay(amount: number): void {
        if (this._detailOwned)
            this._detailOwned.text = `EN POSSESSION : ${amount}`;
    }

    public populateShop(inventory: ShopItem[]): void {
        this._itemGrid.clearControls();
        while (this._itemGrid.rowCount > 0)
            this._itemGrid.removeRowDefinition(0);
        this._slots = [];

        const rowCount = Math.ceil(
            Math.max(inventory.length, 20) / this.COLUMNS_COUNT,
        );
        const engine = this.advancedTexture.getScene()?.getEngine();
        const canvasWidth = engine ? engine.getRenderWidth() : 1920;
        const leftPanelWidth = canvasWidth * 0.9 * 0.63;
        const cellWidth =
            (leftPanelWidth - 40) / this.COLUMNS_COUNT - this.GRID_SPACING * 2;

        for (let i = 0; i < rowCount; i++)
            this._itemGrid.addRowDefinition(cellWidth, true);
        this._itemGrid.height = `${(cellWidth + this.GRID_SPACING * 2) * rowCount}px`;

        for (let index = 0; index < Math.max(inventory.length, 20); index++) {
            const item = inventory[index] || null;
            const slot = new ItemSlotComponent(item, (i, s) =>
                this.selectItem(i as any, s),
            );
            slot.paddingLeft =
                slot.paddingRight =
                slot.paddingTop =
                slot.paddingBottom =
                    this.GRID_SPACING;
            this._itemGrid.addControl(
                slot,
                Math.floor(index / this.COLUMNS_COUNT),
                index % this.COLUMNS_COUNT,
            );
            if (item) this._slots.push(slot);
        }

        if (this._slots.length > 0)
            this.selectItem(this._slots[0].itemData as any, this._slots[0]);
    }

    private selectItem(item: ShopItem, slot: ItemSlotComponent): void {
        if (!item) return;
        this._selectedItem = item;
        this._slots.forEach((s) => s.setSelected(false));
        slot.setSelected(true);

        this._detailName.text = item.name?.toUpperCase() || "OBJET INCONNU";
        this._detailPrice.text = `${item.price} FRAGMENTS`;
        this._detailDesc.text = item.description || "Aucune description.";
        this._detailIcon.source = item.iconPath;
        this.updateOwnedDisplay(item.ownedCount ?? 0);
    }

    public playBuySuccessAnimation(): void {
        this._flashPrice();
        this._buyButton.background = this.COLOR_BTN_SUCCESS;
        setTimeout(() => {
            this._buyButton.background = this.COLOR_BTN_PRIMARY;
            if (this._buyButton.textBlock) {
                const oldText = this._buyButton.textBlock.text;
                this._buyButton.textBlock.text = "ACQUIS !";
                setTimeout(() => {
                    if (this._buyButton.textBlock)
                        this._buyButton.textBlock.text = oldText;
                }, 1000);
            }
        }, 150);
    }

    public playBuyErrorAnimation(): void {
        if (this._isAnimatingError) return;
        this._isAnimatingError = true;
        this._buyButton.isEnabled = false;
        this._detailPrice.color = this.COLOR_BTN_ERROR;
        this._buyButton.background = this.COLOR_BTN_ERROR;
        setTimeout(() => {
            this._detailPrice.color = this.COLOR_TEXT_CURRENCY;
            this._buyButton.background = this.COLOR_BTN_PRIMARY;
            this._buyButton.isEnabled = true;
            this._isAnimatingError = false;
        }, 1800);
    }

    private _flashPrice(): void {
        this._detailPrice.color = "white";
        setTimeout(() => {
            this._detailPrice.color = this.COLOR_TEXT_CURRENCY;
        }, 200);
    }
}
