import { Scene, Vector3 } from "@babylonjs/core";
import { Entity } from "./Entity";
import type { NPCConfig } from "../../data/NPCData";
import { FSM } from "../engines/FSM";

export class NPC extends Entity {
    public readonly data: NPCConfig;

    // On peut quand même avoir une FSM pour le mouvement (Idle, Wander)
    // On précise <NPC> pour que les états sachent à qui ils parlent
    public movementFSM: FSM<NPC>;

    constructor(scene: Scene, position: Vector3, data: NPCConfig) {
        super(data.name, scene);
        this.data = data;
        this.transform.position = position.clone();

        this.movementFSM = new FSM<NPC>(this);
        // this.movementFSM.transitionTo(new NPCIdleState());
    }

    public update(dt: number): void {
        // Appelle la FSM définie dans Entity
        super.update(dt);
    }
}
