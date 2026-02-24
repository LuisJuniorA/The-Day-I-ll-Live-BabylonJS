import type { Interactable } from "../interfaces/Interactable";
import { OnInteractionAvailable } from "../interfaces/Interactable";
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
                isNear: isNear
            });

            console.log(`${this.name} est à portée : ${isNear}`);
        }
    }

    public onInteract(): void {
        console.log(this.data.texts[this._currentIndex++ % this.data.texts.length])
    }

    // Plus de calcul de distance ici !
    public update(dt: number): void {
        super.update(dt);
    }
}