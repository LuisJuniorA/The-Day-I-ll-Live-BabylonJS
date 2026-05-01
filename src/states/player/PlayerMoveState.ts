import { Scalar } from "@babylonjs/core";
import { Player } from "../../entities/Player";
import { BaseState } from "../../core/abstracts/BaseState";
import { PlayerIdleState } from "./PlayerIdleState";
import { PlayerJumpState } from "./PlayerJumpState";
import { PlayerFallingState } from "./PlayerFallingState";

export class PlayerMoveState extends BaseState<Player> {
    public readonly name = "MoveState";

    protected handleUpdate(owner: Player, dt: number): void {
        const moveX = owner.input.horizontal;
        const targetVelocityX = moveX * owner.stats.speed;

        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetVelocityX, 0.2);

        owner.move(owner.velocity, dt);

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
