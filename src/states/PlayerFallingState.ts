import { Scalar } from "@babylonjs/core";
import { BaseState } from "../core/abstracts/BaseState";
import { Player } from "../entities/Player";
import { PlayerIdleState } from "./PlayerIdleState";

export class PlayerFallingState extends BaseState<Player> {
    public readonly name = "FallingState";
    //private _canDoubleJump: boolean = true;

    protected handleEnter(_owner: Player): void {
        //this._canDoubleJump = true;
    }

    protected handleUpdate(owner: Player, _dt: number): void {
        owner.checkGrounded();

        // Mouvement latéral
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, owner.input.horizontal * owner.speed, 0.1);
        owner.velocity.y += owner.gravity;
        owner.mesh!.moveWithCollisions(owner.velocity);

        // Logique Double Jump
        // if (this._canDoubleJump && owner.input.isJumping) {
        //     this._canDoubleJump = false;
        //     owner.velocity.y = owner.jumpForce * 0.8; // Saut un peu plus faible
        // }

        // Retour au sol
        if (owner.isGrounded) {
            owner.movementFSM.transitionTo(new PlayerIdleState());
        }
    }
}