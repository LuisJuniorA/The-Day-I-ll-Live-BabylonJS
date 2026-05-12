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
    OnCraftRequest,
    type ForgeRecipe,
    type RecipeRequirement,
} from "../../core/interfaces/ForgeEvents";
import { ItemSlotComponent } from "../components/ItemSlotComponent";
import { Observable } from "@babylonjs/core";
import { WEAPONS_DB } from "../../data/WeaponsDb";
import { DescriptionComponent } from "../components/DescriptionComponent";
import { RequirementRowComponent } from "../components/RequirementRowComponent";
import { CurrencyFooterComponent } from "../components/CurrencyFooterComponent";
import { WeaponStatsComponent } from "../components/WeaponStatsComponent";
import { ALL_ITEMS } from "../../data/ItemDb";
import { ItemGridViewComponent } from "../components/ItemGridViewComponent";

// --- CONFIGURATION ---
const UI_CONFIG = {
    LAYOUT: {
        MAIN_WIDTH: "90%",
        MAIN_HEIGHT: "85%",
        LEFT_PANEL_WIDTH: "63%",
        RIGHT_PANEL_WIDTH: "35%",
        FOOTER_HEIGHT: "10%",
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
        REQ_TOP_DEFAULT: "510px", // Descendu pour laisser de la place aux stats + mods
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
        SIZE_MODIFIERS: 16,
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
    private _weaponStatsComp!: WeaponStatsComponent;
    private _reqTitle!: TextBlock;
    private _reqStack!: StackPanel;
    private _craftButton!: Button;
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

    /**
     * Parcourt tous les items affichés dans la forge et met à jour
     * leurs compteurs "ownedCount" en fonction de l'état réel du joueur.
     */
    public refreshAllRecipesData(player: any): void {
        // On parcourt les slots de la grille
        this._itemGridComp.slots.forEach((slot) => {
            const recipe = slot.itemData as EnrichedForgeRecipe;
            if (!recipe) return;

            // Mise à jour du nombre possédé de l'item final
            recipe.ownedCount = player.inventory.getItemAmount(recipe.id);

            // Mise à jour de chaque composant requis dans la recette
            if (recipe.requirements) {
                recipe.requirements.forEach((req) => {
                    req.ownedCount = player.inventory.getItemAmount(req.itemId);
                });
            }
        });

        // Si on a un item sélectionné, on force le rafraîchissement de ses textes
        if (this._selectedRecipe) {
            this.updateOwnedDisplay(this._selectedRecipe.ownedCount ?? 0);
            this.updateRequirementsDisplay(
                this._selectedRecipe.requirements || [],
            );
        }
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
        this._itemGridComp.onItemClicked = (item, slot) =>
            this.selectRecipe(item as any, slot);

        leftPanel.addControl(this._itemGridComp);

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
        this._weaponStatsComp = new WeaponStatsComponent(
            "WeaponStats",
            UI_CONFIG.FONTS.FAMILY,
            {
                main: UI_CONFIG.COLORS.TEXT_MAIN,
                success: UI_CONFIG.COLORS.TEXT_SUCCESS,
                error: UI_CONFIG.COLORS.TEXT_ERROR,
                desc: UI_CONFIG.COLORS.TEXT_DESC,
                muted: UI_CONFIG.COLORS.TEXT_MUTED, // Passe la couleur muted pour les titres internes
            },
        );

        // On remonte un peu le composant car il contient ses propres titres
        this._weaponStatsComp.top = UI_CONFIG.POSITIONS.STATS_TOP;
        this._weaponStatsComp.paddingLeft = "20px";
        this._weaponStatsComp.paddingRight = "20px";
        this._weaponStatsComp.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        container.addControl(this._weaponStatsComp);
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

        this._detailName.text =
            itemData?.name?.toUpperCase() || recipe.id.toUpperCase();
        this._descriptionComp.setText(
            itemData?.description ||
                recipe.description ||
                UI_CONFIG.TEXTS.NO_DESCRIPTION,
        );
        this._detailIcon.source = itemData?.iconPath || recipe.iconPath;

        this._toggleCombatUI(isWeapon);
        if (isWeapon) {
            this._updateStatsComparison(recipe);
        }

        this.updateOwnedDisplay(recipe.ownedCount ?? 0);
        this.updateRequirementsDisplay(recipe.requirements || []);
    }

    // --- ForgeView.ts ---

    private _toggleCombatUI(isWeapon: boolean): void {
        this._weaponStatsComp.isVisible = isWeapon;

        const reqTop = isWeapon
            ? "530px"
            : UI_CONFIG.POSITIONS.REQ_TOP_MATERIAL;

        this._reqTitle.top = reqTop;
        this._reqStack.top =
            parseInt(reqTop) + UI_CONFIG.POSITIONS.SECTION_GAP + "px";
    }

    private _updateStatsComparison(recipe: EnrichedForgeRecipe): void {
        const targetWeapon = WEAPONS_DB[recipe.id];
        if (!targetWeapon) return;

        const currentId = targetWeapon.weaponSlot
            ? this._currentEquipment[targetWeapon.weaponSlot]
            : null;
        const currentWeapon = currentId ? WEAPONS_DB[currentId] : null;

        // 1. Définition des lignes de stats (Base + Modifiers)
        const statsConfig: any[] = [
            { id: "damage", label: UI_CONFIG.TEXTS.STATS_LABELS.damage },
            { id: "range", label: UI_CONFIG.TEXTS.STATS_LABELS.range },
            {
                id: "attackDuration",
                label: UI_CONFIG.TEXTS.STATS_LABELS.attackDuration,
                suffix: "s",
                invert: true,
            },
            {
                id: "knockbackForce",
                label: UI_CONFIG.TEXTS.STATS_LABELS.knockbackForce,
            },
        ];

        // Ajout des modificateurs à la config
        if (targetWeapon.modifiers) {
            Object.entries(targetWeapon.modifiers).forEach(
                ([key, mod]: [string, any]) => {
                    let label = key.toUpperCase();
                    let suffix = "";
                    if (key === "speedBoost") {
                        label = UI_CONFIG.TEXTS.STATS_LABELS.speed;
                        suffix = "%";
                    } else if (key === "damageMultiplier") {
                        label = UI_CONFIG.TEXTS.STATS_LABELS.power;
                        suffix = "x";
                    } else if (key === "healthBoost") {
                        label = UI_CONFIG.TEXTS.STATS_LABELS.health;
                    }

                    statsConfig.push({
                        id: key,
                        label: label,
                        suffix: suffix,
                        mode: mod.mode, // Transmet le mode (Actif/Passif) au composant
                    });
                },
            );
        }

        // 2. Préparation des données brutes pour le calcul des diffs
        const flattenData = (weapon: any) => {
            if (!weapon) return {};
            const baseStats = weapon.stats || {};
            const mods = weapon.modifiers || {};
            const flat: any = { ...baseStats };
            for (const key in mods) {
                // On extrait la valeur numérique (ex: 0.1) pour le calcul
                let val = mods[key].value;
                if (key === "speedBoost") val *= 100;
                flat[key] = val;
            }
            return flat;
        };

        this._weaponStatsComp.updateStats(
            flattenData(targetWeapon),
            flattenData(currentWeapon),
            statsConfig,
        );
    }

    public updateCurrency(amount: number): void {
        this._currentFragments = amount;
        if (this._footerComp) this._footerComp.updateAmount(amount);
        if (this._selectedRecipe)
            this.updateRequirementsDisplay(
                this._selectedRecipe.requirements || [],
            );
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
        this._itemGridComp.populate(sortedRecipes as any, 20);
        if (this._itemGridComp.slots.length > 0) {
            this.selectRecipe(
                this._itemGridComp.slots[0].itemData as any,
                this._itemGridComp.slots[0],
            );
        }
    }
}
