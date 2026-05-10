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
import { ALL_ITEMS } from "../../data/ItemDb";
import type { InventoryItem } from "../../core/interfaces/InventoryEvent";
import type { ShopItem } from "../../core/interfaces/ShopEvents";

export class InventoryView extends BaseView {
    // --- Couleurs & Style ---
    private readonly COLOR_OVERLAY = "rgba(0,0,0,0.6)";
    private readonly COLOR_LEFT_BG = "rgba(10, 10, 14, 0.7)";
    private readonly COLOR_RIGHT_BG = "rgba(15, 15, 20, 0.8)";
    private readonly COLOR_BORDER = "rgba(255, 255, 255, 0.1)";
    private readonly COLOR_BTN_PRIMARY = "#4a2a1a"; // Définie ici
    private readonly COLOR_BTN_SECONDARY = "rgba(255, 255, 255, 0.3)";
    private readonly COLOR_CURRENCY = "#FFD700";
    private readonly LORE_FONT = "Georgia, 'Times New Roman', serif";

    private _gridView!: ItemGridViewComponent;
    private _detailName!: TextBlock;
    private _detailIcon!: Image;
    private _detailQuantity!: TextBlock;
    private _descriptionComp!: DescriptionComponent;
    private _actionButton!: Button;
    private _footerComp!: CurrencyFooterComponent;

    private _selectedItem: InventoryItem | null = null;

    public onActionObservable = new Observable<InventoryItem>();
    public onBackObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "InventoryView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this.rootContainer.background = this.COLOR_OVERLAY;

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
        leftPanel.background = this.COLOR_LEFT_BG;
        leftPanel.color = this.COLOR_BORDER;
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

        // Footer en composant
        this._footerComp = new CurrencyFooterComponent(
            "InvFooter",
            this.LORE_FONT,
            this.COLOR_CURRENCY,
        );
        leftPanel.addControl(this._footerComp);

        return leftPanel;
    }

    private _createRightPanel(): Rectangle {
        const rightPanel = new Rectangle("RightPanel");
        rightPanel.width = "35%";
        rightPanel.height = "100%";
        rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.background = this.COLOR_RIGHT_BG;
        rightPanel.color = this.COLOR_BORDER;
        rightPanel.thickness = 1;
        rightPanel.paddingLeft = rightPanel.paddingRight = "25px";

        this._detailName = new TextBlock("DetailName", "");
        this._detailName.fontFamily = this.LORE_FONT;
        this._detailName.color = "white";
        this._detailName.fontSize = 26;
        this._detailName.height = "50px";
        this._detailName.top = "10px";
        this._detailName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailName.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        rightPanel.addControl(this._detailName);

        this._detailQuantity = new TextBlock("DetailQty", "");
        this._detailQuantity.fontFamily = this.LORE_FONT;
        this._detailQuantity.fontSize = 14;
        this._detailQuantity.color = "#888888";
        this._detailQuantity.height = "50px";
        this._detailQuantity.top = "20px";
        this._detailQuantity.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailQuantity.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.addControl(this._detailQuantity);

        const iconBox = new Rectangle("IconBox");
        iconBox.width = "100%";
        iconBox.height = "200px";
        iconBox.top = "70px";
        iconBox.background = "rgba(0,0,0,0.4)";
        iconBox.thickness = 0;
        iconBox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._detailIcon = new Image("DetailIcon", "");
        this._detailIcon.stretch = Image.STRETCH_UNIFORM;
        this._detailIcon.width = "75%";
        iconBox.addControl(this._detailIcon);
        rightPanel.addControl(iconBox);

        this._descriptionComp = new DescriptionComponent(
            "InvDesc",
            this.LORE_FONT,
        );
        this._descriptionComp.top = "285px";
        this._descriptionComp.height = "100px";
        this._descriptionComp.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        rightPanel.addControl(this._descriptionComp);

        // Bouton Action (Corrigé)
        this._actionButton = Button.CreateSimpleButton("ActionBtn", "UTILISER");
        this._actionButton.width = "100%";
        this._actionButton.height = "60px";
        this._actionButton.background = this.COLOR_BTN_PRIMARY;
        this._actionButton.color = "white";
        this._actionButton.fontFamily = this.LORE_FONT;
        this._actionButton.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._actionButton.onPointerUpObservable.add(() => {
            if (this._selectedItem)
                this.onActionObservable.notifyObservers(this._selectedItem);
        });
        rightPanel.addControl(this._actionButton);

        // Bouton Retour
        const closeBtn = Button.CreateSimpleButton("CloseBtn", "RETOUR");
        closeBtn.width = "100%";
        closeBtn.height = "30px";
        closeBtn.color = this.COLOR_BTN_SECONDARY;
        closeBtn.top = "-70px";
        closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        closeBtn.onPointerUpObservable.add(() => {
            this.hide();
            this.onBackObservable.notifyObservers();
        });
        rightPanel.addControl(closeBtn);

        return rightPanel;
    }

    public updateFragments(amount: number): void {
        this._footerComp.updateAmount(amount);
    }

    public populateInventory(items: InventoryItem[]): void {
        this._gridView.populate(items as unknown as ShopItem[], 25);
        const slots = this._gridView.slots;
        if (slots.length > 0 && items.length > 0) {
            this.selectItem(items[0], slots[0]);
        }
    }

    public selectItem(item: InventoryItem, slot: ItemSlotComponent): void {
        if (!item) return;
        this._selectedItem = item;
        this._gridView.slots.forEach((s) => s.setSelected(false));
        slot.setSelected(true);

        const itemData = ALL_ITEMS[item.id];
        this._detailName.text =
            itemData?.name?.toUpperCase() || item.id.toUpperCase();
        this._detailQuantity.text = `QUANTITÉ : ${item.quantity}`;
        this._detailIcon.source = itemData?.iconPath || "";
        this._descriptionComp.setText(
            itemData?.description || "Aucune description.",
        );

        if (this._actionButton.textBlock) {
            this._actionButton.textBlock.text =
                item.type === "weapon" ? "ÉQUIPER" : "UTILISER";
        }
    }
}
