import {
    Rectangle,
    StackPanel,
    Image,
    TextBlock,
    Control,
} from "@babylonjs/gui";
import { Scalar } from "@babylonjs/core";

export class CurrencyHUDComponent extends Rectangle {
    private _icon: Image;
    private _amountText: TextBlock;
    private _deltaText: TextBlock;

    private _currentDisplayedAmount: number = 0;
    private _targetAmount: number = 0;
    private _isAnimating: boolean = false;

    private _hideTimeout: any;
    private readonly SHOW_DURATION = 3000; // 3 secondes de visibilité après changement

    constructor(name: string, initialAmount: number = 0) {
        super(name);

        this._currentDisplayedAmount = initialAmount;
        this._targetAmount = initialAmount;

        // --- Style de la capsule ---
        this.width = "260px"; // On élargit un peu pour le confort
        this.height = "52px"; // Plus haut pour laisser l'icône respirer
        this.cornerRadius = 26;
        this.thickness = 2;
        this.color = "rgba(255, 255, 255, 0.4)";
        this.background = "rgba(0, 0, 0, 0.75)";
        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.top = "20px";
        this.left = "-20px";
        this.alpha = 0;

        const container = new StackPanel(`${name}_Stack`);
        container.isVertical = false;
        container.width = "100%";
        // On ajoute un padding global au container pour décoller l'icône du bord gauche
        container.paddingLeft = "15px";
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.addControl(container);

        // 1. Logo (Plus grand et centré)
        this._icon = new Image(`${name}_Icon`, "./assets/ui/icons/default.png");
        this._icon.width = "36px";
        this._icon.height = "36px";
        // Plus besoin de paddingLeft ici, le container s'en occupe
        container.addControl(this._icon);

        // 2. Nombre principal
        this._amountText = new TextBlock(
            `${name}_Text`,
            initialAmount.toString(),
        );
        this._amountText.color = "white";
        this._amountText.fontSize = 22;
        this._amountText.fontWeight = "bold";
        // On donne une largeur fixe assez large pour éviter que le delta ne bouge tout le temps
        this._amountText.width = "120px";
        this._amountText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._amountText.paddingLeft = "12px"; // Espace entre l'icône et le chiffre
        container.addControl(this._amountText);

        // 3. Delta (+/-)
        this._deltaText = new TextBlock(`${name}_Delta`, "");
        this._deltaText.fontSize = 16;
        this._deltaText.width = "65px";
        this._deltaText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._deltaText.paddingRight = "15px";
        container.addControl(this._deltaText);
    }

    /**
     * Appelé par le Player ou l'UIManager pour mettre à jour la thune
     */
    public updateCurrency(newTotal: number, delta: number): void {
        // Plus besoin de calculer le delta ici, on le reçoit du Player
        if (delta > 0) {
            this._deltaText.text = `+${delta}`;
            this._deltaText.color = "#4CAF50";
        } else {
            this._deltaText.text = `${delta}`;
            this._deltaText.color = "#F44336";
        }

        this._targetAmount = newTotal;
        this._isAnimating = true;

        // Reset du timeout de visibilité
        this.alpha = 1;
        if (this._hideTimeout) clearTimeout(this._hideTimeout);

        this._hideTimeout = setTimeout(() => {
            this.alpha = 0; // Cache après X secondes
            this._deltaText.text = ""; // Reset le delta
        }, this.SHOW_DURATION);
    }

    /**
     * Doit être appelé dans la boucle de rendu (UIManager.update)
     */
    public update(_dt: number): void {
        if (!this._isAnimating) return;

        // Animation "compteur" fluide
        // On se rapproche de la cible par incréments
        const lerpSpeed = 0.1;
        this._currentDisplayedAmount = Scalar.Lerp(
            this._currentDisplayedAmount,
            this._targetAmount,
            lerpSpeed,
        );

        // Si on est très proche, on lock la valeur
        if (Math.abs(this._currentDisplayedAmount - this._targetAmount) < 0.5) {
            this._currentDisplayedAmount = this._targetAmount;
            this._isAnimating = false;
        }

        // Formatage Zelda (ex: 7,603)
        this._amountText.text = Math.floor(
            this._currentDisplayedAmount,
        ).toLocaleString();
    }
}
