import {
    Rectangle,
    TextBlock,
    Control,
    AdvancedDynamicTexture,
} from "@babylonjs/gui";
import { Observable } from "@babylonjs/core";
import { BaseView } from "../../core/abstracts/BaseView";
import type { DialogueRequest } from "../../core/interfaces/Interactable";

export class DialogueView extends BaseView {
    private _container!: Rectangle;
    private _nameText!: TextBlock;
    private _dialogueText!: TextBlock;

    private _fullText: string = "";
    private _currentIndex: number = 0;
    private _timer: number = 0;
    private _isTyping: boolean = false;
    private _typingSpeed: number = 30;

    private _currentRequest: DialogueRequest | null = null;

    // L'événement que l'UIManager va écouter
    public onFinishObservable = new Observable<void>();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "DialogueView");
        this.buildUI();
        this.hide();
    }

    protected buildUI(): void {
        this._container = new Rectangle("DialogueContainer");
        this._container.width = "80%";
        this._container.height = "150px";
        this._container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._container.top = "-50px";
        this._container.background = "rgba(0,0,0,0.8)";
        this._container.color = "white";
        this._container.thickness = 2;
        this._container.cornerRadius = 10;
        this.rootContainer.addControl(this._container);

        this._nameText = new TextBlock("NPCName", "");
        this._nameText.color = "orange";
        this._nameText.fontSize = 24;
        this._nameText.fontWeight = "bold";
        this._nameText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._nameText.paddingLeft = "20px";
        this._nameText.top = "-45px";
        this._container.addControl(this._nameText);

        this._dialogueText = new TextBlock("DialogueContent", "");
        this._dialogueText.color = "white";
        this._dialogueText.fontSize = 20;
        this._dialogueText.textWrapping = true;
        this._dialogueText.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._dialogueText.textVerticalAlignment =
            Control.VERTICAL_ALIGNMENT_TOP;
        this._dialogueText.paddingLeft = "20px";
        this._dialogueText.paddingTop = "40px";
        this._container.addControl(this._dialogueText);
    }

    public requestDialogue(data: DialogueRequest): void {
        this._currentRequest = data;
        this.handleInteraction();
    }

    public handleInteraction(): void {
        if (
            this._currentRequest &&
            this._fullText !== this._currentRequest.text
        ) {
            this._fullText = this._currentRequest.text;
            this._nameText.text = this._currentRequest.speakerName;
            this._currentIndex = 0;
            this._dialogueText.text = "";
            this._timer = 0;
            this._isTyping = true;
            return;
        }

        // 2. Skip : On est en train de taper
        if (this._isTyping) {
            this._isTyping = false;
            this._dialogueText.text = this._fullText;
            this._currentIndex = this._fullText.length;
            return;
        }

        // 3. Suivant : Le texte est fini, on demande au NPC
        if (this._currentRequest) {
            const canClose = this._currentRequest.onComplete();
            if (canClose) {
                this.onFinishObservable.notifyObservers();
            }
        }
    }

    public update(dt: number): void {
        if (!this._isTyping || !this.isVisible()) return;

        this._timer += dt * 1000;
        if (this._timer >= this._typingSpeed) {
            this._timer = 0;
            this._dialogueText.text += this._fullText[this._currentIndex];
            this._currentIndex++;

            if (this._currentIndex >= this._fullText.length) {
                this._isTyping = false;
            }
        }
    }

    /**
     * Nettoyage forcé par l'extérieur
     */
    public reset(): void {
        this.hide();
        this._currentRequest = null;
        this._fullText = "";
        this._dialogueText.text = "";
    }

    public get isTyping(): boolean {
        return this._isTyping;
    }
}
