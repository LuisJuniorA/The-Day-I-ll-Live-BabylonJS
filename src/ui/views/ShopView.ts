import {
    Rectangle,
    TextBlock,
    Control,
    Image,
    ScrollViewer,
    AdvancedDynamicTexture,
    Button,
    Grid,
    StackPanel,
} from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import {
    OnOpenShop,
    OnPurchaseRequest,
    type ShopItem,
} from "../../core/interfaces/ShopEvents";
import { ItemSlotComponent } from "../components/ItemSlotComponent";
import { Observable } from "@babylonjs/core";

// Composants partagés
import { DescriptionComponent } from "../components/DescriptionComponent";
import { RequirementRowComponent } from "../components/RequirementRowComponent";

export class ShopView extends BaseView {
    // --- Configuration Textes ---
    private readonly TEXT_CONFIG = {
        CURRENCY_SUFFIX: " FRAGMENTS",
        CURRENCY_LABEL: "FRAGMENTS D'ÂME",
        OWNED_LABEL: "EN POSSESSION : ",
        PRICE_SECTION_TITLE: "PRIX D'ÉCHANGE",
        BTN_EXCHANGE: "ÉCHANGER",
        BTN_CANCEL: "ANNULER / QUITTER",
        SUCCESS_FEEDBACK: "ACQUIS !",
        UNKNOWN_ITEM: "OBJET INCONNU",
        NO_DESCRIPTION: "Aucune description.",
        CURRENCY_ICON_PATH: "assets/ui/icons/materials/fragment.png",
    };

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
    private _descriptionComp!: DescriptionComponent;
    private _priceContainer!: StackPanel;
    private _buyButton!: Button;
    private _currencyText!: TextBlock;

    // --- État & Logique ---
    private _slots: ItemSlotComponent[] = [];
    private _selectedItem: ShopItem | null = null;
    private _currentFragments: number = 0;
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

        this._currencyText = new TextBlock(
            "CurrencyText",
            `0${this.TEXT_CONFIG.CURRENCY_SUFFIX}`,
        );
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

        this._addHeaderSection(rightPanel, "10px", "50px");
        this._addPreviewSection(rightPanel, "70px", "280px");

        this._descriptionComp = new DescriptionComponent(
            "ShopDesc",
            this.LORE_FONT,
        );
        this._descriptionComp.top = "370px";
        this._descriptionComp.height = "120px";
        this._descriptionComp.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._descriptionComp);

        this._addPriceSection(rightPanel, "510px", "60px");
        this._addActionButtons(rightPanel, "60px", "30px");

        return rightPanel;
    }

    private _addHeaderSection(
        container: Rectangle,
        top: string,
        height: string,
    ): void {
        this._detailOwned = new TextBlock(
            "DetailOwned",
            `${this.TEXT_CONFIG.OWNED_LABEL}0`,
        );
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
        this._detailIcon.width = "85%";
        iconBox.addControl(this._detailIcon);
    }

    private _addPriceSection(
        container: Rectangle,
        top: string,
        _height: string,
    ): void {
        const priceTitle = new TextBlock(
            "PriceTitle",
            this.TEXT_CONFIG.PRICE_SECTION_TITLE,
        );
        priceTitle.fontFamily = this.LORE_FONT;
        priceTitle.fontSize = 15;
        priceTitle.color = this.COLOR_TEXT_MUTED;
        priceTitle.height = "20px";
        priceTitle.top = top;
        priceTitle.paddingLeft = "20px";
        priceTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        priceTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.addControl(priceTitle);

        this._priceContainer = new StackPanel("PriceStack");
        this._priceContainer.width = "100%";
        this._priceContainer.height = "40px";
        this._priceContainer.top = parseInt(top) + 25 + "px";
        this._priceContainer.paddingLeft = this._priceContainer.paddingRight =
            "20px";
        this._priceContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(this._priceContainer);
    }

    private _addActionButtons(
        container: Rectangle,
        heightBuy: string,
        heightClose: string,
    ): void {
        this._buyButton = Button.CreateSimpleButton(
            "BuyBtn",
            this.TEXT_CONFIG.BTN_EXCHANGE,
        );
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
            this.TEXT_CONFIG.BTN_CANCEL,
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
        this._currentFragments = amount;
        if (this._currencyText)
            this._currencyText.text = `${amount}${this.TEXT_CONFIG.CURRENCY_SUFFIX}`;
        if (this._selectedItem) this._updatePriceDisplay(this._selectedItem);
    }

    public updateOwnedDisplay(amount: number): void {
        if (this._detailOwned)
            this._detailOwned.text = `${this.TEXT_CONFIG.OWNED_LABEL}${amount}`;
    }

    private _updatePriceDisplay(item: ShopItem): void {
        this._priceContainer.clearControls();
        this._priceContainer.addControl(
            new RequirementRowComponent(
                "currency_fragment",
                this.TEXT_CONFIG.CURRENCY_LABEL,
                this._currentFragments,
                item.price,
                this.TEXT_CONFIG.CURRENCY_ICON_PATH,
                this.LORE_FONT,
                true,
            ),
        );
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

        // Sélection par défaut du premier item
        if (this._slots.length > 0) {
            this.selectItem(this._slots[0].itemData as any, this._slots[0]);
        }
    }

    private selectItem(item: ShopItem, slot: ItemSlotComponent): void {
        if (!item) return;
        this._selectedItem = item;

        this._slots.forEach((s) => s.setSelected(false));
        slot.setSelected(true);

        this._detailName.text =
            item.name?.toUpperCase() || this.TEXT_CONFIG.UNKNOWN_ITEM;
        this._descriptionComp.setText(
            item.description || this.TEXT_CONFIG.NO_DESCRIPTION,
        );
        this._detailIcon.source = item.iconPath;

        this.updateOwnedDisplay(item.ownedCount ?? 0);
        this._updatePriceDisplay(item);
    }

    public playBuySuccessAnimation(): void {
        this._buyButton.background = this.COLOR_BTN_SUCCESS;
        setTimeout(() => {
            this._buyButton.background = this.COLOR_BTN_PRIMARY;
            if (this._buyButton.textBlock) {
                const oldText = this._buyButton.textBlock.text;
                this._buyButton.textBlock.text =
                    this.TEXT_CONFIG.SUCCESS_FEEDBACK;
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
        this._buyButton.background = this.COLOR_BTN_ERROR;

        setTimeout(() => {
            this._buyButton.background = this.COLOR_BTN_PRIMARY;
            this._buyButton.isEnabled = true;
            this._isAnimatingError = false;
        }, 1800);
    }
}
