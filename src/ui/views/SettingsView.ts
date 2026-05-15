import {
    StackPanel,
    Button,
    TextBlock,
    Control,
    AdvancedDynamicTexture,
    Rectangle,
    Grid,
    Container,
} from "@babylonjs/gui";
import { KeyboardEventTypes, Observable } from "@babylonjs/core";
import { BaseView } from "../../core/abstracts/BaseView";
import {
    InputConfig,
    type PlayerAction,
} from "../../core/constants/InputConfig";
import { AudioManager } from "../../managers/AudioManager";

export class SettingsView extends BaseView {
    private _listGrid: Grid | null = null;
    private _isRebinding: boolean = false;
    private _rebindingAction: PlayerAction | null = null;

    // Couleurs du thème (Délabré / Sombre)
    private readonly _COLOR_BG = "#050508";
    private readonly _COLOR_BORDER = "#444444";
    private readonly _COLOR_BORDER_HIGHLIGHT = "#aaaaaa";
    private readonly _COLOR_TEXT_DIM = "#aaaaaa";
    private readonly _COLOR_TEXT_BRIGHT = "#ffffff";
    private readonly _COLOR_REBIND = "#cc3333";

    public onBackObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "SettingsView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this.rootContainer.clearControls();

        // --- 1. FOND ÉCRAN SOMBRE ---
        const bgRect = new Rectangle("settingsBg");
        bgRect.width = "100%";
        bgRect.height = "100%";
        bgRect.thickness = 0;
        bgRect.background = this._COLOR_BG;
        this.rootContainer.addControl(bgRect);

        // --- Container Principal centré ---
        const mainPanel = new StackPanel("settingsMain");
        mainPanel.width = "800px";
        mainPanel.spacing = 20;
        this.rootContainer.addControl(mainPanel);

        // --- 2. TITRE ---
        const title = new TextBlock("title", "CONFIGURER LES CONTRÔLES");
        title.height = "80px";
        title.color = this._COLOR_TEXT_BRIGHT;
        title.fontSize = 36;
        title.fontFamily = "Georgia, serif";
        title.shadowBlur = 10;
        title.shadowColor = "rgba(255,255,255,0.2)";
        mainPanel.addControl(title);

        // --- 3. PANEL DES PRESETS ---
        const presetPanel = new StackPanel("presets");
        presetPanel.isVertical = false;
        presetPanel.height = "70px";
        presetPanel.spacing = 20;
        mainPanel.addControl(presetPanel);

        this._createStyledMenuButton(presetPanel, "LAYOUT: AZERTY", () => {
            InputConfig.current = { ...InputConfig.AZERTY };
            InputConfig.save();
            this.refreshList();
        });

        this._createStyledMenuButton(presetPanel, "LAYOUT: QWERTY", () => {
            InputConfig.current = { ...InputConfig.QWERTY };
            InputConfig.save();
            this.refreshList();
        });

        // --- 4. LISTE DES TOUCHES ---
        const gridContainer = new Rectangle("gridContainer");
        gridContainer.height = "400px";
        gridContainer.width = "90%";
        gridContainer.thickness = 1;
        gridContainer.cornerRadius = 5;
        gridContainer.color = this._COLOR_BORDER;
        gridContainer.background = "rgba(0,0,0,0.3)";
        gridContainer.paddingTop = "20px";
        gridContainer.paddingBottom = "20px";
        gridContainer.paddingLeft = "40px";
        gridContainer.paddingRight = "40px";
        mainPanel.addControl(gridContainer);

        this._listGrid = new Grid("keyListGrid");
        this._listGrid.width = "100%";
        this._listGrid.height = "100%";
        this._listGrid.addColumnDefinition(0.6);
        this._listGrid.addColumnDefinition(0.4);
        gridContainer.addControl(this._listGrid);

        this.refreshList();

        // --- 5. BOUTON RETOUR ---
        const footer = new StackPanel("footer");
        footer.height = "100px";
        footer.paddingTop = "20px";
        mainPanel.addControl(footer);

