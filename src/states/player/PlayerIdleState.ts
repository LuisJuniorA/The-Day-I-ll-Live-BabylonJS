import { Scalar } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerMoveState } from "./PlayerMoveState";
import { PlayerFallingState } from "./PlayerFallingState";
import { PlayerJumpState } from "./PlayerJumpState";


export class PlayerIdleState extends BaseState<Player> {
    public readonly name = "IdleState";

    protected handleUpdate(owner: Player, _dt: number): void {
        owner.checkGrounded();

        // Physique simple : on freine
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, 0, 0.2);
        owner.velocity.y += owner.gravity;
        owner.mesh!.moveWithCollisions(owner.velocity);

        // Transitions
        if (!owner.isGrounded) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        } else if (owner.input.isJumping) {
            owner.movementFSM.transitionTo(new PlayerJumpState());
        } else if (owner.input.horizontal !== 0) {
            owner.movementFSM.transitionTo(new PlayerMoveState());
        }
    }
}