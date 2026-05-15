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
    private _filterTexts: Map<string, TextBlock> = new Map();

    private readonly ICON_BASE_PATH = "assets/ui/icons/utils/";
    private readonly CURRENCY_ICON_PATH =
        "assets/ui/icons/materials/fragment.png";

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

        // --- PANEL FILTRES (Gauche) ---
        const filterPanel = new StackPanel(`${name}_FilterPanel`);
        filterPanel.isVertical = false;
        filterPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        filterPanel.width = "70%";
        filterPanel.height = "100%";
        filterPanel.paddingLeft = "20px";
        this.addControl(filterPanel);

        this._createFilterButton(filterPanel, "ALL", "all", fontFamily);
        this._createFilterButton(
            filterPanel,
            "weapon.png",
            ItemType.WEAPON,
            fontFamily,
        );
        this._createFilterButton(
            filterPanel,
            "material.png",
            ItemType.MATERIAL,
            fontFamily,
        );
        this._createFilterButton(
            filterPanel,
            "consumable.png",
            ItemType.CONSUMABLE,
            fontFamily,
        );

        // --- PANEL MONNAIE (Droite) ---
        // On utilise un rectangle comme container pour mieux contrôler le placement
        const currencyContainer = new Rectangle(`${name}_CurrencyContainer`);
        currencyContainer.width = "300px"; // Largeur fixe pour éviter que Babylon ne s'y perde
        currencyContainer.height = "100%";
        currencyContainer.thickness = 0;
        currencyContainer.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.addControl(currencyContainer);

        const currencyStack = new StackPanel(`${name}_CurrencyStack`);
        currencyStack.isVertical = false;
        currencyStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        currencyStack.paddingRight = "30px";
        currencyContainer.addControl(currencyStack);

        // Icône du Fragment
        const currencyIcon = new Image(
            `${name}_CurrencyIcon`,
            this.CURRENCY_ICON_PATH,
        );
        currencyIcon.width = "64px";
        currencyIcon.height = "64px";
        currencyIcon.stretch = Image.STRETCH_UNIFORM;
        currencyIcon.paddingRight = "10px";
        currencyStack.addControl(currencyIcon);

        // Texte du montant
        this._currencyText = new TextBlock(
            `${name}_Text`,
            `0${this._currencySuffix}`,
        );
        this._currencyText.fontFamily = fontFamily;
        this._currencyText.color = textColor;
        this._currencyText.fontSize = 22;
        this._currencyText.width = "200px"; // On donne une largeur fixe au texte
        this._currencyText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._currencyText.isHitTestVisible = false;
        currencyStack.addControl(this._currencyText);

        this._highlightActiveFilter("all");
    }

    private _createFilterButton(
        container: StackPanel,
        content: string,
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
        btn.paddingRight = "10px"; // Espace entre les boutons
        btn.isPointerBlocker = true;

        if (content.endsWith(".png")) {
            const icon = new Image(
                `${type}_icon`,
                this.ICON_BASE_PATH + content,
            );
            icon.width = "100%";
            icon.height = "100%";
            icon.stretch = Image.STRETCH_UNIFORM;
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
