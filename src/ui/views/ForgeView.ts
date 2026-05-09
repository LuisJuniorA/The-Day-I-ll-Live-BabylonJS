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
    OnCraftRequest,
    type ForgeRecipe,
    type RecipeRequirement,
} from "../../core/interfaces/ForgeEvents";
import { ItemSlotComponent } from "../components/ItemSlotComponent";
import { Observable } from "@babylonjs/core";
import { WEAPONS_DB } from "../../data/WeaponsDb";

export interface EnrichedForgeRecipe extends ForgeRecipe {
    name: string;
    description: string;
    iconPath: string;
    type: string; // "weapon" | "material"
    weaponSlot?: string;
    ownedCount?: number;
}

export class ForgeView extends BaseView {
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
    private readonly COLOR_TEXT_SUCCESS = "#2ecc71";
    private readonly COLOR_TEXT_ERROR = "#ff4757";

    private readonly COLOR_BTN_PRIMARY = "#4a2a1a";
    private readonly COLOR_BTN_SUCCESS = "#e67e22";
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
    private _reqStack!: StackPanel;
    private _craftButton!: Button;
    private _currencyText!: TextBlock;
    private _detailPrice!: TextBlock;
    private _statsGrid!: Grid;

    // --- État & Logique ---
    private _slots: ItemSlotComponent[] = [];
    private _selectedRecipe: EnrichedForgeRecipe | null = null;
    private _currentEquipment: Record<string, string | null> = {};
    private _isAnimatingError: boolean = false;

    public onBackObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "ForgeView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this.rootContainer.background = this.COLOR_OVERLAY;
        this._mainContainer = new Rectangle("ForgeContainer");
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
        const scrollViewer = new ScrollViewer("ForgeScroll");
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

        this._itemGrid = new Grid("ForgeGrid");
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
        const footer = new Rectangle("ForgeFooter");
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

        this._addHeaderSection(rightPanel, "10px", "50px");
        this._addPreviewSection(rightPanel, "75px", "200px");
        this._addDescriptionSection(rightPanel, "285px", "70px");
        this._addStatsSection(rightPanel, "360px", "100px");
        this._addRequirementsSection(rightPanel, "470px", "120px");
        this._addPriceSection(rightPanel, "595px", "40px");
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
        iconBox.paddingRight = "20px";
        iconBox.paddingLeft = "20px";
        iconBox.background = this.COLOR_ICON_BOX_BG;
        iconBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(iconBox);

