import { Scalar } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerFallingState } from "./PlayerFallingState";

export class PlayerJumpState extends BaseState<Player> {
    public readonly name = "JumpState";

    protected handleEnter(owner: Player): void {
        // Impulsion initiale (Vitesse instantanée vers le haut)
        // ex: owner.jumpForce = 15
        owner.velocity.y = owner.jumpForce;
        owner.isGrounded = false;

        owner.playAnim("jump", false);
    }

    protected handleUpdate(owner: Player, dt: number): void {
        // 1. Mouvement latéral en l'air (Inertie aérienne)
        const targetX = owner.input.horizontal * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetX, 0.1);

        // 2. Gravité (Accélération constante vers le bas)
        owner.velocity.y += owner.gravity;

        // 3. APPLICATION DU MOUVEMENT PRO
        owner.move(owner.velocity, dt);

        // 4. Transition vers la chute
        if (owner.velocity.y <= 0) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        }
    }
}
