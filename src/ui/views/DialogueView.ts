import {
    Rectangle,
    TextBlock,
    Control,
    AdvancedDynamicTexture,
    Image,
} from "@babylonjs/gui";
import { Observable } from "@babylonjs/core";
import { BaseView } from "../../core/abstracts/BaseView";
import type { DialogueRequest } from "../../core/interfaces/Interactable";
import { PromptButtonComponent } from "../components/PromptButtonComponent";

export class DialogueView extends BaseView {
    // Configuration par défaut
    private static readonly DEFAULT_PORTRAIT =
        "textures/portraits/default_avatar.png";

    private _container!: Rectangle;
    private _portraitImage!: Image;
    private _nameText!: TextBlock;
    private _dialogueText!: TextBlock;
    private _promptButton!: PromptButtonComponent;

    // État du texte
    private _fullText: string = "";
    private _currentIndex: number = 0;
    private _timer: number = 0;
    private _isTyping: boolean = false;
    private _typingSpeed: number = 30;

    // Animation du bouton "E"
    private _promptAnimTimer: number = 0;

    private _currentRequest: DialogueRequest | null = null;

    // Événement de fin
    public onFinishObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "DialogueView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        // --- Container Principal ---
        this._container = new Rectangle("DialogueContainer");
        this._container.width = "80%";
        this._container.height = "180px";
        this._container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._container.top = "-50px";
        this._container.background = "rgba(0,0,0,0.85)";
        this._container.color = "white";
        this._container.thickness = 2;
        this._container.cornerRadius = 10;
        this.rootContainer.addControl(this._container);

        // --- Portrait ---
        this._portraitImage = new Image(
            "NPCPortrait",
            DialogueView.DEFAULT_PORTRAIT,
        );
        this._portraitImage.width = "130px";
        this._portraitImage.height = "130px";
        this._portraitImage.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._portraitImage.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_CENTER;
        this._portraitImage.left = "25px";
        this._portraitImage.stretch = Image.STRETCH_UNIFORM;
        this._portraitImage.isPointerBlocker = false;
        this._container.addControl(this._portraitImage);

        const textLeftOffset = "180px";

        // --- Nom du NPC ---
        this._nameText = new TextBlock("NPCName", "");
        this._nameText.color = "orange";
        this._nameText.fontSize = 28;
        this._nameText.fontWeight = "bold";
        this._nameText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._nameText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._nameText.paddingLeft = textLeftOffset;
        this._nameText.paddingTop = "20px";
        this._container.addControl(this._nameText);

        // --- Texte de dialogue ---
        this._dialogueText = new TextBlock("DialogueContent", "");
        this._dialogueText.color = "white";
        this._dialogueText.fontSize = 24;
        this._dialogueText.textWrapping = true;
        this._dialogueText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._dialogueText.textVerticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        this._dialogueText.paddingLeft = textLeftOffset;
        this._dialogueText.paddingRight = "60px"; // Marge à droite pour le bouton E
        this._dialogueText.paddingTop = "70px";
        this._container.addControl(this._dialogueText);

        // --- Bouton de Prompt (Le "E") ---
        this._promptButton = new PromptButtonComponent("DialoguePrompt", "E");
        this._promptButton.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._promptButton.verticalAlignment =
            Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._promptButton.left = "-20px";
        this._promptButton.top = "-20px";
        this._container.addControl(this._promptButton);
    }

    public requestDialogue(data: DialogueRequest): void {
        this._currentRequest = data;
        this._promptButton.isVisible = true;
        this.handleInteraction();
    }

    public handleInteraction(): void {
        // 1. Début d'un nouveau texte
        if (
            this._currentRequest &&
            this._fullText !== this._currentRequest.text
        ) {
            this._fullText = this._currentRequest.text;
            this._nameText.text = this._currentRequest.speakerName;

            const portraitUrl = this._currentRequest.portraitUrl;
            this._portraitImage.source =
                portraitUrl || DialogueView.DEFAULT_PORTRAIT;

            this._currentIndex = 0;
            this._dialogueText.text = "";
            this._timer = 0;
            this._isTyping = true;
            return;
        }

        // 2. Skip l'animation de frappe
        if (this._isTyping) {
            this._isTyping = false;
            this._dialogueText.text = this._fullText;
            this._currentIndex = this._fullText.length;
            return;
        }

        // 3. Passer à la suite (Le texte est déjà fini)
        if (this._currentRequest) {
            const canClose = this._currentRequest.onComplete();
            if (canClose) {
                this.onFinishObservable.notifyObservers();
            }
        }
    }

    public update(dt: number): void {
        if (!this.isVisible()) return;

        // Logique de l'effet "Typewriter"
        if (this._isTyping) {
            this._timer += dt * 1000;
            if (this._timer >= this._typingSpeed) {
                this._timer = 0;
                this._currentIndex++;
                this._dialogueText.text = this._fullText.substring(
                    0,
                    this._currentIndex,
                );

                if (this._currentIndex >= this._fullText.length) {
                    this._isTyping = false;
                    this._promptButton.isVisible = true;
                }
            }
        }

        // Animation de pulsation du bouton E
        if (this._promptButton.isVisible) {
            this._promptAnimTimer += dt * 4;
            // Oscille entre 0.4 et 1 d'opacité
            this._promptButton.alpha =
                0.7 + Math.sin(this._promptAnimTimer) * 0.3;
        }
    }

    public reset(): void {
        this.hide();
        this._currentRequest = null;
        this._fullText = "";
        this._dialogueText.text = "";
        this._promptButton.isVisible = false;
        this._portraitImage.source = DialogueView.DEFAULT_PORTRAIT;
    }

    public get isTyping(): boolean {
        return this._isTyping;
    }
}
