import { Vector3, Ray, Scalar } from "@babylonjs/core";
import type { State } from "../core/interfaces/State";
import { Player } from "../entities/Player";

export class PlayerMoveState implements State<Player> {
    public readonly name = "MoveState";

    public onEnter(owner: Player): void {
        console.log("Player entered Move State");
    }

    public onUpdate(owner: Player, dt: number): void {
        this._checkGrounded(owner);
        this._applyPhysics(owner);

        // Application finale du mouvement via Babylon
        owner.mesh!.moveWithCollisions(owner.velocity);
    }

    private _applyPhysics(owner: Player): void {
        // --- Mouvement Horizontal ---
        const moveX = owner.input.horizontal;
        const targetVelocityX = moveX * owner.speed;
        owner.velocity.x = Scalar.Lerp(owner.velocity.x, targetVelocityX, 0.2);

        // --- Mouvement Vertical ---
        if (owner.isGrounded) {
            owner.velocity.y = 0;
            // Saut
            if (owner.input.isJumping) {
                owner.velocity.y = owner.jumpForce;
                owner.isGrounded = false;
            }
        } else {
            // Gravité
            owner.velocity.y += owner.gravity;
        }
    }

    private _checkGrounded(owner: Player): void {
        const rayOrigin = owner.mesh!.position.clone();
        rayOrigin.y -= 0.9;

        const rayDirection = new Vector3(0, -1, 0);
        const rayLength = 0.2;

        const ray = new Ray(rayOrigin, rayDirection, rayLength);
        const pick = owner.mesh!.getScene().pickWithRay(ray, (m) => {
            return m.checkCollisions && m !== owner.mesh;
        });

        owner.isGrounded = (pick !== null && pick.hit);

        if (owner.isGrounded && owner.velocity.y < 0) {
            owner.velocity.y = 0;
        }
    }

    public onExit(owner: Player): void {
        // Nettoyage si besoin
    }
}