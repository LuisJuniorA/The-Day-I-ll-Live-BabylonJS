import { Scalar } from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerFallingState } from "./PlayerFallingState";

export class PlayerJumpState extends BaseState<Player> {
    public readonly name = "JumpState";
    private _minTimeBeforeRejump = 0.1; // 100ms de sécurité
    private _timer = 0;

    protected handleEnter(owner: Player): void {
        owner.velocity.y = owner.jumpForce;
        owner.isGrounded = false;
        owner.playAnim("jump", false);
        this._timer = 0;

        // Optionnel : Consommer l'input immédiatement pour éviter de boucler
        // owner.buffer.consume("jump");
    }

    protected handleUpdate(owner: Player, dt: number): void {
        this._timer += dt;

        // --- FIX DU BLOCAGE ---
        // On ne ré-autorise le saut infini que si on a "décollé" un minimum
        if (
            import.meta.env.DEV &&
            owner.buffer.isActive("jump") &&
            this._timer > this._minTimeBeforeRejump
        ) {
            owner.movementFSM.transitionTo(new PlayerJumpState());
            return;
        }

        // 1. Mouvement latéral (DOIT ÊTRE APPELÉ)
        const targetX = owner.input.horizontal * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetX, 0.1);

        // 2. Gravité
        owner.velocity.y += owner.gravity;

        // 3. Détection Plafond (La version ultra-simple qui marche)
        const yBefore = owner.transform.position.y;

        // ON APPELLE MOVE : C'est ça qui débloque ton perso !
        owner.move(owner.velocity, dt);

        const actualMoveY = owner.transform.position.y - yBefore;

        // Détection plafond : si on monte mais qu'on ne bouge plus du tout
        if (owner.velocity.y > 0.5 && actualMoveY < 0.0001) {
            owner.velocity.y = 0;
            owner.movementFSM.transitionTo(new PlayerFallingState());
            return;
        }

        // 4. Sommet du saut
        if (owner.velocity.y <= 0) {
            owner.movementFSM.transitionTo(new PlayerFallingState());
        }
    }
}
