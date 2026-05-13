import {
    Rectangle,
    TextBlock,
    Control,
    Image,
    AdvancedDynamicTexture,
    Button,
} from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { ItemSlotComponent } from "../components/ItemSlotComponent";
import { Observable } from "@babylonjs/core";
import { DescriptionComponent } from "../components/DescriptionComponent";
import { ItemGridViewComponent } from "../components/ItemGridViewComponent";
import { CurrencyFooterComponent } from "../components/CurrencyFooterComponent";
import { WeaponStatsComponent } from "../components/WeaponStatsComponent";
import { ALL_ITEMS } from "../../data/ItemDb";
import { WEAPONS_DB } from "../../data/WeaponsDb";
import {
    OnRequestConsumableUse,
    type InventoryItem,
} from "../../core/interfaces/InventoryEvent";
import type { ShopItem } from "../../core/interfaces/ShopEvents";
import { ItemType } from "../../core/types/Items";
import type { Character } from "../../core/abstracts/Character";
import { OnRequestWeaponEquip } from "../../core/interfaces/CombatEvent";

// --- CONFIGURATION (Identique à ForgeView pour la cohérence) ---
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
        ACTION_BTN_HEIGHT: "60px",
        CLOSE_BTN_HEIGHT: "30px",
    },
    FONTS: {
        FAMILY: "Georgia, 'Times New Roman', serif",
        SIZE_TITLE: 26,
        SIZE_QTY: 14,
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
        BTN_CLOSE: "rgba(255, 255, 255, 0.3)",
    },
};

export class InventoryView extends BaseView {
    private _gridView!: ItemGridViewComponent;
    private _detailName!: TextBlock;
    private _detailIcon!: Image;
    private _detailQuantity!: TextBlock;
    private _descriptionComp!: DescriptionComponent;
    private _weaponStatsComp!: WeaponStatsComponent;
    private _actionButton!: Button;
    private _footerComp!: CurrencyFooterComponent;

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
        this.rootContainer.background = UI_CONFIG.COLORS.OVERLAY;

        const mainContainer = new Rectangle("InventoryContainer");
        mainContainer.width = UI_CONFIG.LAYOUT.MAIN_WIDTH;
        mainContainer.height = UI_CONFIG.LAYOUT.MAIN_HEIGHT;
        mainContainer.thickness = 0;
        this.rootContainer.addControl(mainContainer);

