import { Vector3 } from "@babylonjs/core";
import { Enemy } from "../abstracts/Enemy";

export class SteeringSystem {
    /**
     * SEEK : Force d'accélération vers la cible, limitée par maxForce.
     */
    public static seek(owner: Enemy, target: Vector3): Vector3 {
        const desired = target.subtract(owner.position);
        desired.y = 0;
        const distance = desired.length();

        // SI ON EST DÉJÀ DANS LA ZONE : On ne veut plus de force (on renvoie Zéro)
        if (distance <= owner.config.behavior.interactionRange) {
            return Vector3.Zero();
        }

        let speed = owner.config.behavior.maxSpeed;

        // FREINAGE PROGRESSIF (Arrival)
        // On ralentit si on est entre l'arrivalRadius et l'interactionRange
        if (distance < owner.config.behavior.arrivalRadius) {
            const range =
                owner.config.behavior.arrivalRadius -
                owner.config.behavior.interactionRange;
            const distInZone =
                distance - owner.config.behavior.interactionRange;
            speed = owner.config.behavior.maxSpeed * (distInZone / range);
        }

        const desiredVelocity = desired.normalize().scale(speed);
        let steeringForce = desiredVelocity.subtract(owner.velocity);

        // LIMITATION DE LA FORCE (MaxForce)
        const maxF = owner.config.behavior.maxForce;
        if (steeringForce.length() > maxF) {
            steeringForce.normalize().scaleInPlace(maxF);
        }

        return steeringForce;
    }

    /**
     * SEPARATE : Évitement, également limité par maxForce pour éviter les saccades.
     */
    public static separate(
        owner: Enemy,
        neighbors: Enemy[],
        radius: number,
    ): Vector3 {
        const steering = new Vector3(0, 0, 0);
        let count = 0;

        for (const other of neighbors) {
            const diff = owner.position.subtract(other.position);
            diff.y = 0;
            let dist = diff.length();

            if (dist === 0) {
                diff.set(Math.random() - 0.5, 0, Math.random() - 0.5);
                dist = 0.1;
            }

            if (dist < radius) {
                diff.normalize().scaleInPlace(1 / dist);
                steering.addInPlace(diff);
                count++;
            }
        }

        if (count > 0) {
            steering.scaleInPlace(1 / count);
            const desiredSeparation = steering.scale(
                owner.config.behavior.maxSpeed * 2,
            );
            let separationForce = desiredSeparation.subtract(owner.velocity);

            // On bride aussi la séparation par maxForce pour la fluidité
            const maxF = owner.config.behavior.maxForce || 0.1;
            if (separationForce.length() > maxF) {
                separationForce.normalize().scaleInPlace(maxF);
            }

            return separationForce;
        }

        return Vector3.Zero();
    }
}
