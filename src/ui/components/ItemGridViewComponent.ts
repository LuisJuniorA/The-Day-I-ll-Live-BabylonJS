import {
    Rectangle,
    ScrollViewer,
    Grid,
    Control,
    AdvancedDynamicTexture,
} from "@babylonjs/gui";
import { ItemSlotComponent } from "./ItemSlotComponent";
import { type ShopItem } from "../../core/interfaces/ShopEvents";
import { ItemType } from "../../core/types/Items"; // Assure-toi du chemin d'import

export class ItemGridViewComponent extends Rectangle {
    private _itemGrid: Grid;
    private _scrollViewer: ScrollViewer;
    private _slots: ItemSlotComponent[] = [];
    private adt: AdvancedDynamicTexture;

    // --- Nouvelles propriétés pour le filtrage ---
    private _allOriginalItems: ShopItem[] = [];
    private _currentFilter: ItemType | "all" = "all";
    private _lastMinSlots: number = 20;
    // ---------------------------------------------

    private readonly COLUMNS_COUNT = 5;
    private readonly GRID_SPACING = 8;

    public onItemClicked: (item: ShopItem, slot: ItemSlotComponent) => void =
        () => {};

    constructor(name: string, adt: AdvancedDynamicTexture) {
        super(name);
        this.thickness = 0;
        this.adt = adt;

        this._scrollViewer = new ScrollViewer(`${name}_Scroll`);
        this._scrollViewer.width = "100%";
        this._scrollViewer.height = "100%";
        this._scrollViewer.thickness = 0;
        this._scrollViewer.forceVerticalBar = false;
        this.addControl(this._scrollViewer);

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

    /** * Applique un filtre et régénère la grille
     * @param type Le type d'item à afficher ou "all"
     */
    public filterByType(type: ItemType | "all"): void {
        this._currentFilter = type;
        this._applyFilterAndPopulate();
    }

    /** Remplissage initial de la grille */
    public populate(items: ShopItem[], minSlots: number = 20): void {
        this._allOriginalItems = items;
        this._lastMinSlots = minSlots;
        this._applyFilterAndPopulate();
    }

    /** Logique interne de filtrage et d'affichage */
    private _applyFilterAndPopulate(): void {
        // 1. Filtrage des données
        const filteredItems =
            this._currentFilter === "all"
                ? this._allOriginalItems
                : this._allOriginalItems.filter(
                      (item) => item.type === this._currentFilter,
                  );

        // 2. Nettoyage
        this._itemGrid.clearControls();
        while (this._itemGrid.rowCount > 0)
            this._itemGrid.removeRowDefinition(0);
        this._slots = [];

        // 3. Calcul du layout (ton code existant)
        const totalSlots = Math.max(filteredItems.length, this._lastMinSlots);
        const rowCount = Math.ceil(totalSlots / this.COLUMNS_COUNT);

        const engine = this.adt.getScene()?.getEngine();
        const canvasWidth = engine ? engine.getRenderWidth() : 1920;
        const estimatedWidth =
            this.widthInPixels > 0 ? this.widthInPixels : canvasWidth * 0.5;
        const cellWidth =
            estimatedWidth / this.COLUMNS_COUNT - this.GRID_SPACING * 2;

        for (let i = 0; i < rowCount; i++) {
            this._itemGrid.addRowDefinition(cellWidth, true);
        }
        this._itemGrid.height = `${(cellWidth + this.GRID_SPACING * 2) * rowCount}px`;

        // 4. Création des slots
        for (let index = 0; index < totalSlots; index++) {
            const item = filteredItems[index] || null;
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

        // Reset du scroll en haut lors d'un changement de filtre
        this._scrollViewer.verticalBar.value = 0;
    }

    public get slots(): ItemSlotComponent[] {
        return this._slots;
    }
}
