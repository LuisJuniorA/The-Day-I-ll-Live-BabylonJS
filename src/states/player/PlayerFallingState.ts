import { Player } from "../../entities/Player";
import { BaseState } from "../../core/abstracts/BaseState";
import { PlayerIdleState } from "./PlayerIdleState";
import { PlayerJumpState } from "./PlayerJumpState";
import { Vector3 } from "@babylonjs/core";

export class PlayerFallingState extends BaseState<Player> {
    public readonly name = "FallingState";

    protected handleUpdate(owner: Player, dt: number): void {
        const moveX = owner.input.horizontal;
        owner.move(new Vector3(moveX, 0, 0), dt);

        // Coyote Time / Jump Buffer
        if (owner.buffer.isActive("jump") && owner.coyoteTimeCounter > 0) {
            owner.buffer.consume("jump");
            owner.movementFSM.transitionTo(new PlayerJumpState());
            return;
        }

        // Atterrissage
        if (owner.isGrounded && owner.velocity.y <= 0) {
            owner.movementFSM.transitionTo(new PlayerIdleState());
        }
    }
}
