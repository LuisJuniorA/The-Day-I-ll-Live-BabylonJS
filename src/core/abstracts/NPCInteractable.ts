import type { Interactable } from "../interfaces/Interactable";
import {
    OnDialogueRequest,
    OnInteractionAvailable,
} from "../interfaces/Interactable";
import { NPC } from "./NPC";

export class NPCInteractable extends NPC implements Interactable {
    public interactionRange: number = 3;
    private _isNear: boolean = false;
    protected _currentIndex: number = 0;

    public setProximityState(isNear: boolean): void {
        if (this._isNear !== isNear) {
            this._isNear = isNear;

            OnInteractionAvailable.notifyObservers({
                interactable: this,
                isNear: isNear,
            });

            console.log(`${this.name} est à portée : ${isNear}`);
        }
    }

    public onInteract(): void {
        const text = this.data.texts[this._currentIndex];

        OnDialogueRequest.notifyObservers({
            speakerName: this.name,
            text: text,
            onComplete: () => {
                this._currentIndex++;
                if (this._currentIndex >= this.data.texts.length) {
                    this._currentIndex = 0;
                    return true;
                }
                this.onInteract();
                return false;
            },
        });
    }

    // Plus de calcul de distance ici !
    public update(dt: number): void {
        super.update(dt);
    }
}