        mainContainer.addControl(this._createLeftPanel());
        mainContainer.addControl(this._createRightPanel());
    }

    private _createLeftPanel(): Rectangle {
        const leftPanel = new Rectangle("LeftPanel");
        leftPanel.width = UI_CONFIG.LAYOUT.LEFT_PANEL_WIDTH;
        leftPanel.height = "100%";
        leftPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        leftPanel.background = UI_CONFIG.COLORS.LEFT_BG;
        leftPanel.color = UI_CONFIG.COLORS.LEFT_BORDER;
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
            UI_CONFIG.FONTS.FAMILY,
            UI_CONFIG.COLORS.TEXT_CURRENCY,
            this._gridView,
            " FRAGMENTS",
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

        // Header : Quantité (Aligné droite comme dans la Forge)
        this._detailQuantity = new TextBlock("DetailQty", "EN POSSESSION : 0");
        this._detailQuantity.fontFamily = UI_CONFIG.FONTS.FAMILY;
        this._detailQuantity.fontSize = UI_CONFIG.FONTS.SIZE_QTY;
        this._detailQuantity.color = UI_CONFIG.COLORS.TEXT_SECONDARY;
        this._detailQuantity.height = UI_CONFIG.POSITIONS.HEADER_HEIGHT;
        this._detailQuantity.top =
            parseInt(UI_CONFIG.POSITIONS.HEADER_TOP) + 10 + "px";
        this._detailQuantity.paddingRight = "20px";
        this._detailQuantity.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._detailQuantity.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._detailQuantity);

        // Header : Nom (Aligné gauche)
        this._detailName = new TextBlock("DetailName", "");
        this._detailName.fontFamily = UI_CONFIG.FONTS.FAMILY;
        this._detailName.color = UI_CONFIG.COLORS.TEXT_MAIN;
        this._detailName.fontSize = UI_CONFIG.FONTS.SIZE_TITLE;
        this._detailName.height = UI_CONFIG.POSITIONS.HEADER_HEIGHT;
        this._detailName.top = UI_CONFIG.POSITIONS.HEADER_TOP;
        this._detailName.paddingLeft = "20px";
        this._detailName.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._detailName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._detailName);

        // Preview de l'Icone
        const iconBox = new Rectangle("IconBox");
        iconBox.width = "100%";
        iconBox.height = UI_CONFIG.POSITIONS.PREVIEW_HEIGHT;
        iconBox.top = UI_CONFIG.POSITIONS.PREVIEW_TOP;
        iconBox.background = UI_CONFIG.COLORS.ICON_BOX_BG;
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
            UI_CONFIG.FONTS.FAMILY,
        );
        this._descriptionComp.top = UI_CONFIG.POSITIONS.DESC_TOP;
        this._descriptionComp.height = UI_CONFIG.POSITIONS.DESC_HEIGHT;
        this._descriptionComp.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._descriptionComp);

        // Composant Stats (utilisant les couleurs et le padding de la Forge)
        this._weaponStatsComp = new WeaponStatsComponent(
            "InvStats",
            UI_CONFIG.FONTS.FAMILY,
            {
                main: UI_CONFIG.COLORS.TEXT_MAIN,
                success: UI_CONFIG.COLORS.TEXT_SUCCESS,
                error: UI_CONFIG.COLORS.TEXT_ERROR,
                desc: UI_CONFIG.COLORS.TEXT_DESC,
                muted: UI_CONFIG.COLORS.TEXT_MUTED,
                active: UI_CONFIG.COLORS.TEXT_CURRENCY,
                passive: UI_CONFIG.COLORS.TEXT_MODIFIER,
            },
        );
        this._weaponStatsComp.top = UI_CONFIG.POSITIONS.STATS_TOP;
        this._weaponStatsComp.paddingLeft = "20px";
        this._weaponStatsComp.paddingRight = "20px";
        this._weaponStatsComp.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._weaponStatsComp);

        // Bouton Action (Equiper/Utiliser)
        this._actionButton = Button.CreateSimpleButton(
            "ActionBtn",
            "UTILISER L'OBJET",
        );
        this._actionButton.width = "100%";
        this._actionButton.height = UI_CONFIG.POSITIONS.ACTION_BTN_HEIGHT;
        this._actionButton.background = UI_CONFIG.COLORS.BTN_PRIMARY;
        this._actionButton.color = UI_CONFIG.COLORS.TEXT_MAIN;
        this._actionButton.fontFamily = UI_CONFIG.FONTS.FAMILY;
        this._actionButton.fontSize = UI_CONFIG.FONTS.SIZE_BTN_MAIN;
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
        closeBtn.height = UI_CONFIG.POSITIONS.CLOSE_BTN_HEIGHT;
        closeBtn.color = UI_CONFIG.COLORS.BTN_CLOSE;
        closeBtn.thickness = 1;
        closeBtn.fontFamily = UI_CONFIG.FONTS.FAMILY;
        closeBtn.fontSize = UI_CONFIG.FONTS.SIZE_BTN_SUB;
        closeBtn.top =
            "-" + (parseInt(UI_CONFIG.POSITIONS.ACTION_BTN_HEIGHT) + 10) + "px";
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
        const type = item.type;

        this._detailName.text =
            itemData?.name?.toUpperCase() || item.id.toUpperCase();
        this._detailQuantity.text = `EN POSSESSION : ${item.quantity || 0}`;
        this._detailIcon.source = itemData?.iconPath || "";
        this._descriptionComp.setText(
            itemData?.description || "Aucune description.",
        );

        // --- GESTION DYNAMIQUE DU BOUTON ET DES STATS ---

        // On cache les stats par défaut, on ne les montre que pour les armes
        this._weaponStatsComp.isVisible = type === ItemType.WEAPON;

        if (this._actionButton.textBlock) {
            switch (type) {
                case ItemType.WEAPON:
                    this._actionButton.textBlock.text = "ÉQUIPER L'ARME";
                    this._actionButton.background =
                        UI_CONFIG.COLORS.BTN_PRIMARY; // Marron/Rouge
                    this._updateStatsComparison(item.id);
                    break;

                case ItemType.CONSUMABLE:
                    this._actionButton.textBlock.text = "UTILISER L'OBJET";
                    this._actionButton.background = "#27ae60"; // Vert pour l'utilisation
                    break;

                case ItemType.MATERIAL:
                    this._actionButton.textBlock.text = "JETER L'OBJET";
                    this._actionButton.background = "#c0392b"; // Rouge pour le drop
                    break;
            }
        }
    }

    private _updateStatsComparison(itemId: string): void {
        const targetWeapon = WEAPONS_DB[itemId];
        if (!targetWeapon) return;

        const currentId = targetWeapon.weaponSlot
            ? this._currentEquipment[targetWeapon.weaponSlot]
            : null;
        const currentWeapon = currentId ? WEAPONS_DB[currentId] : null;

        const statsCfg: any[] = [
            { id: "damage", label: "DÉGÂTS" },
            { id: "range", label: "PORTÉE" },
            {
                id: "attackDuration",
                label: "COOLDOWN",
                suffix: "s",
                invert: true,
            },
            { id: "knockbackForce", label: "RECUL" },
        ];

        if (targetWeapon.modifiers) {
            Object.entries(targetWeapon.modifiers).forEach(
                ([key, mod]: [string, any]) => {
                    let label = key.toUpperCase();
                    let suffix = "";
                    if (key === "speedBoost") {
                        label = "VITESSE";
                        suffix = "%";
                    } else if (key === "damageMultiplier") {
                        label = "PUISSANCE";
                        suffix = "x";
                    } else if (key === "healthBoost") {
                        label = "VIE MAX";
                    }

                    statsCfg.push({
                        id: key,
                        label: label,
                        suffix: suffix,
                        mode: mod.mode,
                    });
                },
            );
        }

        const flatten = (w: any) => {
            if (!w) return {};
            const f: any = { ...w.stats };
            if (w.modifiers) {
                for (const k in w.modifiers) {
                    f[k] =
                        k === "speedBoost"
                            ? w.modifiers[k].value * 100
                            : w.modifiers[k].value;
                }
            }
            return f;
        };

        this._weaponStatsComp.updateStats(
            flatten(targetWeapon),
            flatten(currentWeapon),
            statsCfg,
        );
    }

    public updateCurrency(amount: number): void {
        if (this._footerComp) this._footerComp.updateAmount(amount);
    }

    public _setupActionClick(owner: Character) {
        this._actionButton.onPointerUpObservable.clear(); // On nettoie les anciens listeners
        this._actionButton.onPointerUpObservable.add(() => {
            if (!this._selectedItem || this._selectedItem.quantity == 0) return;

            const id = this._selectedItem.id;
            const type = this._selectedItem.type;

            if (type === ItemType.WEAPON) {
                // On déclenche l'équipement via ton WeaponManager
                OnRequestWeaponEquip.notifyObservers({
                    character: owner,
                    weaponId: id,
                });
            } else if (type === ItemType.CONSUMABLE) {
                // On déclenche l'usage (potions etc)
                OnRequestConsumableUse.notifyObservers({
                    character: owner,
                    itemId: id,
                });
            } else if (type === ItemType.MATERIAL) {
                // Logique de Drop
                this._showDropConfirmation(id);
            }
        });
    }

    public refresh(items: InventoryItem[], fragments: number): void {
        this.populateInventory(items, fragments);
    }

    private _showDropConfirmation(itemId: string) {
        // Optionnel : Tu pourrais changer le texte du bouton en "CONFIRMER ?"
        // ou ouvrir une petite popup Babylon GUI ici.
        console.log("Demande de suppression de l'objet : " + itemId);
    }

    public populateInventory(items: InventoryItem[], fragments?: number): void {
        if (fragments !== undefined) this.updateCurrency(fragments);
        this._gridView.populate(items as unknown as ShopItem[], 25);
        console.log(items as unknown as ShopItem[]);

        if (items.length > 0) {
            this.selectItem(items[0], this._gridView.slots[0]);
        }
    }

    public setCurrentEquipment(equipment: Record<string, string | null>): void {
        this._currentEquipment = equipment;
        if (this._selectedItem?.type === "weapon") {
            this._updateStatsComparison(this._selectedItem.id);
        }
    }
}
