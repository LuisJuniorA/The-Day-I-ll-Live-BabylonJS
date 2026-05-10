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
import { ItemSlotComponent } from "../components/ItemSlotComponent";
import { Observable } from "@babylonjs/core";
import { DescriptionComponent } from "../components/DescriptionComponent";
import { ItemGridViewComponent } from "../components/ItemGridViewComponent";
import { CurrencyFooterComponent } from "../components/CurrencyFooterComponent";
import { ALL_ITEMS } from "../../data/ItemDb";
import { WEAPONS_DB } from "../../data/WeaponsDb";
import type { InventoryItem } from "../../core/interfaces/InventoryEvent";
import type { ShopItem } from "../../core/interfaces/ShopEvents";
import type { WeaponOwnerModifiers } from "../../core/types/WeaponStats";

export class InventoryView extends BaseView {
    // --- Configuration Style (Strictement identique à ForgeView) ---
    private readonly STYLE = {
        COLOR_LEFT_BG: "rgba(10, 10, 14, 0.7)",
        COLOR_RIGHT_BG: "rgba(15, 15, 20, 0.8)",
        COLOR_BORDER: "rgba(255, 255, 255, 0.1)",
        COLOR_BTN_PRIMARY: "#4a2a1a",
        COLOR_BTN_SECONDARY: "rgba(255, 255, 255, 0.3)",
        LORE_FONT: "Georgia, 'Times New Roman', serif",
        TEXT_MUTED: "#888888",
        TEXT_SUCCESS: "#2ecc71",
        TEXT_ERROR: "#ff4757",
        TEXT_MODIFIER: "#a5bccf",
        TEXT_CURRENCY: "#FFD700",
        TEXT_DESC: "rgba(255, 255, 255, 0.7)",
        RIGHT_PANEL_PADDING: "20px",
    };

    private _gridView!: ItemGridViewComponent;
    private _detailName!: TextBlock;
    private _detailIcon!: Image;
    private _detailQuantity!: TextBlock;
    private _descriptionComp!: DescriptionComponent;
    private _actionButton!: Button;
    private _footerComp!: CurrencyFooterComponent;

    // Sections Stats de Combat
    private _statsTitle!: TextBlock;
    private _statsGrid!: Grid;
    private _modifiersStack!: StackPanel;

    private _selectedItem: InventoryItem | null = null;
    private _currentEquipment: Record<string, string | null> = {};

    public onActionObservable = new Observable<InventoryItem>();
    public onBackObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "InventoryView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this.rootContainer.background = "rgba(0,0,0,0.6)";

        const mainContainer = new Rectangle("InventoryContainer");
        mainContainer.width = "90%";
        mainContainer.height = "85%";
        mainContainer.thickness = 0;
        this.rootContainer.addControl(mainContainer);

