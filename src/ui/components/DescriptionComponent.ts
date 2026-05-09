import { Rectangle, TextBlock, Control } from "@babylonjs/gui";

export class DescriptionComponent extends Rectangle {
    private _titleText: TextBlock;
    private _bodyText: TextBlock;

    constructor(name: string, font: string) {
        super(name);
        this.thickness = 0;
        this.width = "100%";

        this._titleText = new TextBlock(`${name}_title`, "DESCRIPTION");
        this._titleText.fontFamily = font;
        this._titleText.fontSize = 15;
        this._titleText.color = "#888888";
        this._titleText.height = "20px";
        this._titleText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._titleText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._titleText.paddingLeft = "20px";
        this.addControl(this._titleText);

        this._bodyText = new TextBlock(`${name}_body`, "");
        this._bodyText.textWrapping = true;
        this._bodyText.fontFamily = font;
        this._bodyText.color = "rgba(255, 255, 255, 0.7)";
        this._bodyText.fontSize = 15;
        this._bodyText.paddingLeft = "35px";
        this._bodyText.paddingRight = "20px";
        this._bodyText.top = "25px";
        this._bodyText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._bodyText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._bodyText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.addControl(this._bodyText);
    }

    public setText(text: string): void {
        this._bodyText.text = text || "Aucune description disponible.";
    }
}
