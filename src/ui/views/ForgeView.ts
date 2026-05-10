import {
    Rectangle,
    TextBlock,
    Control,
    Image,
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
import { DescriptionComponent } from "../components/DescriptionComponent";
import { RequirementRowComponent } from "../components/RequirementRowComponent";
import { CurrencyFooterComponent } from "../components/CurrencyFooterComponent"; // Ajout de l'import
import type { WeaponOwnerModifiers } from "../../core/types/WeaponStats";
import { ALL_ITEMS } from "../../data/ItemDb";
import { ItemGridViewComponent } from "../components/ItemGridViewComponent";
import type { ShopItem } from "../../core/interfaces/ShopEvents";

// --- CONFIGURATION ---
const UI_CONFIG = {
    LAYOUT: {
        MAIN_WIDTH: "90%",
        MAIN_HEIGHT: "85%",
        LEFT_PANEL_WIDTH: "63%",
        RIGHT_PANEL_WIDTH: "35%",
        FOOTER_HEIGHT: "10%",
        GRID_COLUMNS: 5,
        GRID_SPACING: 8,
        RIGHT_PANEL_PADDING: "20px",
    },
    POSITIONS: {
        HEADER_TOP: "10px",
        HEADER_HEIGHT: "50px",
        PREVIEW_TOP: "75px",
        PREVIEW_HEIGHT: "200px",
        DESC_TOP: "285px",
        DESC_HEIGHT: "60px",
        STATS_TOP: "350px",
        STATS_HEIGHT: "70px",
        MODS_TOP: "445px",
        REQ_TOP_DEFAULT: "490px",
        REQ_TOP_MATERIAL: "350px",
        REQ_HEIGHT: "150px",
        CRAFT_BTN_HEIGHT: "60px",
        CLOSE_BTN_HEIGHT: "30px",
        SECTION_GAP: 25,
    },
    FONTS: {
        FAMILY: "Georgia, 'Times New Roman', serif",
        SIZE_TITLE: 26,
        SIZE_OWNED: 14,
        SIZE_SECTION_LABEL: 13,
        SIZE_STATS_VALUE: 13,
        SIZE_MODIFIERS: 16,
        SIZE_CURRENCY: 22,
        SIZE_BTN_MAIN: 20,
        SIZE_BTN_SUB: 14,
    },
    COLORS: {
        OVERLAY: "rgba(0,0,0,0.6)",
        LEFT_BG: "rgba(10, 10, 14, 0.7)",
        LEFT_BORDER: "rgba(255, 255, 255, 0.1)",
        RIGHT_BG: "rgba(15, 15, 20, 0.8)",
        RIGHT_BORDER: "rgba(255, 255, 255, 0.1)",
        FOOTER_BG: "rgba(0, 0, 0, 0.4)",
        ICON_BOX_BG: "rgba(0, 0, 0, 0.4)",
        TEXT_MAIN: "white",
        TEXT_SECONDARY: "rgba(255, 255, 255, 0.5)",
        TEXT_MUTED: "#888888",
        TEXT_DESC: "rgba(255, 255, 255, 0.7)",
        TEXT_CURRENCY: "#FFD700",
        TEXT_SUCCESS: "#2ecc71",
        TEXT_ERROR: "#ff4757",
        TEXT_MODIFIER: "#a5bccf",
        BTN_PRIMARY: "#4a2a1a",
        BTN_SUCCESS: "#e67e22",
        BTN_ERROR: "#ff4757",
        BTN_CLOSE: "rgba(255, 255, 255, 0.3)",
    },
    TEXTS: {
        CURRENCY_SUFFIX: " FRAGMENTS",
        CURRENCY_FULL_NAME: "FRAGMENTS D'ÂME",
        OWNED_LABEL: "EN POSSESSION : ",
        SECTION_STATS: "CARACTÉRISTIQUES",
        SECTION_REQ: "COÛT DE FORGE",
        BTN_CRAFT: "FORGER L'OBJET",
        BTN_CANCEL: "ANNULER / QUITTER",
        FEEDBACK_SUCCESS: "FORGÉ !",
        NO_DESCRIPTION: "Aucune description disponible.",
        MODIFIER_PREFIX: "✦ ",
        STATS_LABELS: {
            damage: "DÉGÂTS",
            range: "PORTÉE",
            attackDuration: "COOLDOWN",
            knockbackForce: "RECUL",
            speed: "VITESSE",
            power: "PUISSANCE",
            health: "VITALITÉ",
        },
        PATH_FRAGMENT_ICON: "./assets/ui/icons/materials/fragment.png",
        PATH_PLACEHOLDER_ICON: "./assets/ui/icons/default.png",
    },
};

export interface EnrichedForgeRecipe extends ForgeRecipe {
    ownedCount?: number;
    weaponSlot?: string;
}

export class ForgeView extends BaseView {
    private _mainContainer!: Rectangle;
    private _itemGridComp!: ItemGridViewComponent;
    private _detailName!: TextBlock;
    private _detailIcon!: Image;
    private _detailOwned!: TextBlock;
    private _descriptionComp!: DescriptionComponent;
    private _statsTitle!: TextBlock;
    private _statsGrid!: Grid;
    private _modifiersStack!: StackPanel;
    private _reqTitle!: TextBlock;
    private _reqStack!: StackPanel;
    private _craftButton!: Button;

    // Utilisation du composant Footer
    private _footerComp!: CurrencyFooterComponent;

    private _selectedRecipe: EnrichedForgeRecipe | null = null;
    private _currentEquipment: Record<string, string | null> = {};
    private _currentFragments: number = 0;
    private _isAnimatingError: boolean = false;

    public onBackObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "ForgeView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this.rootContainer.background = UI_CONFIG.COLORS.OVERLAY;
        this._mainContainer = new Rectangle("ForgeContainer");
        this._mainContainer.width = UI_CONFIG.LAYOUT.MAIN_WIDTH;
        this._mainContainer.height = UI_CONFIG.LAYOUT.MAIN_HEIGHT;
        this._mainContainer.thickness = 0;
        this.rootContainer.addControl(this._mainContainer);

        this._mainContainer.addControl(this._createLeftPanel());
        this._mainContainer.addControl(this._createRightPanel());
    }

    private _createLeftPanel(): Rectangle {
        const leftPanel = new Rectangle("LeftPanel");
        leftPanel.width = UI_CONFIG.LAYOUT.LEFT_PANEL_WIDTH;
        leftPanel.height = "100%";
        leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftPanel.background = UI_CONFIG.COLORS.LEFT_BG;
        leftPanel.color = UI_CONFIG.COLORS.LEFT_BORDER;
        leftPanel.thickness = 1;

        this._itemGridComp = new ItemGridViewComponent(
            "ForgeGrid",
            this.advancedTexture,
        );
        this._itemGridComp.height = "90%";
        this._itemGridComp.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._itemGridComp.onItemClicked = (item, slot) => {
            this.selectRecipe(item as unknown as EnrichedForgeRecipe, slot);
        };

        leftPanel.addControl(this._itemGridComp);

        // --- Nouveau Footer via Composant ---
        this._footerComp = new CurrencyFooterComponent(
            "ForgeFooter",
            UI_CONFIG.FONTS.FAMILY,
            UI_CONFIG.COLORS.TEXT_CURRENCY,
            this._itemGridComp,
            UI_CONFIG.TEXTS.CURRENCY_SUFFIX,
            UI_CONFIG.COLORS.FOOTER_BG,
            UI_CONFIG.LAYOUT.FOOTER_HEIGHT,
        );
        leftPanel.addControl(this._footerComp);

        return leftPanel;
    }

    private _createRightPanel(): Rectangle {
        const rightPanel = new Rectangle("RightPanel");
        rightPanel.width = UI_CONFIG.LAYOUT.RIGHT_PANEL_WIDTH;
        rightPanel.height = "100%";
        rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.background = UI_CONFIG.COLORS.RIGHT_BG;
        rightPanel.color = UI_CONFIG.COLORS.RIGHT_BORDER;
        rightPanel.thickness = 1;
        rightPanel.paddingLeft = rightPanel.paddingRight =
            UI_CONFIG.LAYOUT.RIGHT_PANEL_PADDING;

        this._addHeaderSection(rightPanel);
        this._addPreviewSection(rightPanel);

        this._descriptionComp = new DescriptionComponent(
            "ForgeDesc",
            UI_CONFIG.FONTS.FAMILY,
        );
        this._descriptionComp.top = UI_CONFIG.POSITIONS.DESC_TOP;
        this._descriptionComp.height = UI_CONFIG.POSITIONS.DESC_HEIGHT;
        this._descriptionComp.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._descriptionComp);

        this._addStatsSection(rightPanel);

        this._modifiersStack = new StackPanel("ModifiersStack");
        this._modifiersStack.width = "100%";
        this._modifiersStack.top = UI_CONFIG.POSITIONS.MODS_TOP;
        this._modifiersStack.paddingLeft = this._modifiersStack.paddingRight =
            "10px";
        this._modifiersStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._modifiersStack);

        this._addRequirementsSection(rightPanel);
        this._addActionButtons(rightPanel);

        return rightPanel;
    }

    private _addHeaderSection(container: Rectangle): void {
        this._detailOwned = new TextBlock(
            "DetailOwned",
            `${UI_CONFIG.TEXTS.OWNED_LABEL}0`,
        );
        this._detailOwned.fontFamily = UI_CONFIG.FONTS.FAMILY;
        this._detailOwned.color = UI_CONFIG.COLORS.TEXT_SECONDARY;
        this._detailOwned.fontSize = UI_CONFIG.FONTS.SIZE_OWNED;
        this._detailOwned.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._detailOwned.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailOwned.height = UI_CONFIG.POSITIONS.HEADER_HEIGHT;
        this._detailOwned.top =
            parseInt(UI_CONFIG.POSITIONS.HEADER_TOP) + 10 + "px";
        this._detailOwned.paddingRight = "20px";
        container.addControl(this._detailOwned);

        this._detailName = new TextBlock("DetailName", "");
        this._detailName.fontFamily = UI_CONFIG.FONTS.FAMILY;
        this._detailName.color = UI_CONFIG.COLORS.TEXT_MAIN;
        this._detailName.fontSize = UI_CONFIG.FONTS.SIZE_TITLE;
        this._detailName.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailName.height = UI_CONFIG.POSITIONS.HEADER_HEIGHT;
        this._detailName.top = UI_CONFIG.POSITIONS.HEADER_TOP;
        this._detailName.paddingLeft = "20px";
        container.addControl(this._detailName);
    }

    private _addPreviewSection(container: Rectangle): void {
        const iconBox = new Rectangle("IconBox");
        iconBox.width = "100%";
        iconBox.height = UI_CONFIG.POSITIONS.PREVIEW_HEIGHT;
        iconBox.top = UI_CONFIG.POSITIONS.PREVIEW_TOP;
        iconBox.thickness = 0;
        iconBox.paddingRight = iconBox.paddingLeft = "20px";
        iconBox.background = UI_CONFIG.COLORS.ICON_BOX_BG;
        iconBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(iconBox);

        this._detailIcon = new Image("DetailIcon", "");
        this._detailIcon.stretch = Image.STRETCH_UNIFORM;
        this._detailIcon.width = "75%";
        iconBox.addControl(this._detailIcon);
    }

    private _addStatsSection(container: Rectangle): void {
        this._statsTitle = new TextBlock(
            "StatsTitle",
            UI_CONFIG.TEXTS.SECTION_STATS,
        );
        this._statsTitle.fontFamily = UI_CONFIG.FONTS.FAMILY;
        this._statsTitle.fontSize = UI_CONFIG.FONTS.SIZE_SECTION_LABEL;
        this._statsTitle.color = UI_CONFIG.COLORS.TEXT_MUTED;
        this._statsTitle.height = "20px";
        this._statsTitle.top = UI_CONFIG.POSITIONS.STATS_TOP;
        this._statsTitle.paddingLeft = "20px";
        this._statsTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._statsTitle.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.addControl(this._statsTitle);

        this._statsGrid = new Grid("StatsGrid");
        this._statsGrid.width = "100%";
        this._statsGrid.height = UI_CONFIG.POSITIONS.STATS_HEIGHT;
        this._statsGrid.top =
            parseInt(UI_CONFIG.POSITIONS.STATS_TOP) +
            UI_CONFIG.POSITIONS.SECTION_GAP +
            "px";
        this._statsGrid.paddingLeft = "35px";
        this._statsGrid.paddingRight = "20px";
        this._statsGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        for (let i = 0; i < 4; i++) this._statsGrid.addColumnDefinition(0.25);
        container.addControl(this._statsGrid);
    }

    private _addRequirementsSection(container: Rectangle): void {
        this._reqTitle = new TextBlock("ReqTitle", UI_CONFIG.TEXTS.SECTION_REQ);
        this._reqTitle.fontFamily = UI_CONFIG.FONTS.FAMILY;
        this._reqTitle.fontSize = 15;
        this._reqTitle.color = UI_CONFIG.COLORS.TEXT_MUTED;
        this._reqTitle.height = "20px";
        this._reqTitle.top = UI_CONFIG.POSITIONS.REQ_TOP_DEFAULT;
        this._reqTitle.paddingLeft = "20px";
        this._reqTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._reqTitle.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.addControl(this._reqTitle);

        this._reqStack = new StackPanel("ReqStack");
        this._reqStack.width = "100%";
        this._reqStack.top =
            parseInt(UI_CONFIG.POSITIONS.REQ_TOP_DEFAULT) +
            UI_CONFIG.POSITIONS.SECTION_GAP +
            "px";
        this._reqStack.height =
            parseInt(UI_CONFIG.POSITIONS.REQ_HEIGHT) -
            UI_CONFIG.POSITIONS.SECTION_GAP +
            "px";
        this._reqStack.paddingLeft = this._reqStack.paddingRight = "20px";
        this._reqStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(this._reqStack);
    }

    private _addActionButtons(container: Rectangle): void {
        this._craftButton = Button.CreateSimpleButton(
            "CraftBtn",
            UI_CONFIG.TEXTS.BTN_CRAFT,
        );
        this._craftButton.width = "100%";
        this._craftButton.height = UI_CONFIG.POSITIONS.CRAFT_BTN_HEIGHT;
        this._craftButton.background = UI_CONFIG.COLORS.BTN_PRIMARY;
        this._craftButton.color = UI_CONFIG.COLORS.TEXT_MAIN;
        this._craftButton.fontFamily = UI_CONFIG.FONTS.FAMILY;
        this._craftButton.fontSize = UI_CONFIG.FONTS.SIZE_BTN_MAIN;
        this._craftButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._craftButton.onPointerUpObservable.add(() => {
            if (this._selectedRecipe)
                OnCraftRequest.notifyObservers(this._selectedRecipe);
        });
        container.addControl(this._craftButton);

        const closeBtn = Button.CreateSimpleButton(
            "CloseBtn",
            UI_CONFIG.TEXTS.BTN_CANCEL,
        );
        closeBtn.width = "100%";
        closeBtn.height = UI_CONFIG.POSITIONS.CLOSE_BTN_HEIGHT;
        closeBtn.color = UI_CONFIG.COLORS.BTN_CLOSE;
        closeBtn.thickness = 1;
        closeBtn.fontFamily = UI_CONFIG.FONTS.FAMILY;
        closeBtn.fontSize = UI_CONFIG.FONTS.SIZE_BTN_SUB;
        closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.top =
            "-" + (parseInt(UI_CONFIG.POSITIONS.CRAFT_BTN_HEIGHT) + 10) + "px";
        closeBtn.onPointerEnterObservable.add(() => (closeBtn.color = "white"));
        closeBtn.onPointerOutObservable.add(
            () => (closeBtn.color = UI_CONFIG.COLORS.BTN_CLOSE),
        );
        closeBtn.onPointerUpObservable.add(() => {
            this.hide();
            this.onBackObservable.notifyObservers();
        });
        container.addControl(closeBtn);
    }

    public selectRecipe(
        recipe: EnrichedForgeRecipe,
        slot: ItemSlotComponent,
    ): void {
        if (!recipe) return;
        this._selectedRecipe = recipe;
        this._itemGridComp.slots.forEach((s) => s.setSelected(false));
        slot.setSelected(true);

        const isWeapon = recipe.type === "weapon";
        const itemData = ALL_ITEMS[recipe.id];
        const targetWeapon = WEAPONS_DB[recipe.id];

        this._detailName.text =
            itemData?.name?.toUpperCase() || recipe.id.toUpperCase();
        this._descriptionComp.setText(
            itemData?.description ||
                recipe.description ||
                UI_CONFIG.TEXTS.NO_DESCRIPTION,
        );
        this._detailIcon.source = itemData?.iconPath || recipe.iconPath;

        if (isWeapon) {
            this._toggleCombatUI(true);
            this._updateStatsComparison(recipe);
            const currentWeaponId = targetWeapon?.weaponSlot
                ? this._currentEquipment[targetWeapon.weaponSlot]
                : null;
            this._updateModifiersDisplay(
                targetWeapon?.modifiers,
                currentWeaponId
                    ? WEAPONS_DB[currentWeaponId]?.modifiers
                    : undefined,
            );
        } else {
            this._toggleCombatUI(false);
        }

        this.updateOwnedDisplay(recipe.ownedCount ?? 0);
        this.updateRequirementsDisplay(recipe.requirements || []);
    }

    private _toggleCombatUI(isWeapon: boolean): void {
        this._statsTitle.isVisible =
            this._statsGrid.isVisible =
            this._modifiersStack.isVisible =
                isWeapon;
        const reqTop = isWeapon
            ? UI_CONFIG.POSITIONS.REQ_TOP_DEFAULT
            : UI_CONFIG.POSITIONS.REQ_TOP_MATERIAL;
        this._reqTitle.top = reqTop;
        this._reqStack.top =
            parseInt(reqTop) + UI_CONFIG.POSITIONS.SECTION_GAP + "px";
    }

    public populateForge(recipes: EnrichedForgeRecipe[]): void {
        const sortedRecipes = [...recipes].sort((a, b) => {
            const typeOrder: Record<string, number> = {
                material: 0,
                weapon: 1,
            };
            const typeA = typeOrder[a.type || ""] ?? 99;
            const typeB = typeOrder[b.type || ""] ?? 99;
            return typeA !== typeB
                ? typeA - typeB
                : (a.name || "").localeCompare(b.name || "");
        });
        this._itemGridComp.populate(sortedRecipes as unknown as ShopItem[], 20);
        const slots = this._itemGridComp.slots;
        if (slots.length > 0) {
            this.selectRecipe(
                slots[0].itemData as unknown as EnrichedForgeRecipe,
                slots[0],
            );
        }
    }

    // --- MISE A JOUR CORRIGÉE ---
    public updateCurrency(amount: number): void {
        this._currentFragments = amount;

        // On utilise le composant pour l'affichage
        if (this._footerComp) {
            this._footerComp.updateAmount(amount);
        }

        if (this._selectedRecipe) {
            this.updateRequirementsDisplay(
                this._selectedRecipe.requirements || [],
            );
        }
    }

    public updateOwnedDisplay(amount: number): void {
        if (this._detailOwned)
            this._detailOwned.text = `${UI_CONFIG.TEXTS.OWNED_LABEL}${amount}`;
    }

    public updateRequirementsDisplay(requirements: RecipeRequirement[]): void {
        this._reqStack.clearControls();
        if (this._selectedRecipe) {
            this._reqStack.addControl(
                new RequirementRowComponent(
                    "currency_fragment",
                    UI_CONFIG.TEXTS.CURRENCY_FULL_NAME,
                    this._currentFragments,
                    this._selectedRecipe.price,
                    UI_CONFIG.TEXTS.PATH_FRAGMENT_ICON,
                    UI_CONFIG.FONTS.FAMILY,
                    true,
                ),
            );
        }

        [...requirements]
            .sort((a, b) => a.itemId.localeCompare(b.itemId))
            .forEach((req) => {
                const itemData = ALL_ITEMS[req.itemId];
                this._reqStack.addControl(
                    new RequirementRowComponent(
                        req.itemId,
                        itemData?.name || req.itemId,
                        req.ownedCount ?? 0,
                        req.amount,
                        itemData?.iconPath ||
                            UI_CONFIG.TEXTS.PATH_PLACEHOLDER_ICON,
                        UI_CONFIG.FONTS.FAMILY,
                    ),
                );
            });
    }

    private _updateStatsComparison(recipe: EnrichedForgeRecipe): void {
        if (!this._statsGrid) return;
        this._statsGrid.clearControls();
        const targetWeapon = WEAPONS_DB[recipe.id];
        if (!targetWeapon || !targetWeapon.stats) return;
        const currentWeaponId = targetWeapon.weaponSlot
            ? this._currentEquipment[targetWeapon.weaponSlot]
            : null;
        const currentWeapon = currentWeaponId
            ? WEAPONS_DB[currentWeaponId]
            : null;
        const cStats = (currentWeapon?.stats || {}) as Record<string, number>;

        const statsCfg = [
            {
                id: "damage",
                label: UI_CONFIG.TEXTS.STATS_LABELS.damage,
                val: targetWeapon.stats.damage ?? 0,
            },
            {
                id: "range",
                label: UI_CONFIG.TEXTS.STATS_LABELS.range,
                val: targetWeapon.stats.range ?? 0,
            },
            {
                id: "attackDuration",
                label: UI_CONFIG.TEXTS.STATS_LABELS.attackDuration,
                val: targetWeapon.stats.attackDuration ?? 0,
                suffix: "s",
                invert: true,
            },
            {
                id: "knockbackForce",
                label: UI_CONFIG.TEXTS.STATS_LABELS.knockbackForce,
                val: targetWeapon.stats.knockbackForce ?? 0,
            },
        ];

        this._statsGrid.addRowDefinition(30, true);
        this._statsGrid.addRowDefinition(30, true);

        statsCfg.forEach((stat, idx) => {
            const isRight = idx % 2 === 1;
            const diff = stat.val - (cStats[stat.id] ?? 0);
            const label = new TextBlock(`lbl_${stat.id}`, stat.label);
            label.color = UI_CONFIG.COLORS.TEXT_DESC;
            label.fontSize = 12;
            label.fontFamily = UI_CONFIG.FONTS.FAMILY;
            label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this._statsGrid.addControl(
                label,
                Math.floor(idx / 2),
                isRight ? 2 : 0,
            );

            const isBetter = stat.invert ? diff < 0 : diff > 0;
            const color = isBetter
                ? UI_CONFIG.COLORS.TEXT_SUCCESS
                : diff === 0
                  ? UI_CONFIG.COLORS.TEXT_MAIN
                  : UI_CONFIG.COLORS.TEXT_ERROR;
            const valStr =
                stat.id === "attackDuration"
                    ? stat.val.toFixed(2)
                    : Math.round(stat.val);
            const diffStr =
                stat.id === "attackDuration"
                    ? Math.abs(diff).toFixed(2)
                    : Math.round(Math.abs(diff));

            const valueText = new TextBlock(
                `val_${stat.id}`,
                `${valStr}${stat.suffix ?? ""} (${diff >= 0 ? "+" : "-"}${diffStr})`,
            );
            valueText.color = color;
            valueText.fontSize = UI_CONFIG.FONTS.SIZE_STATS_VALUE;
            valueText.fontWeight = "bold";
            valueText.textHorizontalAlignment =
                Control.HORIZONTAL_ALIGNMENT_RIGHT;
            valueText.paddingRight = "10px";
            this._statsGrid.addControl(
                valueText,
                Math.floor(idx / 2),
                isRight ? 3 : 1,
            );
        });
    }

    private _updateModifiersDisplay(
        targetMods?: WeaponOwnerModifiers,
        currentMods?: WeaponOwnerModifiers,
    ): void {
        this._modifiersStack.clearControls();
        if (!targetMods) return;
        const entries = Object.entries(targetMods);
        if (entries.length === 0) return;

        const modsGrid = new Grid("ModsGrid");
        modsGrid.width = "100%";
        const rowCount = Math.ceil(entries.length / 2);
        modsGrid.height = `${rowCount * 35}px`;
        modsGrid.addColumnDefinition(0.5);
        modsGrid.addColumnDefinition(0.5);
        for (let i = 0; i < rowCount; i++) modsGrid.addRowDefinition(1, false);

        entries.forEach(([key, val], index) => {
            const targetValue = val as number;
            const currentValue =
                currentMods && (currentMods as any)[key] !== undefined
                    ? (currentMods as any)[key]
                    : 0;
            const diff = targetValue - currentValue;

            const container = new StackPanel(`mod_cont_${key}`);
            container.isVertical = false;
            container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            container.paddingLeft = index % 2 === 0 ? "10px" : "5px";

            const modText = new TextBlock(
                `mod_${key}`,
                this._getModifierLabel(key, targetValue),
            );
            modText.resizeToFit = true;
            modText.fontFamily = UI_CONFIG.FONTS.FAMILY;
            modText.fontSize = UI_CONFIG.FONTS.SIZE_MODIFIERS;
            modText.color = UI_CONFIG.COLORS.TEXT_MODIFIER;
            modText.paddingRight = "12px";
            container.addControl(modText);

            const sign = diff >= 0 ? "+" : "";
            const color =
                diff < 0
                    ? UI_CONFIG.COLORS.TEXT_ERROR
                    : diff > 0
                      ? UI_CONFIG.COLORS.TEXT_SUCCESS
                      : UI_CONFIG.COLORS.TEXT_SECONDARY;
            const diffStr =
                key === "speedBoost"
                    ? `${sign}${Math.round(diff * 100)}%`
                    : key === "damageMultiplier"
                      ? `${sign}${diff.toFixed(1)}`
                      : `${sign}${diff}`;

            const deltaText = new TextBlock(`delta_${key}`, `(${diffStr})`);
            deltaText.resizeToFit = true;
            deltaText.fontFamily = UI_CONFIG.FONTS.FAMILY;
            deltaText.fontSize = UI_CONFIG.FONTS.SIZE_MODIFIERS;
            deltaText.color = color;
            container.addControl(deltaText);

            modsGrid.addControl(container, Math.floor(index / 2), index % 2);
        });
        this._modifiersStack.addControl(modsGrid);
    }

    private _getModifierLabel(key: string, value: number): string {
        const plus = value > 0 ? "+" : "";
        let label = key.toUpperCase();
        let valStr = `${plus}${value}`;
        if (key === "speedBoost") {
            label = UI_CONFIG.TEXTS.STATS_LABELS.speed;
            valStr = `${plus}${Math.round(value * 100)}%`;
        } else if (key === "damageMultiplier") {
            label = UI_CONFIG.TEXTS.STATS_LABELS.power;
            valStr = `x${value}`;
        } else if (key === "healthBoost") {
            label = UI_CONFIG.TEXTS.STATS_LABELS.health;
        }
        return `${UI_CONFIG.TEXTS.MODIFIER_PREFIX}${label} : ${valStr}`;
    }

    public playBuySuccessAnimation(): void {
        this._craftButton.background = UI_CONFIG.COLORS.BTN_SUCCESS;
        setTimeout(() => {
            this._craftButton.background = UI_CONFIG.COLORS.BTN_PRIMARY;
            if (this._craftButton.textBlock) {
                const oldText = this._craftButton.textBlock.text;
                this._craftButton.textBlock.text =
                    UI_CONFIG.TEXTS.FEEDBACK_SUCCESS;
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
        this._craftButton.background = UI_CONFIG.COLORS.BTN_ERROR;
        setTimeout(() => {
            this._craftButton.background = UI_CONFIG.COLORS.BTN_PRIMARY;
            this._craftButton.isEnabled = true;
            this._isAnimatingError = false;
        }, 1800);
    }

    public setCurrentEquipment(equipment: Record<string, string | null>): void {
        this._currentEquipment = equipment;
        if (this._selectedRecipe)
            this._updateStatsComparison(this._selectedRecipe);
    }
}
