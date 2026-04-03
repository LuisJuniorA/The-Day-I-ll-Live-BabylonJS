import { Rectangle, StackPanel, Control, TextBlock } from "@babylonjs/gui";

export class HealthBarComponent extends StackPanel {
    private _barFill: Rectangle;
    private _healthText: TextBlock;

    constructor(name: string) {
        super(name);

        // Configuration du conteneur (StackPanel)
        this.width = "250px";
        this.height = "70px";
        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.left = "20px";
        this.top = "20px";
        this.spacing = 5;

        // 1. Texte (Nom / HP)
        this._healthText = new TextBlock(`${name}_text`, "HP: 100 / 100");
        this._healthText.height = "25px";
        this._healthText.color = "white";
        this._healthText.fontSize = 16;
        this._healthText.fontFamily = "Arial";
        this._healthText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.addControl(this._healthText);

        // 2. Fond de la barre (Conteneur vide)
        const barBackground = new Rectangle(`${name}_bg`);
        barBackground.width = "220px";
        barBackground.height = "18px";
        barBackground.cornerRadius = 4;
        barBackground.thickness = 2;
        barBackground.color = "#333333";
        barBackground.background = "rgba(0, 0, 0, 0.6)";
        barBackground.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.addControl(barBackground);

        // 3. Remplissage de la barre
        this._barFill = new Rectangle(`${name}_fill`);
        this._barFill.width = "100%";
        this._barFill.height = "100%";
        this._barFill.thickness = 0;
        this._barFill.background = "#e74c3c"; // Rouge
        this._barFill.cornerRadius = 2;
        this._barFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        barBackground.addControl(this._barFill);
    }

    /**
     * Met à jour l'affichage de la santé
     */
    public updateHealth(current: number, max: number): void {
        const ratio = Math.max(0, Math.min(1, current / max));

        // Update du texte
        this._healthText.text = `HP: ${Math.ceil(current)} / ${max}`;

        // Update de la barre (Largeur en pourcentage)
        this._barFill.width = `${ratio * 100}%`;

        // Optionnel : Feedback visuel selon la vie restante
        if (ratio < 0.25) {
            this._barFill.background = "#c0392b"; // Rouge critique
        } else if (ratio < 0.5) {
            this._barFill.background = "#f39c12"; // Orange
        } else {
            this._barFill.background = "#2ecc71"; // Vert (ou garde ton rouge de base)
        }
    }
}
