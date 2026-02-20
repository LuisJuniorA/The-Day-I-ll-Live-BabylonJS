import { Scalar } from "@babylonjs/core";
import { BaseState } from "../core/abstracts/BaseState";
import { Player } from "../entities/Player";
import { PlayerFallingState } from "./PlayerFallingState";

export class PlayerJumpState extends BaseState<Player> {
    public readonly name = "JumpState";

    protected handleEnter(owner: Player): void {
        owner.velocity.y = owner.jumpForce;
        owner.isGrounded = false;
    }

    protected handleUpdate(owner: Player, _dt: number): void {
        // Mouvement latéral en l'air
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, owner.input.horizontal * owner.speed, 0.1);
        owner.velocity.y += owner.gravity;
        owner.mesh!.moveWithCollisions(owner.velocity);

        // Si on commence à redescendre, on passe en Falling
        if (owner.velocity.y <= 0) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        }
    }
}