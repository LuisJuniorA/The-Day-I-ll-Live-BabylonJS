import { Scene, Vector3 } from "@babylonjs/core";
import { NPCInteractable } from "../core/abstracts/NPCInteractable";
import type { DialogueData } from "../core/data/NPCDialogues";

export class Villager extends NPCInteractable {
    public interactionRange: number = 3; // Distance max pour parler
    public _currentIndex: number = 0;


    constructor(scene: Scene, position: Vector3, data: DialogueData) {
        // NPC n'attend plus que (scene, position, data)
        super(scene, position, data);
    }
}