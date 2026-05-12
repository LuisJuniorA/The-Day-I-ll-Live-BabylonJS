import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerFallingState } from "./PlayerFallingState";
import { Vector3 } from "@babylonjs/core";

export class PlayerJumpState extends BaseState<Player> {
    public readonly name = "JumpState";

    protected handleEnter(owner: Player): void {
        owner.velocity.y = owner.jumpForce;
        owner.isGrounded = false;
        owner.playAnim("jump", false);
    }

    protected handleUpdate(owner: Player, dt: number): void {
        const moveX = owner.input.horizontal;

        // On envoie l'intention (X) au Player qui gère déjà le Y (gravité)
        owner.move(new Vector3(moveX, 0, 0), dt);

        // Détection plafond simple : si on monte mais qu'on ne bouge plus sur Y
        // (Babylon gère la collision, on reset juste la vélocité pour tomber)
        if (
            owner.velocity.y > 0 &&
            owner.mesh?.moveWithCollisions &&
            owner.velocity.y < 0.1
        ) {
            // Si besoin d'une détection précise, c'est ici
        }

        if (owner.velocity.y <= 0) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        }
    }
}
