import { Control, Grid, TextBlock } from "@babylonjs/gui";
import { ModifierMode } from "../../core/types/WeaponStats";

export interface StatConfig {
    id: string;
    label: string;
    val?: number;
    suffix?: string;
    invert?: boolean;
    mode?: ModifierMode;
}

export class WeaponStatsComponent extends Grid {
    private readonly STAT_INDENT_PX = 15; // Nombre pur pour éviter les erreurs de parsing

    private _colors: {
        main: string;
        success: string;
        error: string;
        desc: string;
        active: string;
        passive: string;
        muted: string;
    };

    constructor(
        name: string,
        fontFamily: string,
        colors: {
            main: string;
            success: string;
            error: string;
            desc: string;
            active?: string;
            passive?: string;
            muted?: string;
        },
    ) {
        super(name);
        this.fontFamily = fontFamily;
        this._colors = {
            ...colors,
            active: colors.active || "#FFD700",
            passive: colors.passive || "#a5bccf",
            muted: colors.muted || "#888888",
        };

        this.width = "100%";
        this.addColumnDefinition(0.35);
        this.addColumnDefinition(0.15);
        this.addColumnDefinition(0.35);
        this.addColumnDefinition(0.15);
    }

    private _createSectionTitle(text: string): TextBlock {
        const title = new TextBlock("", text);
        title.fontFamily = this.fontFamily;
        title.fontSize = 12;
        title.color = this._colors.muted;
        title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        return title;
    }

    public updateStats(
        targetStats: any,
        currentStats: any,
        config: StatConfig[],
    ): void {
        this.clearControls();
        const currentRows = this.rowCount;
        for (let i = 0; i < currentRows; i++) this.removeRowDefinition(0);

        const baseStats = config.filter((s) => !s.mode);
        const modStats = config.filter((s) => s.mode);

        let currentRow = 0;

        // --- SECTION 1: CARACTÉRISTIQUES ---
        this.addRowDefinition(25, true);
        this.addControl(
            this._createSectionTitle("CARACTÉRISTIQUES"),
            currentRow++,
            0,
        );

        const baseRows = Math.ceil(baseStats.length / 2);
        for (let i = 0; i < baseRows; i++) {
            this.addRowDefinition(25, true);
            this._renderStatRow(
                baseStats,
                i,
                currentRow++,
                targetStats,
                currentStats,
            );
        }

        // --- SECTION 2: MODIFICATEURS ---
        if (modStats.length > 0) {
            this.addRowDefinition(15, true);
            currentRow++;

            this.addRowDefinition(25, true);
            this.addControl(
                this._createSectionTitle("MODIFICATEURS"),
                currentRow++,
                0,
            );

            const modRows = Math.ceil(modStats.length / 2);
            for (let i = 0; i < modRows; i++) {
                this.addRowDefinition(25, true);
                this._renderStatRow(
                    modStats,
                    i,
                    currentRow++,
                    targetStats,
                    currentStats,
                );
            }

            this.addRowDefinition(20, true);
            this._drawLegend(currentRow++);
        }

        this.height = `${currentRow * 25}px`;
    }

    private _drawLegend(rowIndex: number): void {
        const activeLabel = new TextBlock("", "⚔ BONUS ACTIF");
        activeLabel.color = this._colors.active;
        activeLabel.fontSize = 10;
        activeLabel.fontStyle = "italic";
        activeLabel.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        activeLabel.paddingRight = "10px";
        this.addControl(activeLabel, rowIndex, 1);

        const passiveLabel = new TextBlock("", "✦ BONUS PASSIF");
        passiveLabel.color = this._colors.passive;
        passiveLabel.fontSize = 10;
        passiveLabel.fontStyle = "italic";
        passiveLabel.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        passiveLabel.paddingLeft = "10px";
        this.addControl(passiveLabel, rowIndex, 2);
    }

    private _renderStatRow(
        stats: StatConfig[],
        localIdx: number,
        gridRow: number,
        target: any,
        current: any,
    ) {
        [0, 1].forEach((colOffset) => {
            const stat = stats[localIdx * 2 + colOffset];
            if (!stat) return;

            const isRight = colOffset === 1;
            const targetVal = target[stat.id] ?? 0;
            const currentVal = current[stat.id] ?? 0;
            const diff = targetVal - currentVal;

            // --- Label ---
            const prefix =
                stat.mode === ModifierMode.ACTIVE
                    ? "⚔ "
                    : stat.mode === ModifierMode.PASSIVE
                      ? "✦ "
                      : "";
            const labelColor =
                stat.mode === ModifierMode.ACTIVE
                    ? this._colors.active
                    : stat.mode === ModifierMode.PASSIVE
                      ? this._colors.passive
                      : this._colors.desc;

            const lbl = new TextBlock("", `${prefix}${stat.label}`);
            lbl.color = labelColor;
            lbl.fontSize = 13;
            lbl.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

            // Fix du padding : on passe des strings propres
            if (!isRight) {
                lbl.paddingLeft = `${this.STAT_INDENT_PX}px`;
            } else {
                lbl.paddingLeft = `${this.STAT_INDENT_PX + 10}px`;
            }

            this.addControl(lbl, gridRow, isRight ? 2 : 0);

            // --- Value ---
            const isBetter = stat.invert ? diff < 0 : diff > 0;
            const valColor =
                diff === 0
                    ? "white"
                    : isBetter
                      ? this._colors.success
                      : this._colors.error;
            const sign = diff >= 0 ? "+" : "-";
            const valStr =
                stat.id === "attackDuration"
                    ? targetVal.toFixed(2)
                    : Math.round(targetVal);
            const diffStr =
                stat.id === "attackDuration"
                    ? Math.abs(diff).toFixed(2)
                    : Math.round(Math.abs(diff));

            const valTxt = new TextBlock(
                "",
                `${valStr}${stat.suffix ?? ""} (${sign}${diffStr})`,
            );
            valTxt.color = valColor;
            valTxt.fontSize = 11;
            valTxt.fontWeight = "bold";
            valTxt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            valTxt.paddingRight = "5px";

            this.addControl(valTxt, gridRow, isRight ? 3 : 1);
        });
    }
}
