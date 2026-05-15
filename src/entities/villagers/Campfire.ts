import { NPCInteractable } from "../../core/abstracts/NPCInteractable";
import { OnOpenBonfire } from "../../core/interfaces/BonfireEvent";
import { OnDialogueRequest } from "../../core/interfaces/Interactable";

export class Campfire extends NPCInteractable {
    public onInteract(): void {
        const text =
            this.data.texts?.[this._currentIndex] ||
            "Le feu brûle silencieusement...";

        OnDialogueRequest.notifyObservers({
            speakerName: "FEU DE CAMP",
            text: text,
            onComplete: () => {
                // Le Campfire ne passe RIEN, il dit juste "Ouvre-toi"
                OnOpenBonfire.notifyObservers();

                this._currentIndex = 0;
                return true;
            },
        });
    }
}
