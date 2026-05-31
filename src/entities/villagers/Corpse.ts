import { NPCInteractable } from "../../core/abstracts/NPCInteractable";
import {
    OnDialogueRequest,
    OnInitialGearAcquired,
} from "../../core/interfaces/Interactable";
import { WeaponSlot } from "../../core/types/WeaponTypes";

export class Corpse extends NPCInteractable {
    private _hasGivenGear: boolean = false;
    private _loreTextLines: string[] = [
        "It is as if he died only a moment ago.",
        "Etched on the chest plate, the name 'Valerius' is barely visible.",
        "He was a traveler like you, someone who dared to dream of the surface.",
        "He didn't make it, but his struggle is now your legacy.",
        "[You can press E to open inventory and equip your new gear]",
    ];

    public onInteract(): void {
        if (this._hasGivenGear) {
            this.showSimpleMessage(
                "This traveler's body is cold. There is nothing left.",
            );
            return;
        }

        OnDialogueRequest.notifyObservers({
            speakerName: "FALLEN TRAVELER",
            text: this._loreTextLines[this._currentIndex],
            portraitUrl: "./assets/img/portrait/corpse.png",
            onComplete: () => {
                this._currentIndex++;

                // Si il reste du texte à afficher, on rappelle onInteract
                if (this._currentIndex < this._loreTextLines.length) {
                    this.onInteract();
                    return false;
                }

                // Fin du texte : on donne le loot et on réinitialise l'index
                this.giveInitialGear();
                this._hasGivenGear = true;
                this._currentIndex = 0;

                return true;
            },
        });
    }

    private giveInitialGear(): void {
        const starterWeapons = [
            { slot: WeaponSlot.SWORD, id: "knight_sword" },
            { slot: WeaponSlot.DAGGER, id: "fish_knife" },
            { slot: WeaponSlot.GREATSWORD, id: "great_imperial_sword" },
        ];

        OnInitialGearAcquired.notifyObservers({ items: starterWeapons });
    }

    private showSimpleMessage(text: string): void {
        OnDialogueRequest.notifyObservers({
            speakerName: "...",
            text: text,
            onComplete: () => true,
            portraitUrl: "./assets/img/portrait/corpse.png",
        });
    }
}
