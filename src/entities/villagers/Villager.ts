import { Scene, Vector3 } from "@babylonjs/core";
import { NPCInteractable } from "../../core/abstracts/NPCInteractable";
import type { NPCConfig } from "../../data/NPCData";

export class Villager extends NPCInteractable {
    public interactionRange: number = 3; // Distance max pour parler
    public _currentIndex: number = 0;

    constructor(scene: Scene, position: Vector3, data: NPCConfig) {
        // NPC n'attend plus que (scene, position, data)
        super(scene, position, data);
    }
}
