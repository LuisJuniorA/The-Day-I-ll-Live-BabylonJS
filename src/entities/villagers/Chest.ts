import { NPCInteractable } from "../../core/abstracts/NPCInteractable";
import {
    OnChestOpened,
    type ChestReward,
} from "../../core/interfaces/Interactable";
import { Scene, Vector3 } from "@babylonjs/core";
import { AudioManager } from "../../managers/AudioManager";

export class Chest extends NPCInteractable {
    private _isOpened: boolean = false;
    private _reward: ChestReward;

    constructor(scene: Scene, position: Vector3, data: any) {
        super(scene, position, data);

        // Extraction des récompenses depuis NPCData
        // On s'assure qu'on a au moins un objet vide par défaut
        this._reward = data.metadata?.reward || { items: [], spells: [] };
    }

    public onInteract(): void {
        AudioManager.getInstance().playSfx("OPEN_CHEST");
        if (this._isOpened) {
            this.showSimpleMessage("The chest is empty.");
            return;
        }

        this.openChest();
    }

    private openChest(): void {
        this._isOpened = true;

        // Notification globale : le système d'inventaire/sorts écoutera cet event
        OnChestOpened.notifyObservers(this._reward);
        this.showSimpleMessage("You found items inside the chest!");
        this.interactionRange = 0;
    }

    private showSimpleMessage(text: string): void {
        console.log("Chest message:", text);
    }
}
