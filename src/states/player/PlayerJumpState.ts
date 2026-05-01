import { Scalar } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerFallingState } from "./PlayerFallingState";

export class PlayerJumpState extends BaseState<Player> {
    public readonly name = "JumpState";

    protected handleEnter(owner: Player): void {
        owner.velocity.y = owner.jumpForce; // L'impulsion initiale
        owner.isGrounded = false;
        owner.playAnim("jump", false);
    }

    protected handleUpdate(owner: Player, dt: number): void {
        // Mouvement aérien
        const targetX = owner.input.horizontal * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetX, 0.1);

        owner.move(owner.velocity, dt);

        // Si on commence à redescendre ou si on touche un plafond
        if (owner.velocity.y <= 0) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        }
    }
}
