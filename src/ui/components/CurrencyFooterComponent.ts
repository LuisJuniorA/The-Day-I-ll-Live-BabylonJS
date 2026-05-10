import { Rectangle, TextBlock, Control } from "@babylonjs/gui";

export class CurrencyFooterComponent extends Rectangle {
    private _currencyText: TextBlock;
    private _currencySuffix: string;

    constructor(
        name: string,
        fontFamily: string,
        textColor: string,
        suffix: string = " FRAGMENTS",
        bgColor: string = "rgba(0, 0, 0, 0.4)",
        height: string = "10%",
    ) {
        super(name);
        this._currencySuffix = suffix;

        this.width = "100%";
        this.height = height;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.background = bgColor;
        this.thickness = 0;

        this._currencyText = new TextBlock(
            `${name}_Text`,
            `0${this._currencySuffix}`,
        );
        this._currencyText.fontFamily = fontFamily;
        this._currencyText.color = textColor;
        this._currencyText.fontSize = 22;
        this._currencyText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._currencyText.paddingRight = "30px";

        this.addControl(this._currencyText);
    }

    public updateAmount(amount: number): void {
        this._currencyText.text = `${amount}${this._currencySuffix}`;
    }
}
