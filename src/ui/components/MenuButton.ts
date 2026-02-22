import { Button, TextBlock } from "@babylonjs/gui";

export class MenuButton extends Button {
    constructor(name: string, text: string) {
        super(name);

        // Configuration de base
        this.width = "100%";
        this.height = "60px";
        this.color = "white";
        this.background = "#333333";
        this.cornerRadius = 10;
        this.thickness = 2;

        // Ajout du texte (puisqu'on n'utilise pas le factory statique)
        const textBlock = new TextBlock(`${name}_text`, text);
        this.addControl(textBlock);

        this._setupAnimations();
    }

    private _setupAnimations(): void {
        this.onPointerEnterObservable.add(() => {
            this.background = "#555555";
            this.scaleX = 1.05; // Petit effet de zoom
            this.scaleY = 1.05;
        });

        this.onPointerOutObservable.add(() => {
            this.background = "#333333";
            this.scaleX = 1.0;
            this.scaleY = 1.0;
        });

        this.onPointerDownObservable.add(() => {
            this.scaleX = 0.95; // Effet d'écrasement au clic
        });
    }
}