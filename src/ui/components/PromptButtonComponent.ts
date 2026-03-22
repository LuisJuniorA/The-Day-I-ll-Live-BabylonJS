import { Rectangle, TextBlock } from "@babylonjs/gui";
import { AbstractMesh } from "@babylonjs/core";

export class PromptButtonComponent extends Rectangle {
    private _textBlock: TextBlock;

    constructor(name: string = "interactionPrompt", initialText: string = "E") {
        super(name);

        // Configuration du conteneur (self)
        this.width = "40px";
        this.height = "40px";
        this.cornerRadius = 5;
        this.color = "white";
        this.thickness = 2;
        this.background = "rgba(0,0,0,0.6)";
        this.isVisible = false; // Caché par défaut

        // Création du texte interne
        this._textBlock = new TextBlock(`${name}_text`, initialText);
        this._textBlock.color = "white";
        this._textBlock.fontWeight = "bold";
        this._textBlock.fontSize = 20;

        this.addControl(this._textBlock);
    }

    /**
     * Lie le bouton à un mesh et l'affiche
     */
    public showAtMesh(targetMesh: AbstractMesh, offsetY: number = -100): void {
        this.linkWithMesh(targetMesh);
        this.linkOffsetY = offsetY;
        this.isVisible = true;
    }

    /**
     * Cache le bouton et nettoie le lien
     */
    public hide(): void {
        this.isVisible = false;
    }

    public show(): void {
        this.isVisible = true;
    }

    /**
     * Permet de changer la touche affichée dynamiquement (ex: 'E' -> 'F')
     */
    public set keyText(value: string) {
        this._textBlock.text = value;
    }
}
