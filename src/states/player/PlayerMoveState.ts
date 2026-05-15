import { Player } from "../../entities/Player";
import { BaseState } from "../../core/abstracts/BaseState";
import { PlayerIdleState } from "./PlayerIdleState";
import { PlayerJumpState } from "./PlayerJumpState";
import { PlayerFallingState } from "./PlayerFallingState";
import { Vector3 } from "@babylonjs/core";

export class PlayerMoveState extends BaseState<Player> {
    public readonly name = "MoveState";

    protected handleUpdate(owner: Player, dt: number): void {
        const moveX = owner.input.horizontal;

        owner.move(new Vector3(moveX, 0, 0), dt);

        // --- Transitions ---
        if (owner.buffer.isActive("jump") && owner.isGrounded) {
            owner.buffer.consume("jump");
            owner.movementFSM.transitionTo(new PlayerJumpState());
        } else if (!owner.isGrounded && owner.velocity.y < -0.5) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        } else if (moveX === 0 && Math.abs(owner.velocity.x) < 0.1) {
            owner.movementFSM.transitionTo(new PlayerIdleState());
        }
    }
}
