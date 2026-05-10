import {
    Rectangle,
    TextBlock,
    Control,
    Button,
    StackPanel,
    Image,
} from "@babylonjs/gui";
import { ItemGridViewComponent } from "./ItemGridViewComponent";
import { ItemType } from "../../core/types/Items";

export class CurrencyFooterComponent extends Rectangle {
    private _currencyText: TextBlock;
    private _currencySuffix: string;
    private _gridView: ItemGridViewComponent;
    private _filterButtons: Map<string, Button> = new Map();
    private _filterIcons: Map<string, Image> = new Map();
    private _filterTexts: Map<string, TextBlock> = new Map(); // Pour gérer la couleur du texte "ALL"

    private readonly ICON_BASE_PATH = "assets/ui/icons/utils/";

    constructor(
        name: string,
        fontFamily: string,
        textColor: string,
        gridView: ItemGridViewComponent,
        suffix: string = " FRAGMENTS",
        bgColor: string = "rgba(0, 0, 0, 0.4)",
        height: string = "10%",
    ) {
        super(name);
        this._currencySuffix = suffix;
        this._gridView = gridView;

        this.width = "100%";
        this.height = height;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.background = bgColor;
        this.thickness = 0;
        this.zIndex = 100;
        this.isPointerBlocker = true;

        const filterPanel = new StackPanel(`${name}_FilterPanel`);
        filterPanel.isVertical = false;
        filterPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        filterPanel.width = "70%";
        filterPanel.height = "100%";
        filterPanel.paddingLeft = "20px";
        filterPanel.isPointerBlocker = false;
        this.addControl(filterPanel);

        // --- Création des boutons ---
        // On passe "ALL" au lieu d'un nom de fichier .png
        this._createFilterButton(filterPanel, "ALL", "all", fontFamily);
        this._createFilterButton(
            filterPanel,
            "weapon.svg",
            ItemType.WEAPON,
            fontFamily,
        );
        this._createFilterButton(
            filterPanel,
            "material.svg",
            ItemType.MATERIAL,
            fontFamily,
        );
        this._createFilterButton(
            filterPanel,
            "consumable.svg",
            ItemType.CONSUMABLE,
            fontFamily,
        );

        this._currencyText = new TextBlock(
            `${name}_Text`,
            `0${this._currencySuffix}`,
        );
        this._currencyText.fontFamily = fontFamily;
        this._currencyText.color = textColor;
        this._currencyText.fontSize = 22;
        this._currencyText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._currencyText.paddingRight = "30px";
        this._currencyText.isHitTestVisible = false;
        this.addControl(this._currencyText);

        this._highlightActiveFilter("all");
    }

    private _createFilterButton(
        container: StackPanel,
        content: string, // Peut être "ALL" ou "image.png"
        type: ItemType | "all",
        fontFamily: string,
    ): void {
        const btn = new Button(`btn_filter_${type}`);
        btn.width = "65px";
        btn.height = "65px";
        btn.thickness = 1;
        btn.cornerRadius = 4;
        btn.background = "rgba(255, 255, 255, 0.1)";
        btn.color = "white";
        btn.paddingRight = "12px";
        btn.isPointerBlocker = true;

        // Si le contenu se termine par .png, on crée une image, sinon un texte
        if (content.endsWith(".svg")) {
            const icon = new Image(
                `${type}_icon`,
                this.ICON_BASE_PATH + content,
            );
            icon.width = "100%";
            icon.height = "100%";
            icon.stretch = Image.STRETCH_UNIFORM;
            icon.color = "white";
            btn.addControl(icon);
            this._filterIcons.set(type, icon);
        } else {
            const text = new TextBlock(`${type}_text`, content);
            text.fontFamily = fontFamily;
            text.fontSize = 14;
            text.color = "white";
            btn.addControl(text);
            this._filterTexts.set(type, text);
        }

        btn.onPointerClickObservable.add(() => {
            this._gridView.filterByType(type);
            this._highlightActiveFilter(type);
        });

        // Animations Hover
        btn.pointerEnterAnimation = () => {
            if (btn.thickness !== 2)
                btn.background = "rgba(255, 255, 255, 0.2)";
        };
        btn.pointerOutAnimation = () => {
            if (btn.thickness !== 2)
                btn.background = "rgba(255, 255, 255, 0.1)";
        };

        container.addControl(btn);
        this._filterButtons.set(type, btn);
    }

    private _highlightActiveFilter(activeType: string): void {
        this._filterButtons.forEach((btn, type) => {
            const icon = this._filterIcons.get(type);
            const txt = this._filterTexts.get(type);

            if (type === activeType) {
                btn.background = "rgba(255, 255, 255, 0.25)";
                btn.thickness = 2;
                btn.color = "#FFD700";
                if (icon) icon.color = "#FFD700";
                if (txt) txt.color = "#FFD700";
            } else {
                btn.background = "rgba(255, 255, 255, 0.1)";
                btn.thickness = 1;
                btn.color = "white";
                if (icon) icon.color = "white";
                if (txt) txt.color = "white";
            }
        });
    }

    public updateAmount(amount: number): void {
        this._currencyText.text = `${amount}${this._currencySuffix}`;
    }
}
