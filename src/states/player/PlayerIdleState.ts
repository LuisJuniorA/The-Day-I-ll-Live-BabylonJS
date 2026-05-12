import { Vector3 } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerMoveState } from "./PlayerMoveState";
import { PlayerFallingState } from "./PlayerFallingState";
import { PlayerJumpState } from "./PlayerJumpState";

export class PlayerIdleState extends BaseState<Player> {
    public readonly name = "IdleState";

    protected handleEnter(_owner: Player): void {
        // On ne remet pas Y à 0 ici pour laisser la gravité de maintien faire son job
    }

    protected handleUpdate(owner: Player, dt: number): void {
        // Friction horizontale
        const moveX = owner.input.horizontal;

        owner.move(new Vector3(moveX, 0, 0), dt);

        // Transitions
        if (!owner.isGrounded && owner.velocity.y < -0.5) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        } else if (owner.buffer.isActive("jump")) {
            owner.buffer.consume("jump");
            owner.movementFSM.transitionTo(new PlayerJumpState());
        } else if (Math.abs(owner.input.horizontal) > 0.1) {
            owner.movementFSM.transitionTo(new PlayerMoveState());
        }
    }
}
