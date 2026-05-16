import {
    StackPanel,
    TextBlock,
    Control,
    AdvancedDynamicTexture,
    Rectangle,
} from "@babylonjs/gui";
import { Observable } from "@babylonjs/core";
import { BaseView } from "../../core/abstracts/BaseView";
import { MenuButton } from "../components/MenuButton";
import { AudioManager } from "../../managers/AudioManager";

export class DeathScreenView extends BaseView {
    // Événements pour le GameManager / SceneManager
    public onRetryObservable = new Observable<void>();
    public onMainMenuObservable = new Observable<void>();

    private _fadeBackground: Rectangle | null = null;
    private _contentPanel: StackPanel | null = null;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "DeathScreenView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this.rootContainer.clearControls();

        // --- 1. FOND DE TEINTE SOMBRE AVEC EFFET DE CADRE (VIGNETTE) ---
        this._fadeBackground = new Rectangle("deathBg");
        this._fadeBackground.width = "100%";
        this._fadeBackground.height = "100%";
        this._fadeBackground.thickness = 0;
        this._fadeBackground.background = "rgba(4, 2, 3, 0.85)"; // Presque noir, légère teinte de sang séché
        this.rootContainer.addControl(this._fadeBackground);

        // --- Container Principal des Textes et Boutons ---
        this._contentPanel = new StackPanel("deathContent");
        this._contentPanel.width = "600px";
        this._contentPanel.spacing = 30;
        this._contentPanel.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_CENTER;
        this._contentPanel.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.rootContainer.addControl(this._contentPanel);

        // --- 2. TEXTE DE SOUFFRANCE / ÉPITAPHE ---
        const epitaph = new TextBlock(
            "epitaph",
            "EVERYTHING IS FADING AWAY...",
        );
        epitaph.height = "40px";
        epitaph.color = "#555555";
        epitaph.fontSize = 16;
        epitaph.fontFamily = "Georgia, serif";
        epitaph.fontStyle = "italic";
        this._contentPanel.addControl(epitaph);

        // --- 3. TITRE MASSACRE / GAME OVER ---
        const deathTitle = new TextBlock("deathTitle", "YOU DIED");
        deathTitle.height = "90px";
        deathTitle.color = "#991b1b"; // Rouge sang profond / usé
        deathTitle.fontSize = 48;
        deathTitle.fontWeight = "bold";
        deathTitle.fontFamily = "Georgia, serif";
        deathTitle.shadowBlur = 15;
        deathTitle.shadowColor = "rgba(153, 27, 27, 0.5)"; // Lueur résiduelle rouge
        this._contentPanel.addControl(deathTitle);

        // Séparateur physique minimaliste en code
        const divider = new Rectangle("divider");
        divider.width = "120px";
        divider.height = "1px";
        divider.thickness = 1;
        divider.color = "#441111";
        this._contentPanel.addControl(divider);

        // Espaceur avant les choix
        const spacer = new Rectangle("deathSpacer");
        spacer.height = "20px";
        spacer.thickness = 0;
        this._contentPanel.addControl(spacer);

        // --- 4. OPTIONS DE REPLI (Boutons centrés) ---
        const retryBtn = new MenuButton(
            "retryBtn",
            "REVIVE",
            Control.HORIZONTAL_ALIGNMENT_CENTER,
        );
        retryBtn.onPointerUpObservable.add(() => {
            this.hide();
            this.onRetryObservable.notifyObservers();
        });
        this._contentPanel.addControl(retryBtn);

        const abandonBtn = new MenuButton(
            "abandonBtn",
            "QUIT",
            Control.HORIZONTAL_ALIGNMENT_CENTER,
        );
        abandonBtn.onPointerUpObservable.add(() => {
            this.hide();
            this.onMainMenuObservable.notifyObservers();
        });
        this._contentPanel.addControl(abandonBtn);
    }

    /**
     * Surchargé pour déclencher l'apparition dramatique et la musique de mort
     */
    public override show(): void {
        super.show();

        // 1. Déclenchement de la musique de Game Over
        AudioManager.getInstance().playMusic("DEATH_THEME");

        // 2. Animation d'entrée en pur code (Fade-in simple basé sur l'alpha)
        if (this._fadeBackground && this._contentPanel) {
            this._fadeBackground.alpha = 0;
            this._contentPanel.alpha = 0;

            let currentAlpha = 0;
            const scene = this.advancedTexture.getScene();

            if (scene) {
                const fadeObserver = scene.onBeforeRenderObservable.add(() => {
                    currentAlpha += 0.02; // Vitesse du fondu

                    if (this._fadeBackground)
                        this._fadeBackground.alpha = currentAlpha * 0.85;
                    if (this._contentPanel)
                        this._contentPanel.alpha = currentAlpha;

                    if (currentAlpha >= 1) {
                        scene.onBeforeRenderObservable.remove(fadeObserver);
                    }
                });
            } else {
                // Rempli direct si la scène n'est pas encore accessible
                this._fadeBackground.alpha = 0.85;
                this._contentPanel.alpha = 1;
            }
        }
    }
}
