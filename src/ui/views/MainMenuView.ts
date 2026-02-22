import { StackPanel, Control } from "@babylonjs/gui";
import { Observable } from "@babylonjs/core";
import { BaseView } from "../../core/abstracts/BaseView";
import { MenuButton } from "../components/MenuButton";
import { AdvancedDynamicTexture } from "@babylonjs/gui";

export class MainMenuView extends BaseView {
    // Événements pour le manager
    public onResumeObservable = new Observable<void>();
    public onQuitObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "MainMenuView");
        this.buildUI();
    }

    protected buildUI(): void {
        const panel = new StackPanel();
        panel.width = "300px";
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.rootContainer.addControl(panel);

        // On instancie simplement nos nouveaux composants
        const resumeBtn = new MenuButton("resumeBtn", "RESUME");
        resumeBtn.onPointerUpObservable.add(() => this.onResumeObservable.notifyObservers());

        const quitBtn = new MenuButton("quitBtn", "QUIT GAME");
        quitBtn.paddingTop = "20px";
        quitBtn.onPointerUpObservable.add(() => this.onQuitObservable.notifyObservers());

        panel.addControl(resumeBtn);
        panel.addControl(quitBtn);
    }

}