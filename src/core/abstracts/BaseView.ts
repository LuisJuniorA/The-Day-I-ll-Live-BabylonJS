import { AdvancedDynamicTexture, Container, Control } from "@babylonjs/gui";

export abstract class BaseView {
    // Le conteneur racine de la vue, accessible par les classes enfants
    protected rootContainer: Container;
    protected advancedTexture: AdvancedDynamicTexture;

    // Dans BaseView.ts
    constructor(advancedTexture: AdvancedDynamicTexture, name: string) {
        this.advancedTexture = advancedTexture;
        this.rootContainer = new Container(name);

        // 1. Taille plein écran
        this.rootContainer.width = "100%";
        this.rootContainer.height = "100%";

        // 2. ORIGINE CRUCIALE : On force l'alignement en haut à gauche
        // C'est ce qui permet aux coordonnées pixels du linkWithMesh de correspondre à l'écran
        this.rootContainer.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.rootContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this.rootContainer.isVisible = false;
        this.advancedTexture.addControl(this.rootContainer);
    }

    public show(): void {
        this.rootContainer.isVisible = true;
    }

    public hide(): void {
        this.rootContainer.isVisible = false;
    }

    public isVisible(): boolean {
        return this.rootContainer.isVisible;
    }

    // Oblige chaque vue enfant à définir comment elle construit son UI
    protected abstract buildUI(): void;
}