        mainContainer.addControl(this._createLeftPanel());
        mainContainer.addControl(this._createRightPanel());
    }

    private _createLeftPanel(): Rectangle {
        const leftPanel = new Rectangle("LeftPanel");
        leftPanel.width = "63%";
        leftPanel.height = "100%";
        leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftPanel.background = this.STYLE.COLOR_LEFT_BG;
        leftPanel.color = this.STYLE.COLOR_BORDER;
        leftPanel.thickness = 1;

        this._gridView = new ItemGridViewComponent(
            "InvGrid",
            this.advancedTexture,
        );
        this._gridView.height = "90%";
        this._gridView.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._gridView.onItemClicked = (item, slot) =>
            this.selectItem(item as unknown as InventoryItem, slot);
        leftPanel.addControl(this._gridView);

        this._footerComp = new CurrencyFooterComponent(
            "InvFooter",
            this.STYLE.LORE_FONT,
            this.STYLE.TEXT_CURRENCY,
            this._gridView,
            " FRAGMENTS",
            "rgba(0, 0, 0, 0.4)",
            "10%",
        );
        leftPanel.addControl(this._footerComp);

        return leftPanel;
    }

    private _createRightPanel(): Rectangle {
        const rightPanel = new Rectangle("RightPanel");
        rightPanel.width = "35%";
        rightPanel.height = "100%";
        rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.background = this.STYLE.COLOR_RIGHT_BG;
        rightPanel.color = this.STYLE.COLOR_BORDER;
        rightPanel.thickness = 1;
        // Padding synchronisé avec ForgeView
        rightPanel.paddingLeft = rightPanel.paddingRight =
            this.STYLE.RIGHT_PANEL_PADDING;

        // Header : Quantité (En haut à droite comme ForgeView)
        this._detailQuantity = new TextBlock("DetailQty", "EN POSSESSION : 0");
        this._detailQuantity.fontFamily = this.STYLE.LORE_FONT;
        this._detailQuantity.fontSize = 16;
        this._detailQuantity.color = "rgba(255, 255, 255, 0.5)";
        this._detailQuantity.height = "50px";
        this._detailQuantity.top = "20px";
        this._detailQuantity.paddingRight = "20px";
        this._detailQuantity.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailQuantity.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.addControl(this._detailQuantity);

        // Header : Nom
        this._detailName = new TextBlock("DetailName", "");
        this._detailName.fontFamily = this.STYLE.LORE_FONT;
        this._detailName.color = "white";
        this._detailName.fontSize = 26;
        this._detailName.height = "50px";
        this._detailName.top = "10px";
        this._detailName.paddingLeft = "20px";
        this._detailName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailName.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        rightPanel.addControl(this._detailName);

        // Preview de l'Icone
        const iconBox = new Rectangle("IconBox");
        iconBox.width = "100%";
        iconBox.height = "200px";
        iconBox.top = "75px";
        iconBox.background = "rgba(0,0,0,0.4)";
        iconBox.thickness = 0;
        iconBox.paddingLeft = iconBox.paddingRight = "20px";
        iconBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailIcon = new Image("DetailIcon", "");
        this._detailIcon.stretch = Image.STRETCH_UNIFORM;
        this._detailIcon.width = "75%";
        iconBox.addControl(this._detailIcon);
        rightPanel.addControl(iconBox);

        // Description
        this._descriptionComp = new DescriptionComponent(
            "InvDesc",
            this.STYLE.LORE_FONT,
        );
        this._descriptionComp.top = "285px";
        this._descriptionComp.height = "60px";
        this._descriptionComp.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._descriptionComp);

        // Sections Stats
        this._statsTitle = new TextBlock("StatsTitle", "CARACTÉRISTIQUES");
        this._statsTitle.fontFamily = this.STYLE.LORE_FONT;
        this._statsTitle.fontSize = 13;
        this._statsTitle.color = this.STYLE.TEXT_MUTED;
        this._statsTitle.height = "20px";
        this._statsTitle.top = "350px";
        this._statsTitle.paddingLeft = "20px";
        this._statsTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._statsTitle.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        rightPanel.addControl(this._statsTitle);

        this._statsGrid = new Grid("StatsGrid");
        this._statsGrid.width = "100%";
        this._statsGrid.height = "70px";
        this._statsGrid.top = "375px";
        this._statsGrid.paddingLeft = "35px";
        this._statsGrid.paddingRight = "20px";
        this._statsGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        for (let i = 0; i < 4; i++) this._statsGrid.addColumnDefinition(0.25);
        rightPanel.addControl(this._statsGrid);

        this._modifiersStack = new StackPanel("ModifiersStack");
        this._modifiersStack.width = "100%";
        this._modifiersStack.top = "445px";
        this._modifiersStack.paddingLeft = this._modifiersStack.paddingRight =
            "10px";
        this._modifiersStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._modifiersStack);

        // Bouton Action (Equiper / Utiliser)
        this._actionButton = Button.CreateSimpleButton(
            "ActionBtn",
            "UTILISER L'OBJET",
        );
        this._actionButton.width = "100%";
        this._actionButton.height = "60px";
        this._actionButton.background = this.STYLE.COLOR_BTN_PRIMARY;
        this._actionButton.color = "white";
        this._actionButton.fontFamily = this.STYLE.LORE_FONT;
        this._actionButton.fontSize = 20;
        this._actionButton.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._actionButton.onPointerUpObservable.add(() => {
            if (this._selectedItem)
                this.onActionObservable.notifyObservers(this._selectedItem);
        });
        rightPanel.addControl(this._actionButton);

        // Bouton Retour
        const closeBtn = Button.CreateSimpleButton("CloseBtn", "RETOUR AU JEU");
        closeBtn.width = "100%";
        closeBtn.height = "30px";
        closeBtn.color = this.STYLE.COLOR_BTN_SECONDARY;
        closeBtn.thickness = 1;
        closeBtn.fontFamily = this.STYLE.LORE_FONT;
        closeBtn.fontSize = 16;
        closeBtn.top = "-70px";
        closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.onPointerUpObservable.add(() => {
            this.hide();
            this.onBackObservable.notifyObservers();
        });
        rightPanel.addControl(closeBtn);

        return rightPanel;
    }

    public selectItem(item: InventoryItem, slot: ItemSlotComponent): void {
        if (!item) return;
        this._selectedItem = item;
        this._gridView.slots.forEach((s) => s.setSelected(false));
        slot.setSelected(true);

        const itemData = ALL_ITEMS[item.id];
        const isWeapon = item.type === "weapon";

        this._detailName.text =
            itemData?.name?.toUpperCase() || item.id.toUpperCase();
        // Mise à jour du libellé demandé
        this._detailQuantity.text = `EN POSSESSION : ${item.quantity}`;
        this._detailIcon.source = itemData?.iconPath || "";
        this._descriptionComp.setText(
            itemData?.description || "Aucune description.",
        );

        this._toggleCombatUI(isWeapon);
        if (isWeapon) {
            this._updateStatsComparison(item.id);
        }

        if (this._actionButton.textBlock) {
            this._actionButton.textBlock.text = isWeapon
                ? "ÉQUIPER L'OBJET"
                : "UTILISER L'OBJET";
        }
    }

    private _toggleCombatUI(isWeapon: boolean): void {
        this._statsTitle.isVisible = isWeapon;
        this._statsGrid.isVisible = isWeapon;
        this._modifiersStack.isVisible = isWeapon;
    }

    // --- REMPLACE CES MÉTHODES DANS INVENTORYVIEW.TS ---

    private _updateStatsComparison(itemId: string): void {
        this._statsGrid.clearControls();
        this._modifiersStack.clearControls();

        const targetWeapon = WEAPONS_DB[itemId];
        if (!targetWeapon) return;

        const currentWeaponId = targetWeapon.weaponSlot
            ? this._currentEquipment[targetWeapon.weaponSlot]
            : null;
        const currentWeapon = currentWeaponId
            ? WEAPONS_DB[currentWeaponId]
            : null;
        const cStats = (currentWeapon?.stats || {}) as Record<string, number>;

        // Configuration des stats de base
        const statsCfg = [
            {
                id: "damage",
                label: "DÉGÂTS",
                val: targetWeapon.stats.damage ?? 0,
            },
            {
                id: "range",
                label: "PORTÉE",
                val: targetWeapon.stats.range ?? 0,
            },
            {
                id: "attackDuration",
                label: "COOLDOWN",
                val: targetWeapon.stats.attackDuration ?? 0,
                suffix: "s",
                invert: true,
            },
            {
                id: "knockbackForce",
                label: "RECUL",
                val: targetWeapon.stats.knockbackForce ?? 0,
            },
        ];

        this._statsGrid.addRowDefinition(30, true);
        this._statsGrid.addRowDefinition(30, true);

        statsCfg.forEach((stat, idx) => {
            const isRight = idx % 2 === 1;
            const diff = stat.val - (cStats[stat.id] ?? 0);

            // Label (Gauche de la colonne)
            const label = new TextBlock(`lbl_${stat.id}`, stat.label);
            label.color = this.STYLE.TEXT_DESC;
            label.fontSize = 16;
            label.fontFamily = this.STYLE.LORE_FONT;
            label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this._statsGrid.addControl(
                label,
                Math.floor(idx / 2),
                isRight ? 2 : 0,
            );

            // Valeur + Diff (Droite de la colonne)
            const isBetter = stat.invert ? diff < 0 : diff > 0;
            const color =
                diff === 0
                    ? "white"
                    : isBetter
                      ? this.STYLE.TEXT_SUCCESS
                      : this.STYLE.TEXT_ERROR;

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
            valueText.fontSize = 13;
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

        // Affichage des Modificateurs (Passifs)
        if (targetWeapon.modifiers) {
            this._renderModifiersGrid(
                targetWeapon.modifiers,
                currentWeapon?.modifiers,
            );
        }
    }

    private _renderModifiersGrid(
        targetMods: WeaponOwnerModifiers,
        currentMods?: WeaponOwnerModifiers,
    ): void {
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
            const currentValue = currentMods
                ? (currentMods as any)[key] || 0
                : 0;
            const diff = targetValue - currentValue;

            const container = new StackPanel(`mod_cont_${key}`);
            container.isVertical = false;
            container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            container.paddingLeft = "10px";

            // Label principal
            const modText = new TextBlock(
                `mod_${key}`,
                this._getModifierLabel(key, targetValue),
            );
            modText.resizeToFit = true;
            modText.fontFamily = this.STYLE.LORE_FONT;
            modText.fontSize = 16;
            modText.color = this.STYLE.TEXT_MODIFIER;
            modText.paddingRight = "8px";
            container.addControl(modText);

            // Delta (+/-)
            const sign = diff >= 0 ? "+" : "";
            const color =
                diff < 0
                    ? this.STYLE.TEXT_ERROR
                    : diff > 0
                      ? this.STYLE.TEXT_SUCCESS
                      : "rgba(255,255,255,0.3)";

            let diffStr = "";
            if (key === "speedBoost")
                diffStr = `${sign}${Math.round(diff * 100)}%`;
            else if (key === "damageMultiplier")
                diffStr = `${sign}${diff.toFixed(1)}`;
            else diffStr = `${sign}${Math.round(diff)}`;

            const deltaText = new TextBlock(`delta_${key}`, `(${diffStr})`);
            deltaText.resizeToFit = true;
            deltaText.fontFamily = this.STYLE.LORE_FONT;
            deltaText.fontSize = 16;
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
            label = "VITESSE";
            valStr = `${plus}${Math.round(value * 100)}%`;
        } else if (key === "damageMultiplier") {
            label = "PUISSANCE";
            valStr = `x${value}`;
        } else if (key === "healthBoost") {
            label = "VIE MAX";
        }

        return `✦ ${label} : ${valStr}`;
    }

    public updateCurrency(amount: number): void {
        if (this._footerComp) {
            this._footerComp.updateAmount(amount);
        }
    }

    public populateInventory(items: InventoryItem[], fragments?: number): void {
        if (fragments !== undefined) this.updateCurrency(fragments);
        this._gridView.populate(items as unknown as ShopItem[], 25);
        if (items.length > 0) {
            this.selectItem(items[0], this._gridView.slots[0]);
        }
    }

    public setCurrentEquipment(equipment: Record<string, string | null>): void {
        this._currentEquipment = equipment;
        if (this._selectedItem && this._selectedItem.type === "weapon") {
            this._updateStatsComparison(this._selectedItem.id);
        }
    }
}
