import { Scalar } from "@babylonjs/core";
import { Player } from "../../entities/Player";
import { BaseState } from "../../core/abstracts/BaseState";
import { PlayerIdleState } from "./PlayerIdleState";
import { PlayerJumpState } from "./PlayerJumpState";

export class PlayerFallingState extends BaseState<Player> {
    public readonly name = "FallingState";

    protected handleEnter(owner: Player): void {
        // Optionnel : jouer une animation de chute
        owner.playAnim("falling", true);
    }

    protected handleUpdate(owner: Player, dt: number): void {
        // 1. Détection du sol
        owner.checkGrounded();

        // 2. Mouvement latéral (Inertie en l'air)
        const targetX = owner.input.horizontal * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetX, 0.1);

        // 3. Gravité (Accélération constante)
        // On multiplie par dt car la gravité est une accélération (m/s²)
        owner.velocity.y += owner.gravity;

        // 4. APPLICATION PHYSIQUE (Le Bridge Transform/Mesh)
        owner.move(owner.velocity, dt);

        // 5. Logique Coyote Time & Jump Buffer
        // Si on a pressé saut juste avant de toucher le sol ou juste après être tombé d'un rebord
        if (owner.buffer.isActive("jump") && owner.coyoteTimeCounter > 0) {
            owner.buffer.consume("jump");
            owner.movementFSM.transitionTo(new PlayerJumpState());
            return;
        }

        // 6. Retour au sol
        if (owner.isGrounded) {
            owner.playAnim("land", false); // Animation d'atterrissage
            owner.movementFSM.transitionTo(new PlayerIdleState());
        }
    }
}
