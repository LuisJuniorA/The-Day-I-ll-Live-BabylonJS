import { NPCInteractable } from "../../core/abstracts/NPCInteractable";
import { OnOpenBonfire } from "../../core/interfaces/BonfireEvent";
import { OnDialogueRequest } from "../../core/interfaces/Interactable";
import { CheckpointManager } from "../../managers/CheckpointManager"; // Ajuste le chemin

export class Campfire extends NPCInteractable {
    public onInteract(): void {
        const text =
            this.data.texts?.[this._currentIndex] || "Such a beautiful day...";

        OnDialogueRequest.notifyObservers({
            speakerName: "CAMPFIRE",
            text: text,
            onComplete: () => {
                // On met à jour le checkpoint mondial avec la position de CE feu de camp
                CheckpointManager.getInstance().setRespawnPosition(
                    this.transform.position,
                );

                // Ouvre l'interface du Bonfire
                OnOpenBonfire.notifyObservers();

                this._currentIndex = 0;
                return true;
            },
            portraitUrl: "./assets/img/portrait/campfire.png",
        });
    }
}
