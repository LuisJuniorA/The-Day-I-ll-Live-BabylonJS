import {
    Rectangle,
    StackPanel,
    Control,
    TextBlock,
    AdvancedDynamicTexture,
} from "@babylonjs/gui";
import { Observable } from "@babylonjs/core";
import { BaseView } from "../../core/abstracts/BaseView";
import { MenuButton } from "../components/MenuButton";

export class PauseMenuView extends BaseView {
    public onResumeObservable = new Observable<void>();
    public onSettingsObservable = new Observable<void>(); // <-- Ajouté
    public onMainMenuObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "PauseMenuView");
        this.buildUI();
    }

    protected buildUI(): void {
        // 1. Voile sombre oppressant
        const overlay = new Rectangle("pauseOverlay");
        overlay.width = "100%";
        overlay.height = "100%";
        overlay.thickness = 0;
        overlay.background = "rgba(5, 5, 8, 0.85)"; // Noir profond légèrement bleuté
        this.rootContainer.addControl(overlay);

        // 2. Panneau central
        const panel = new StackPanel("pausePanel");
        panel.width = "400px"; // Légèrement élargi pour accommoder les textes longs
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.rootContainer.addControl(panel);

        // 3. Titre
        const titleText = new TextBlock("pauseTitle", "EN PAUSE");
        titleText.height = "80px";
        titleText.color = "white";
        titleText.fontSize = 32;
        titleText.fontFamily = "Georgia, serif";
        panel.addControl(titleText);

        // 4. Boutons alignés au centre

        // --- BOUTON REPRENDRE ---
        const resumeBtn = new MenuButton(
            "resumeBtn",
            "REPRENDRE",
            Control.HORIZONTAL_ALIGNMENT_CENTER,
        );
        resumeBtn.onPointerUpObservable.add(() =>
            this.onResumeObservable.notifyObservers(),
        );
        panel.addControl(resumeBtn);

        // --- BOUTON OPTIONS ---
        const settingsBtn = new MenuButton(
            "settingsBtn",
            "OPTIONS",
            Control.HORIZONTAL_ALIGNMENT_CENTER,
        );
        settingsBtn.onPointerUpObservable.add(() =>
            this.onSettingsObservable.notifyObservers(),
        );
        panel.addControl(settingsBtn);

        // --- BOUTON MENU PRINCIPAL ---
        const menuBtn = new MenuButton(
            "menuBtn",
            "MENU PRINCIPAL",
            Control.HORIZONTAL_ALIGNMENT_CENTER,
        );
        menuBtn.onPointerUpObservable.add(() =>
            this.onMainMenuObservable.notifyObservers(),
        );
        panel.addControl(menuBtn);
    }
}
