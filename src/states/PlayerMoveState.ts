import { Scalar } from "@babylonjs/core";
import { Player } from "../entities/Player";
import { BaseState } from "../core/abstracts/BaseState";
import { PlayerIdleState } from "./PlayerIdleState";
import { PlayerJumpState } from "./PlayerJumpState";
import { PlayerFallingState } from "./PlayerFallingState";

export class PlayerMoveState extends BaseState<Player> {
    public readonly name = "MoveState";

    protected handleUpdate(owner: Player, _dt: number): void {
        // 1. On vérifie le sol via la méthode centralisée
        owner.checkGrounded();

        // 2. Mouvement Horizontal
        const moveX = owner.input.horizontal;
        const targetVelocityX = moveX * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetVelocityX, 0.2);

        // 3. Gravité de base (au cas où on marche au dessus du vide)
        if (!owner.isGrounded) {
            owner.velocity.y += owner.gravity;
        }

        // 4. Application
        owner.mesh!.moveWithCollisions(owner.velocity);

        // 5. Transitions (Le cerveau du State)

        // Si on ne bouge plus le joystick -> Idle
        if (moveX === 0 && Math.abs(owner.velocity.x) < 0.01) {
            owner.movementFSM.transitionTo(new PlayerIdleState());
        }

        // Si on saute -> Jump
        if (owner.input.isJumping && owner.isGrounded) {
            owner.movementFSM.transitionTo(new PlayerJumpState());
        }

        // Si on tombe d'un rebord -> Falling
        if (!owner.isGrounded && owner.velocity.y < 0) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        }
    }
}