        this._createStyledMenuButton(footer, "RETOUR AU MENU", () => {
            if (this._isRebinding) return;
            this.hide();
            this.onBackObservable.notifyObservers();
        });
    }

    public refreshList(): void {
        if (!this._listGrid) return;

        this._listGrid.clearControls();
        const grid = this._listGrid as any;
        if (grid._rowDefinitions) {
            grid._rowDefinitions = [];
        }

        const actions: { label: string; id: PlayerAction }[] = [
            { label: "ALLER À GAUCHE", id: "left" },
            { label: "ALLER À DROITE", id: "right" },
            { label: "SAUTER", id: "jump" },
            { label: "ATTAQUER", id: "attack" },
            { label: "LANCER UN SORT", id: "cast" },
            { label: "CHANGER D'ARME", id: "switch" },
            { label: "INTERAGIR", id: "interact" },
        ];

        actions.forEach((action, index) => {
            this._listGrid!.addRowDefinition(1 / actions.length, false);

            const label = new TextBlock("lbl_" + action.id, action.label);
            label.color = this._COLOR_TEXT_DIM;
            label.fontSize = 18;
            label.fontFamily = "Verdana, sans-serif";
            label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            label.paddingLeft = "20px";
            this._listGrid!.addControl(label, index, 0);

            const keyBtn = this._createKeyRebindButton(action.id);
            this._listGrid!.addControl(keyBtn, index, 1);
        });
    }

    private _createKeyRebindButton(actionId: PlayerAction): Control {
        const container = new Rectangle("btnContainer_" + actionId);
        container.thickness = 0;
        container.width = "100%";
        container.height = "100%";

        const currentKeyRaw = InputConfig.current[actionId][0];
        const displayKey =
            currentKeyRaw === " " ? "ESPACE" : currentKeyRaw.toUpperCase();

        const btn = Button.CreateSimpleButton("btn_" + actionId, displayKey);
        btn.width = "160px";
        btn.height = "36px";
        btn.color = this._COLOR_BORDER;
        btn.fontSize = 16;
        btn.fontWeight = "bold";
        btn.background = "#222222";
        btn.cornerRadius = 3;
        btn.thickness = 1;
        btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        btn.setPaddingInPixels(0, 20);

        btn.onPointerEnterObservable.add(() => {
            if (this._isRebinding) return;
            btn.color = this._COLOR_BORDER_HIGHLIGHT;
            btn.background = "#333333";
        });

        btn.onPointerOutObservable.add(() => {
            if (this._isRebinding && this._rebindingAction === actionId) return;
            btn.color = this._COLOR_BORDER;
            btn.background = "#222222";
        });

        btn.onPointerClickObservable.add(() => {
            if (this._isRebinding) return;
            AudioManager.getInstance().playSfx("UI_CLICK");
            this.startRebind(actionId, btn);
        });

        container.addControl(btn);
        return container;
    }

    private startRebind(actionId: PlayerAction, button: Button): void {
        this._isRebinding = true;
        this._rebindingAction = actionId;

        const buttonText = button.children[0] as TextBlock;
        if (buttonText) buttonText.text = "...";
        button.background = this._COLOR_REBIND;

        const scene = this.advancedTexture.getScene();
        if (!scene || !scene.onKeyboardObservable) return;

        const obs = scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                const newKey = kbInfo.event.key.toLowerCase();

                // Gestion des doublons
                for (const key in InputConfig.current) {
                    const action = key as PlayerAction;
                    if (action !== actionId) {
                        const keys = InputConfig.current[action];
                        if (keys.includes(newKey)) {
                            InputConfig.setKey(action, "none");
                        }
                    }
                }

                InputConfig.setKey(actionId, newKey);

                // Feedback sonore de réussite
                AudioManager.getInstance().playSfx("UI_CLICK");

                scene.onKeyboardObservable.remove(obs);
                this._isRebinding = false;
                this._rebindingAction = null;
                this.refreshList();
            }
        });
    }

    private _createStyledMenuButton(
        parent: Container,
        text: string,
        onClick: () => void,
    ): Button {
        const btn = Button.CreateSimpleButton("menuBtn_" + text, text);
        btn.height = "50px";
        btn.width = "220px";
        btn.color = this._COLOR_TEXT_DIM;
        btn.fontSize = 18;
        btn.fontFamily = "Georgia, serif";
        btn.background = "#1a1a1a";
        btn.cornerRadius = 8;
        btn.thickness = 2;
        btn.color = "#333333";

        btn.onPointerEnterObservable.add(() => {
            btn.background = "#252525";
            btn.color = this._COLOR_BORDER_HIGHLIGHT;
        });

        btn.onPointerOutObservable.add(() => {
            btn.background = "#1a1a1a";
            btn.color = "#333333";
        });

        btn.onPointerClickObservable.add(() => {
            AudioManager.getInstance().playSfx("UI_CLICK");
            onClick();
        });

        parent.addControl(btn);
        return btn;
    }

    public override show(): void {
        InputConfig.load();
        this.refreshList();
        super.show();
    }
}
