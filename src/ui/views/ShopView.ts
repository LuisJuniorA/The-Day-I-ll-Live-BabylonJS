import {
    Rectangle,
    TextBlock,
    Control,
    Image,
    AdvancedDynamicTexture,
    Button,
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

import { DescriptionComponent } from "../components/DescriptionComponent";
import { RequirementRowComponent } from "../components/RequirementRowComponent";
import { ItemGridViewComponent } from "../components/ItemGridViewComponent";
import { CurrencyFooterComponent } from "../components/CurrencyFooterComponent";
import { AudioManager } from "../../managers/AudioManager";

export class ShopView extends BaseView {
    // --- Configuration ---
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

    // --- Éléments UI ---
    private _mainContainer!: Rectangle;
    private _itemGridComp!: ItemGridViewComponent;
    private _detailName!: TextBlock;
    private _detailIcon!: Image;
    private _detailOwned!: TextBlock;
    private _descriptionComp!: DescriptionComponent;
    private _priceContainer!: StackPanel;
    private _buyButton!: Button;
    private _footer!: CurrencyFooterComponent;

    // --- État ---
    private _selectedItem: ShopItem | null = null;
    private _currentFragments: number = 0;
    private _isAnimatingError: boolean = false;

    public onBackObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "ShopView");
        this.buildUI();
        this.hide();

        // Écoute de l'événement d'ouverture de la boutique
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

        // Grille d'items
        this._itemGridComp = new ItemGridViewComponent(
            "ShopGrid",
            this.advancedTexture,
        );
        this._itemGridComp.height = "90%";
        this._itemGridComp.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._itemGridComp.onItemClicked = (item, slot) =>
            this.selectItem(item, slot);

        leftPanel.addControl(this._itemGridComp);

        // Footer avec système de filtres et monnaie
        this._footer = new CurrencyFooterComponent(
            "ShopFooter",
            this.LORE_FONT,
            this.COLOR_TEXT_CURRENCY,
            this._itemGridComp, // On passe la grille pour que les filtres fonctionnent
            this.TEXT_CONFIG.CURRENCY_SUFFIX,
            this.COLOR_FOOTER_BG,
            "10%",
        );
        leftPanel.addControl(this._footer);

        return leftPanel;
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
            AudioManager.getInstance().playSfx("UI_CLICK");

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
            AudioManager.getInstance().playSfx("UI_CLICK");

            this.hide();
            this.onBackObservable.notifyObservers();
        });
        container.addControl(closeBtn);
    }

    public updateCurrencyDisplay(amount: number): void {
        this._currentFragments = amount;
        if (this._footer) {
            this._footer.updateAmount(amount);
        }
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
        this._itemGridComp.populate(inventory, 20);

        // Sélection par défaut du premier item (en tenant compte du filtre potentiel)
        const slots = this._itemGridComp.slots;
        if (slots.length > 0) {
            this.selectItem(slots[0].itemData as ShopItem, slots[0]);
        }
    }

    private selectItem(item: ShopItem, slot: ItemSlotComponent): void {
        if (!item) return;
        this._selectedItem = item;

        // Mise à jour visuelle des slots
        this._itemGridComp.slots.forEach((s) => s.setSelected(false));
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
        const textBlock = this._buyButton.textBlock;

        setTimeout(() => {
            this._buyButton.background = this.COLOR_BTN_PRIMARY;
            if (textBlock) {
                const oldText = textBlock.text;
                textBlock.text = this.TEXT_CONFIG.SUCCESS_FEEDBACK;
                setTimeout(() => {
                    if (textBlock) textBlock.text = oldText;
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
