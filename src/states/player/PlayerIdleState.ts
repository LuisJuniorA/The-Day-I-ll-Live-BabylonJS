import { Scalar } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerMoveState } from "./PlayerMoveState";
import { PlayerFallingState } from "./PlayerFallingState";
import { PlayerJumpState } from "./PlayerJumpState";

export class PlayerIdleState extends BaseState<Player> {
    public readonly name = "IdleState";

    protected handleEnter(owner: Player): void {
        //owner.playAnim("idle", true);
        owner.velocity.y = 0;
    }

    protected handleUpdate(owner: Player, dt: number): void {
        owner.checkGrounded();

        // 1. Friction : On freine doucement sur X
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, 0, 0.2);

        // 2. Gravité de maintien :
        // On applique une petite force constante vers le bas pour
        // rester "collé" au sol et détecter les pentes/marches.
        if (owner.isGrounded) {
            owner.velocity.y = -0.1; // Force de maintien légère
        } else {
            owner.velocity.y += owner.gravity * dt;
        }

        // 3. APPLICATION DU MOUVEMENT (Le bridge Transform/Mesh)
        // C'est CA qui règle ton problème de TP
        owner.move(owner.velocity, dt);

        // 4. Transitions
        if (!owner.isGrounded) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        } else if (owner.buffer.isActive("jump")) {
            // Utilise le buffer pour plus de réactivité
            owner.buffer.consume("jump");
            owner.movementFSM.transitionTo(new PlayerJumpState());
        } else if (Math.abs(owner.input.horizontal) > 0.1) {
            owner.movementFSM.transitionTo(new PlayerMoveState());
        }
    }
}
