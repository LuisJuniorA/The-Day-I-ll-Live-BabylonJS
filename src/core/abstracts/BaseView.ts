import { AdvancedDynamicTexture, Container } from "@babylonjs/gui";

export abstract class BaseView {
    // Le conteneur racine de la vue, accessible par les classes enfants
    protected rootContainer: Container;
    protected advancedTexture: AdvancedDynamicTexture;

    constructor(advancedTexture: AdvancedDynamicTexture, name: string) {
        this.advancedTexture = advancedTexture;
        this.rootContainer = new Container(name);
        this.rootContainer.isVisible = false;
        this.advancedTexture.addControl(this.rootContainer);
    }

    public show(): void {
        this.rootContainer.isVisible = true;
    }

    public hide(): void {
        this.rootContainer.isVisible = false;
    }

    // Oblige chaque vue enfant à définir comment elle construit son UI
    protected abstract buildUI(): void;
}