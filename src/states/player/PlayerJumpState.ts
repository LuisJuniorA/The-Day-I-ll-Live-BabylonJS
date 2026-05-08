import { Scalar } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerFallingState } from "./PlayerFallingState";

export class PlayerJumpState extends BaseState<Player> {
    public readonly name = "JumpState";

    protected handleEnter(owner: Player): void {
        owner.velocity.y = owner.jumpForce; // L'impulsion initiale
        owner.isGrounded = false;
        owner.playAnim("jump", false);
    }

    protected handleUpdate(owner: Player, dt: number): void {
        // 1. Sauvegarde la position Y avant le mouvement
        const oldY = owner.transform.position.y;

        // 2. Mouvement aérien classique
        const targetX = owner.input.horizontal * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetX, 0.1);

        // Applique le mouvement
        owner.move(owner.velocity, dt);

        // 3. DETECTION PLAFOND
        // Si on essaie de monter (velocity.y > 0)
        // MAIS que notre position Y n'a presque pas progressé
        if (owner.velocity.y > 0 && owner.transform.position.y - oldY < 0.001) {
            owner.velocity.y = 0; // On stoppe l'ascension
        }

        // 4. TRANSITION
        // Si la vélocité devient nulle ou négative, on tombe
        if (owner.velocity.y <= 0) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        }
    }
}
