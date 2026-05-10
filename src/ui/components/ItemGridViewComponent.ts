import {
    Rectangle,
    ScrollViewer,
    Grid,
    Control,
    AdvancedDynamicTexture,
} from "@babylonjs/gui";
import { ItemSlotComponent } from "./ItemSlotComponent";
import { type ShopItem } from "../../core/interfaces/ShopEvents";

export class ItemGridViewComponent extends Rectangle {
    private _itemGrid: Grid;
    private _scrollViewer: ScrollViewer;
    private _slots: ItemSlotComponent[] = [];
    private adt: AdvancedDynamicTexture;

    private readonly COLUMNS_COUNT = 5;
    private readonly GRID_SPACING = 8;

    /** Callback déclenché quand un item est cliqué */
    public onItemClicked: (item: ShopItem, slot: ItemSlotComponent) => void =
        () => {};

    constructor(name: string, adt: AdvancedDynamicTexture) {
        super(name);
        this.thickness = 0;
        this.adt = adt;

        // 1. Création du ScrollViewer
        this._scrollViewer = new ScrollViewer(`${name}_Scroll`);
        this._scrollViewer.width = "100%";
        this._scrollViewer.height = "100%";
        this._scrollViewer.thickness = 0;
        this._scrollViewer.forceVerticalBar = false;
        this.addControl(this._scrollViewer);

        // 2. Création de la Grille
        this._itemGrid = new Grid(`${name}_Grid`);
        this._itemGrid.width = "100%";
        this._itemGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._itemGrid.paddingLeft = this._itemGrid.paddingRight =
            this.GRID_SPACING;

        for (let i = 0; i < this.COLUMNS_COUNT; i++) {
            this._itemGrid.addColumnDefinition(1 / this.COLUMNS_COUNT, false);
        }

        this._scrollViewer.addControl(this._itemGrid);
    }

    /** Remplissage de la grille avec des items ou du vide */
    public populate(items: ShopItem[], minSlots: number = 20): void {
        this._itemGrid.clearControls();
        while (this._itemGrid.rowCount > 0)
            this._itemGrid.removeRowDefinition(0);
        this._slots = [];

        const totalSlots = Math.max(items.length, minSlots);
        const rowCount = Math.ceil(totalSlots / this.COLUMNS_COUNT);

        // Calcul dynamique de la taille des cellules basé sur la résolution
        const engine = this.adt.getScene()?.getEngine();
        const canvasWidth = engine ? engine.getRenderWidth() : 1920;
        // On estime la largeur disponible (on peut passer cette valeur en paramètre si besoin)
        const estimatedWidth =
            this.widthInPixels > 0 ? this.widthInPixels : canvasWidth * 0.5;
        const cellWidth =
            estimatedWidth / this.COLUMNS_COUNT - this.GRID_SPACING * 2;

        for (let i = 0; i < rowCount; i++) {
            this._itemGrid.addRowDefinition(cellWidth, true);
        }
        this._itemGrid.height = `${(cellWidth + this.GRID_SPACING * 2) * rowCount}px`;

        for (let index = 0; index < totalSlots; index++) {
            const item = items[index] || null;
            const slot = new ItemSlotComponent(item, (data, s) => {
                if (data) this.onItemClicked(data as ShopItem, s);
            });

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
    }

    public get slots(): ItemSlotComponent[] {
        return this._slots;
    }
}
