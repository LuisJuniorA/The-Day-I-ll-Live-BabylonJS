import { Vector3, Ray, Scalar } from "@babylonjs/core";
import { Player } from "../entities/Player";
import { BaseState } from "../core/abstracts/BaseState";

export class PlayerMoveState extends BaseState<Player> {
    public readonly name = "MoveState";

    // On remplace onUpdate par handleUpdate (défini dans BaseState)
    protected handleUpdate(owner: Player, _dt: number): void {
        this._checkGrounded(owner);
        this._applyPhysics(owner);

        // Application du mouvement
        owner.mesh!.moveWithCollisions(owner.velocity);

        // Exemple d'utilisation du temps : transition auto après 10s (juste pour l'exemple)
        // if (this.timeInState > 10) { ... }
    }

    private _applyPhysics(owner: Player): void {
        const moveX = owner.input.horizontal;
        const targetVelocityX = moveX * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetVelocityX, 0.2);

        if (owner.isGrounded) {
            owner.velocity.y = 0;
            if (owner.input.isJumping) {
                owner.velocity.y = owner.jumpForce;
                owner.isGrounded = false;
            }
        } else {
            owner.velocity.y += owner.gravity;
        }
    }

    private _checkGrounded(owner: Player): void {
        const rayOrigin = owner.mesh!.position.clone();
        rayOrigin.y -= 0.9;

        const ray = new Ray(rayOrigin, new Vector3(0, -1, 0), 0.2);
        const pick = owner.mesh!.getScene().pickWithRay(ray, (m) => {
            return m.checkCollisions && m !== owner.mesh;
        });

        owner.isGrounded = (pick !== null && pick.hit);

        if (owner.isGrounded && owner.velocity.y < 0) {
            owner.velocity.y = 0;
        }
    }

}