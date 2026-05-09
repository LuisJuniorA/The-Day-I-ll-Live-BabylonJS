import {
    Image,
    StackPanel,
    Control,
    TextBlock,
    Rectangle,
    AdvancedDynamicTexture,
} from "@babylonjs/gui";
import { Observable } from "@babylonjs/core";
import { BaseView } from "../../core/abstracts/BaseView";
import { MenuButton } from "../components/MenuButton";

export class MainMenuView extends BaseView {
    // Événements pour le manager
    public onPlayObservable = new Observable<void>();
    public onSettingsObservable = new Observable<void>();
    public onQuitObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "MainMenuView");
        this.buildUI();
    }

    protected buildUI(): void {
        // 1. Image de fond (Artwork)
        const bgImage = new Image(
            "mainMenuBg",
            "/assets/img/menu_background.jpg",
        );
        bgImage.stretch = Image.STRETCH_NONE;
        this.rootContainer.addControl(bgImage);

        // 2. Panneau droit pour regrouper le titre et les boutons
        const rightPanel = new StackPanel("rightPanel");
        rightPanel.width = "600px";
        rightPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rightPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        rightPanel.paddingRight = "80px"; // Marge pour ne pas coller à l'écran
        this.rootContainer.addControl(rightPanel);

        // 3. Titre du jeu
        const titleText = new TextBlock("gameTitle", "THE DAY I'LL LIVE");
        titleText.height = "100px";
        titleText.color = "#ffffff";
        titleText.fontSize = 42;
        titleText.fontWeight = "bold";
        titleText.fontFamily = "Georgia, serif";
        titleText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        titleText.shadowBlur = 20;
        titleText.shadowColor = "rgba(255, 255, 255, 0.4)"; // Lueur persistante sur le titre
        rightPanel.addControl(titleText);

        // Espaceur entre le titre et les boutons
        const spacer = new Rectangle("spacer");
        spacer.height = "60px";
        spacer.thickness = 0;
        rightPanel.addControl(spacer);

        // 4. Boutons alignés à droite
        const playBtn = new MenuButton(
            "playBtn",
            "COMMENCER",
            Control.HORIZONTAL_ALIGNMENT_RIGHT,
        );
        playBtn.onPointerUpObservable.add(() =>
            this.onPlayObservable.notifyObservers(),
        );
        rightPanel.addControl(playBtn);

        const settingsBtn = new MenuButton(
            "settingsBtn",
            "OPTIONS",
            Control.HORIZONTAL_ALIGNMENT_RIGHT,
        );
        settingsBtn.onPointerUpObservable.add(() =>
            this.onSettingsObservable.notifyObservers(),
        );
        rightPanel.addControl(settingsBtn);

        const quitBtn = new MenuButton(
            "quitBtn",
            "QUITTER",
            Control.HORIZONTAL_ALIGNMENT_RIGHT,
        );
        quitBtn.onPointerUpObservable.add(() =>
            this.onQuitObservable.notifyObservers(),
        );
        rightPanel.addControl(quitBtn);
    }
}
