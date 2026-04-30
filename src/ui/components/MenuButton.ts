import { Button, TextBlock, Control } from "@babylonjs/gui";

export class MenuButton extends Button {
    private _textBlockButton: TextBlock;

    constructor(
        name: string,
        text: string,
        alignment: number = Control.HORIZONTAL_ALIGNMENT_RIGHT,
    ) {
        super(name);

        // Disparition totale de la "boîte" du bouton
        this.width = "450px";
        this.height = "50px";
        this.color = "transparent";
        this.background = "transparent";
        this.thickness = 0;
        this.clipContent = false;

        // Typographie élégante
        this._textBlockButton = new TextBlock(`${name}_text`, text);
        this._textBlockButton.color = "#aaaaaa"; // Gris pâle, presque éteint
        this._textBlockButton.fontSize = 24;
        this._textBlockButton.fontFamily = "Georgia, serif"; // Accentue le côté conte/sombre
        this._textBlockButton.textHorizontalAlignment = alignment;

        // Initialisation du glow (éteint par défaut)
        this._textBlockButton.shadowColor = "white";
        this._textBlockButton.shadowBlur = 0;

        this.addControl(this._textBlockButton);

        this._setupAnimations();
    }

    private _setupAnimations(): void {
        // L'âme commence à briller (Hover)
        this.onPointerEnterObservable.add(() => {
            this._textBlockButton.color = "#ffffff"; // Éclatant
            this._textBlockButton.shadowBlur = 15; // Effet de halo / lueur
            this._textBlockButton.scaleX = 1.05;
            this._textBlockButton.scaleY = 1.05;
        });

        // La lumière faiblit (Out)
        this.onPointerOutObservable.add(() => {
            this._textBlockButton.color = "#aaaaaa";
            this._textBlockButton.shadowBlur = 0;
            this._textBlockButton.scaleX = 1.0;
            this._textBlockButton.scaleY = 1.0;
        });

        // L'effort / l'action (Click)
        this.onPointerDownObservable.add(() => {
            this._textBlockButton.scaleX = 0.95;
            this._textBlockButton.scaleY = 0.95;
        });

        this.onPointerUpObservable.add(() => {
            this._textBlockButton.scaleX = 1.05;
            this._textBlockButton.scaleY = 1.05;
        });
    }

    public get textBlock(): TextBlock {
        return this._textBlockButton;
    }
}