        this._detailIcon = new Image("DetailIcon", "");
        this._detailIcon.stretch = Image.STRETCH_UNIFORM;
        this._detailIcon.width = "75%";
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
        this._detailDesc.height = parseInt(height) - 20 + "px";
        this._detailDesc.top = parseInt(top) + 25 + "px";
        this._detailDesc.textWrapping = true;
        this._detailDesc.fontFamily = this.LORE_FONT;
        this._detailDesc.color = this.COLOR_TEXT_DESC;
        this._detailDesc.fontSize = 15;
        this._detailDesc.paddingLeft = "35px";
        this._detailDesc.paddingRight = "20px";
        this._detailDesc.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailDesc.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailDesc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(this._detailDesc);
    }

    private _addStatsSection(
        container: Rectangle,
        top: string,
        height: string,
    ): void {
        const statsTitle = new TextBlock("StatsTitle", "CARACTÉRISTIQUES");
        statsTitle.fontFamily = this.LORE_FONT;
        statsTitle.fontSize = 13;
        statsTitle.color = this.COLOR_TEXT_MUTED;
        statsTitle.height = "20px";
        statsTitle.top = top;
        statsTitle.paddingLeft = "20px";
        statsTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        statsTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.addControl(statsTitle);

        this._statsGrid = new Grid("StatsGrid");
        this._statsGrid.width = "100%";
        this._statsGrid.height = height;
        this._statsGrid.top = parseInt(top) + 25 + "px";
        this._statsGrid.paddingLeft = "35px";
        this._statsGrid.paddingRight = "20px";
        this._statsGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        // SOLUTION : 4 Colonnes équilibrées pour éviter les chevauchements
        this._statsGrid.addColumnDefinition(0.25); // Label 1
        this._statsGrid.addColumnDefinition(0.25); // Valeur 1
        this._statsGrid.addColumnDefinition(0.25); // Label 2
        this._statsGrid.addColumnDefinition(0.25); // Valeur 2

        container.addControl(this._statsGrid);
    }

    private _addRequirementsSection(
        container: Rectangle,
        top: string,
        height: string,
    ): void {
        const reqTitle = new TextBlock("ReqTitle", "MATÉRIAUX REQUIS");
        reqTitle.fontFamily = this.LORE_FONT;
        reqTitle.fontSize = 15;
        reqTitle.color = this.COLOR_TEXT_MUTED;
        reqTitle.height = "20px";
        reqTitle.top = top;
        reqTitle.paddingLeft = "20px";
        reqTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        reqTitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.addControl(reqTitle);

        this._reqStack = new StackPanel("ReqStack");
        this._reqStack.width = "100%";
        this._reqStack.top = parseInt(top) + 25 + "px";
        this._reqStack.height = parseInt(height) - 25 + "px";
        this._reqStack.paddingLeft = this._reqStack.paddingRight = "20px";
        this._reqStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(this._reqStack);
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
        this._detailPrice.fontSize = 24;
        this._detailPrice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailPrice.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_CENTER;
        container.addControl(this._detailPrice);
    }

    private _addActionButtons(
        container: Rectangle,
        heightForge: string,
        heightClose: string,
    ): void {
        this._craftButton = Button.CreateSimpleButton(
            "CraftBtn",
            "FORGER L'OBJET",
        );
        this._craftButton.width = "100%";
        this._craftButton.height = heightForge;
        this._craftButton.background = this.COLOR_BTN_PRIMARY;
        this._craftButton.color = this.COLOR_TEXT_MAIN;
        this._craftButton.fontFamily = this.LORE_FONT;
        this._craftButton.fontSize = 20;
        this._craftButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._craftButton.onPointerUpObservable.add(() => {
            if (this._selectedRecipe)
                OnCraftRequest.notifyObservers(this._selectedRecipe);
        });
        container.addControl(this._craftButton);

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
        closeBtn.top = "-" + (parseInt(heightForge) + 10) + "px";
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

    public updateCurrency(amount: number): void {
        if (this._currencyText) this._currencyText.text = `${amount} FRAGMENTS`;
    }

    public updateOwnedDisplay(amount: number): void {
        if (this._detailOwned)
            this._detailOwned.text = `EN POSSESSION : ${amount}`;
    }

    public updateRequirementsDisplay(requirements: RecipeRequirement[]): void {
        this._reqStack.clearControls();
        const sortedReqs = [...requirements].sort((a, b) =>
            a.itemId.localeCompare(b.itemId),
        );
        sortedReqs.forEach((req) => {
            const hasEnough = (req.ownedCount ?? 0) >= req.amount;
            const statusColor = hasEnough ? "#2ecc71" : "#ff4757";
            const row = new Rectangle("reqRow_" + req.itemId);
            row.height = "35px";
            row.width = "100%";
            row.thickness = 1;
            row.color = "rgba(255,255,255,0.05)";
            row.background = "rgba(0,0,0,0.2)";
            row.paddingBottom = "4px";

            const iconContainer = new Rectangle("iconContainer");
            iconContainer.width = iconContainer.height = "27px";
            iconContainer.thickness = 1;
            iconContainer.color = "rgba(255,255,255,0.1)";
            iconContainer.horizontalAlignment =
                Control.HORIZONTAL_ALIGNMENT_LEFT;
            iconContainer.left = "4px";
            row.addControl(iconContainer);

            const folder = WEAPONS_DB[req.itemId] ? "weapons" : "materials";
            const icon = new Image(
                "icon",
                `assets/ui/icons/${folder}/${req.itemId}.png`,
            );
            icon.stretch = Image.STRETCH_UNIFORM;
            iconContainer.addControl(icon);

            const displayName = req.itemId.replace(/_/g, " ").toUpperCase();
            const nameText = new TextBlock("name", displayName);
            nameText.color = "rgba(255,255,255,0.8)";
            nameText.fontSize = 12;
            nameText.fontFamily = this.LORE_FONT;
            nameText.textHorizontalAlignment =
                Control.HORIZONTAL_ALIGNMENT_LEFT;
            nameText.paddingLeft = "40px";
            row.addControl(nameText);

            const countText = new TextBlock(
                "count",
                `${req.ownedCount}/${req.amount}`,
            );
            countText.color = statusColor;
            countText.fontSize = 13;
            countText.fontWeight = "bold";
            countText.fontFamily = "monospace";
            countText.textHorizontalAlignment =
                Control.HORIZONTAL_ALIGNMENT_RIGHT;
            countText.paddingRight = "10px";
            row.addControl(countText);
            this._reqStack.addControl(row);
        });
    }

    public populateForge(recipes: EnrichedForgeRecipe[]): void {
        this._itemGrid.clearControls();
        while (this._itemGrid.rowCount > 0)
            this._itemGrid.removeRowDefinition(0);
        this._slots = [];

        const sortedRecipes = [...recipes].sort((a, b) => {
            const typeOrder: Record<string, number> = {
                material: 0,
                weapon: 1,
            };
            const typeA = typeOrder[a.type || ""] ?? 99;
            const typeB = typeOrder[b.type || ""] ?? 99;
            if (typeA !== typeB) return typeA - typeB;
            if (a.type === "weapon" && b.type === "weapon") {
                const slotA = a.weaponSlot || "";
                const slotB = b.weaponSlot || "";
                if (slotA !== slotB) return slotA.localeCompare(slotB);
            }
            return (a.name || "").localeCompare(b.name || "");
        });

        const MIN_SLOTS = 20;
        const totalSlotsToDisplay = Math.max(sortedRecipes.length, MIN_SLOTS);
        const rowCount = Math.ceil(totalSlotsToDisplay / this.COLUMNS_COUNT);

        const engine = this.advancedTexture.getScene()?.getEngine();
        const canvasWidth = engine ? engine.getRenderWidth() : 1920;
        const leftPanelWidth = canvasWidth * 0.9 * 0.63;
        const cellWidth =
            (leftPanelWidth - 40) / this.COLUMNS_COUNT - this.GRID_SPACING * 2;
        const squareHeight = cellWidth;

        for (let i = 0; i < rowCount; i++)
            this._itemGrid.addRowDefinition(squareHeight, true);
        this._itemGrid.height = `${(squareHeight + this.GRID_SPACING * 2) * rowCount}px`;

        for (let index = 0; index < totalSlotsToDisplay; index++) {
            const recipe = sortedRecipes[index] || null;
            const slot = new ItemSlotComponent(recipe as any, (r, s) =>
                this.selectRecipe(r as unknown as EnrichedForgeRecipe, s),
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
            if (recipe) this._slots.push(slot);
        }

        if (this._slots.length > 0) {
            this.selectRecipe(
                this._slots[0].itemData as unknown as EnrichedForgeRecipe,
                this._slots[0],
            );
        }
    }

    private selectRecipe(
        recipe: EnrichedForgeRecipe,
        slot: ItemSlotComponent,
    ): void {
        if (!recipe) return;
        this._selectedRecipe = recipe;
        this._slots.forEach((s) => s.setSelected(false));
        slot.setSelected(true);
        this._detailName.text = recipe.name?.toUpperCase() || "OBJET INCONNU";
        this._detailPrice.text = `${recipe.price} FRAGMENTS`;
        this._detailDesc.text =
            recipe.description || "Aucune description disponible.";

        const folder = WEAPONS_DB[recipe.itemId] ? "weapons" : "materials";
        this._detailIcon.source =
            recipe.iconPath || `assets/ui/icons/${folder}/${recipe.itemId}.png`;

        this._updateStatsComparison(recipe);
        this.updateOwnedDisplay(recipe.ownedCount ?? 0);
        this.updateRequirementsDisplay(recipe.requirements || []);
    }

    private _updateStatsComparison(recipe: EnrichedForgeRecipe): void {
        if (!this._statsGrid) return;
        this._statsGrid.clearControls();
        while (this._statsGrid.rowCount > 0)
            this._statsGrid.removeRowDefinition(0);

        const targetWeapon = WEAPONS_DB[recipe.itemId];
        if (!targetWeapon || !targetWeapon.stats || !targetWeapon.weaponSlot)
            return;

        const currentEquippedId =
            this._currentEquipment[targetWeapon.weaponSlot];
        const currentWeapon = currentEquippedId
            ? WEAPONS_DB[currentEquippedId]
            : null;
        const tStats = targetWeapon.stats;
        const cStats = (currentWeapon?.stats || {}) as Record<string, number>;

        const statsToCompare = [
            { id: "damage", label: "DÉGÂTS", val: tStats.damage ?? 0 },
            { id: "range", label: "PORTÉE", val: tStats.range ?? 0 },
            {
                id: "attackDuration",
                label: "COOLDOWN",
                val: tStats.attackDuration ?? 0,
                suffix: "s",
                invert: true,
            },
            {
                id: "knockbackForce",
                label: "RECUL",
                val: tStats.knockbackForce ?? 0,
            },
        ];

        this._statsGrid.addRowDefinition(30, true);
        this._statsGrid.addRowDefinition(30, true);

        statsToCompare.forEach((stat, idx) => {
            const row = Math.floor(idx / 2);
            const isRightColumn = idx % 2 === 1;

            // Placement sur 4 colonnes : (L1, V1, L2, V2)
            const colLabel = isRightColumn ? 2 : 0;
            const colValue = isRightColumn ? 3 : 1;

            const currentVal = cStats[stat.id] ?? 0;
            const diff = stat.val - currentVal;

            let diffColor = this.COLOR_TEXT_MAIN;
            const isBetter = stat.invert ? diff < 0 : diff > 0;
            const isWorse = stat.invert ? diff > 0 : diff < 0;

            if (isBetter || (!currentWeapon && stat.val > 0))
                diffColor = this.COLOR_TEXT_SUCCESS;
            else if (isWorse) diffColor = this.COLOR_TEXT_ERROR;

            const label = new TextBlock(`lbl_${stat.id}`, stat.label);
            label.color = this.COLOR_TEXT_DESC;
            label.fontSize = 12;
            label.fontFamily = this.LORE_FONT;
            label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this._statsGrid.addControl(label, row, colLabel);

            const displayVal =
                stat.id === "attackDuration"
                    ? stat.val.toFixed(2)
                    : Math.round(stat.val);
            const sign = diff >= 0 ? "+" : "";
            const formattedDiff =
                stat.id === "attackDuration"
                    ? Math.abs(diff).toFixed(2)
                    : Math.round(Math.abs(diff));

            const valueText = `${displayVal}${stat.suffix ?? ""} (${sign}${diff >= 0 ? formattedDiff : "-" + formattedDiff})`;

            const value = new TextBlock(`val_${stat.id}`, valueText);
            value.color = diffColor;
            value.fontSize = 13;
            value.fontWeight = "bold";
            value.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            value.paddingRight = "10px"; // Sécurité pour ne pas coller à la colonne suivante
            this._statsGrid.addControl(value, row, colValue);
        });
    }

    public playBuySuccessAnimation(): void {
        this._flashPrice();
        this._craftButton.background = this.COLOR_BTN_SUCCESS;
        setTimeout(() => {
            this._craftButton.background = this.COLOR_BTN_PRIMARY;
            if (this._craftButton.textBlock) {
                const oldText = this._craftButton.textBlock.text;
                this._craftButton.textBlock.text = "FORGÉ !";
                setTimeout(() => {
                    if (this._craftButton.textBlock)
                        this._craftButton.textBlock.text = oldText;
                }, 1000);
            }
        }, 150);
    }

    public playBuyErrorAnimation(): void {
        if (this._isAnimatingError) return;
        this._isAnimatingError = true;
        this._craftButton.isEnabled = false;
        this._detailPrice.color = this.COLOR_BTN_ERROR;
        this._craftButton.background = this.COLOR_BTN_ERROR;
        setTimeout(() => {
            this._detailPrice.color = this.COLOR_TEXT_CURRENCY;
            this._craftButton.background = this.COLOR_BTN_PRIMARY;
            this._craftButton.isEnabled = true;
            this._isAnimatingError = false;
        }, 1800);
    }

    private _flashPrice(): void {
        this._detailPrice.color = "white";
        setTimeout(() => {
            this._detailPrice.color = this.COLOR_TEXT_CURRENCY;
        }, 200);
    }

    public setCurrentEquipment(equipment: Record<string, string | null>): void {
        this._currentEquipment = equipment;
        if (this._selectedRecipe)
            this._updateStatsComparison(this._selectedRecipe);
    }
}
