import { Rectangle, StackPanel, Control, TextBlock } from "@babylonjs/gui";

export class HealthBarComponent extends StackPanel {
    private _barFill: Rectangle;
    private _healthText: TextBlock;
    private _barContainer: Rectangle;

    private readonly _THEME = {
        SOUL_LIGHT: "#f0faff",
        HEALTH_VITAL: "#c0392b",
        HEALTH_MID: "#d35400",
        HEALTH_LOW: "#7f8c8d",
        INK_BLACK: "rgba(5, 5, 10, 0.9)",
        INK_BORDER: "rgba(255, 255, 255, 0.15)",
    };

    constructor(name: string) {
        super(name);

        this.width = "300px";
        this.height = "45px"; // Réduit car ne gère plus tout le bloc HUD
        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.spacing = 2;

        // 1. Label Style
        this._healthText = new TextBlock(`${name}_text`, "HP 100/100");
        this._healthText.height = "20px";
        this._healthText.color = this._THEME.SOUL_LIGHT;
        this._healthText.fontSize = 12;
        this._healthText.fontFamily = "Georgia, serif";
        this._healthText.fontStyle = "italic";
        this._healthText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._healthText.alpha = 0.7;
        this.addControl(this._healthText);

        // 2. Conteneur principal
        this._barContainer = new Rectangle(`${name}_bg`);
        this._barContainer.width = "280px";
        this._barContainer.height = "12px";
        this._barContainer.thickness = 1;
        this._barContainer.color = this._THEME.INK_BORDER;
        this._barContainer.background = this._THEME.INK_BLACK;
        this._barContainer.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.addControl(this._barContainer);

        // 3. Remplissage
        this._barFill = new Rectangle(`${name}_fill`);
        this._barFill.width = "100%";
        this._barFill.height = "100%";
        this._barFill.thickness = 0;
        this._barFill.background = this._THEME.HEALTH_VITAL;
        this._barFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._barContainer.addControl(this._barFill);
    }

    public updateHealth(current: number, max: number): void {
        const ratio = Math.max(0, Math.min(1, current / max));
        this._healthText.text = `HP  ${Math.ceil(current)} / ${max}`;
        this._barFill.width = `${ratio * 100}%`;

        if (ratio < 0.2) {
            this._barFill.background = "#4c0000";
            this._barContainer.color = "#ff4757";
        } else {
            this._barFill.background =
                ratio < 0.5 ? this._THEME.HEALTH_MID : this._THEME.HEALTH_VITAL;
            this._barContainer.color = this._THEME.INK_BORDER;
        }
    }
}
