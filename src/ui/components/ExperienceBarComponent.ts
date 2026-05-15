import { Rectangle, Control, TextBlock, StackPanel } from "@babylonjs/gui";

export class ExperienceBarComponent extends StackPanel {
    private _barFill: Rectangle;
    private _levelText: TextBlock;
    private _barContainer: Rectangle;

    private readonly _THEME = {
        EXP_BLUE: "#3498db",
        INK_BLACK: "rgba(5, 5, 10, 0.9)",
        INK_BORDER: "rgba(255, 255, 255, 0.1)",
        SOUL_LIGHT: "#f0faff",
    };

    constructor(name: string) {
        super(name);

        // CONFIGURATION DU STACKPANEL
        this.isVertical = false;
        this.height = "20px";
        this.width = "300px";
        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.spacing = 8;

        // 1. Texte Level
        // On utilise une largeur fixe en PIXELS pour éviter le warning cross-origin/layout
        this._levelText = new TextBlock(`${name}_lv`, "LV. 1");
        this._levelText.widthInPixels = 50;
        this._levelText.color = this._THEME.SOUL_LIGHT;
        this._levelText.fontSize = 11;
        this._levelText.fontFamily = "Georgia, serif";
        this._levelText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._levelText.alpha = 0.8;
        this.addControl(this._levelText);

        // 2. Container de la barre
        // Utilisation de pixels fixes pour le container dans le StackPanel
        this._barContainer = new Rectangle(`${name}_container`);
        this._barContainer.widthInPixels = 200;
        this._barContainer.heightInPixels = 6;
        this._barContainer.thickness = 1;
        this._barContainer.color = this._THEME.INK_BORDER;
        this._barContainer.background = this._THEME.INK_BLACK;
        this._barContainer.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_CENTER;

        // Remplissage (Le % est autorisé ICI car on est dans un Rectangle, pas un StackPanel)
        this._barFill = new Rectangle(`${name}_fill`);
        this._barFill.width = "0%";
        this._barFill.height = "100%";
        this._barFill.thickness = 0;
        this._barFill.background = this._THEME.EXP_BLUE;
        this._barFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._barContainer.addControl(this._barFill);

        this.addControl(this._barContainer);
    }

    /**
     * Met à jour la barre d'EXP.
     * Optimisé pour ne pas déclencher de recalcul GUI inutile.
     */
    public updateProgress(
        currentExp: number,
        nextLevelExp: number,
        level: number,
    ): void {
        // 1. Calcul du ratio
        const ratio = Math.max(0, Math.min(1, currentExp / nextLevelExp));
        const newWidth = `${(ratio * 100).toFixed(1)}%`;

        // 2. Mise à jour de la barre seulement si la valeur a changé (évite les lags)
        if (this._barFill.width !== newWidth) {
            this._barFill.width = newWidth;
        }

        // 3. Mise à jour du texte seulement si le niveau a changé
        const newLevelText = `LV. ${level}`;
        if (this._levelText.text !== newLevelText) {
            this._levelText.text = newLevelText;
        }
    }
}
