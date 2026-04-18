import { Scalar } from "@babylonjs/core";
import { Player } from "../../entities/Player";
import { BaseState } from "../../core/abstracts/BaseState";
import { PlayerIdleState } from "./PlayerIdleState";
import { PlayerJumpState } from "./PlayerJumpState";
import { PlayerFallingState } from "./PlayerFallingState";

export class PlayerMoveState extends BaseState<Player> {
    public readonly name = "MoveState";

    protected handleUpdate(owner: Player, dt: number): void {
        owner.checkGrounded();

        // 1. Calcul de la direction
        const moveX = owner.input.horizontal;
        const targetVelocityX = moveX * owner.stats.speed;

        // Interpolation pour la fluidité
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetVelocityX, 0.2);

        // 2. Gravité
        if (!owner.isGrounded) {
            owner.velocity.y += owner.gravity;
        }

        // 3. APPLICATION DU MOUVEMENT (Appelle la méthode Character.move)
        owner.move(owner.velocity, dt);

        // 4. Transitions
        if (owner.input.isJumping && owner.isGrounded) {
            owner.movementFSM.transitionTo(new PlayerJumpState());
        } else if (!owner.isGrounded && owner.velocity.y < 0) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        } else if (moveX === 0 && Math.abs(owner.velocity.x) < 0.1) {
            owner.movementFSM.transitionTo(new PlayerIdleState());
        }
    }
}
