import {
    StackPanel,
    TextBlock,
    Control,
    AdvancedDynamicTexture,
    Rectangle,
} from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { MenuButton } from "../components/MenuButton";
import { AudioManager } from "../../managers/AudioManager";

export class VictoryScreenView extends BaseView {
    private _fadeBackground: Rectangle | null = null;
    private _contentPanel: StackPanel | null = null;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "VictoryScreenView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this.rootContainer.clearControls();

        // --- 1. FOND DORÉ PROFOND ---
        this._fadeBackground = new Rectangle("victoryBg");
        this._fadeBackground.width = "100%";
        this._fadeBackground.height = "100%";
        this._fadeBackground.thickness = 0;
        this._fadeBackground.background = "rgba(40, 30, 0, 0.9)";
        this.rootContainer.addControl(this._fadeBackground);

        // --- Container Principal ---
        this._contentPanel = new StackPanel("victoryContent");
        this._contentPanel.width = "600px";
        this._contentPanel.spacing = 30;
        this._contentPanel.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_CENTER;
        this.rootContainer.addControl(this._contentPanel);

        // --- 2. TEXTE D'APOTHÉOSE ---
        const epitaph = new TextBlock(
            "victoryEpitaph",
            "THE SHADOW HAS BEEN BANISHED",
        );
        epitaph.height = "40px";
        epitaph.color = "#d4af37"; // Or
        epitaph.fontSize = 18;
        epitaph.fontFamily = "Georgia, serif";
        epitaph.fontStyle = "italic";
        this._contentPanel.addControl(epitaph);

        // --- 3. TITRE VICTOIRE ---
        const victoryTitle = new TextBlock("victoryTitle", "VICTORY");
        victoryTitle.height = "90px";
        victoryTitle.color = "#ffffff";
        victoryTitle.fontSize = 60;
        victoryTitle.fontWeight = "bold";
        victoryTitle.fontFamily = "Georgia, serif";
        victoryTitle.shadowBlur = 20;
        victoryTitle.shadowColor = "#d4af37";
        this._contentPanel.addControl(victoryTitle);

        // Séparateur
        const divider = new Rectangle("divider");
        divider.width = "150px";
        divider.height = "1px";
        divider.thickness = 1;
        divider.color = "#d4af37";
        this._contentPanel.addControl(divider);

        // --- 4. BOUTON DE RESTART (RAFRAÎCHISSEMENT) ---
        const restartBtn = new MenuButton(
            "restartBtn",
            "RESTART",
            Control.HORIZONTAL_ALIGNMENT_CENTER,
        );
        restartBtn.onPointerUpObservable.add(() => {
            // Animation de fin ou son de confirmation ici si besoin
            AudioManager.getInstance().playSfx("UI_CLICK");

            // Rafraîchissement complet pour réinitialiser le moteur et l'état
            window.location.reload();
        });
        this._contentPanel.addControl(restartBtn);
    }

    public override show(): void {
        super.show();

        // 1. Musique de victoire

        // 2. Animation d'apparition
        if (this._fadeBackground && this._contentPanel) {
            this._fadeBackground.alpha = 0;
            this._contentPanel.alpha = 0;

            let currentAlpha = 0;
            const scene = this.advancedTexture.getScene();

            if (scene) {
                const fadeObserver = scene.onBeforeRenderObservable.add(() => {
                    currentAlpha += 0.015;
                    this._fadeBackground!.alpha = currentAlpha * 0.9;
                    this._contentPanel!.alpha = currentAlpha;

                    if (currentAlpha >= 1) {
                        scene.onBeforeRenderObservable.remove(fadeObserver);
                    }
                });
            } else {
                this._fadeBackground.alpha = 0.9;
                this._contentPanel.alpha = 1;
            }
        }
    }
}
