import { Scalar } from "@babylonjs/core";
import { Player } from "../../entities/Player";
import { BaseState } from "../../core/abstracts/BaseState";
import { PlayerIdleState } from "./PlayerIdleState";
import { PlayerJumpState } from "./PlayerJumpState";

export class PlayerFallingState extends BaseState<Player> {
    public readonly name = "FallingState";

    protected handleUpdate(owner: Player, dt: number): void {
        // Inertie aérienne
        const targetX = owner.input.horizontal * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetX, 0.1);

        owner.move(owner.velocity, dt);

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
