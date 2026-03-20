import { Vector3 } from "@babylonjs/core";
import { Enemy } from "../core/abstracts/Enemy";

export class SteeringManager {
    /**
     * SEEK : Force d'accélération vers la cible.
     */
    public static seek(owner: Enemy, target: Vector3): Vector3 {
        const desired = target.subtract(owner.position);
        desired.y = 0; // Plan horizontal
        const distance = desired.length();

        // Zone d'interaction : on freine
        if (distance <= owner.config.interactionRange) {
            return owner.velocity.scale(-1.5);
        }

        let speed = owner.config.maxSpeed;

        // Arrival radius pour freinage progressif
        if (distance < owner.config.arrivalRadius) {
            speed =
                owner.config.maxSpeed * (distance / owner.config.arrivalRadius);
        }

        const desiredVelocity = desired.normalize().scale(speed);
        return desiredVelocity.subtract(owner.velocity);
    }

    /**
     * SEPARATE : Force d'accélération pour éviter le chevauchement.
     */
    public static separate(
        owner: Enemy,
        neighbors: Enemy[],
        radius: number,
    ): Vector3 {
        const steering = new Vector3(0, 0, 0);
        let count = 0;

        for (const other of neighbors) {
            // owner.position et other.position sont les pivots LOGIQUES (Transform)
            const diff = owner.position.subtract(other.position);
            diff.y = 0;
            let dist = diff.length();

            // Superposition parfaite : on crée une direction aléatoire
            if (dist === 0) {
                diff.set(Math.random() - 0.5, 0, Math.random() - 0.5);
                dist = 0.1; // Distance minimale simulée
            }

            // Si on est dans le rayon de séparation
            if (dist < radius) {
                // Force quadratique inverse : Plus on est proche, plus la répulsion explose.
                // On normalise puis on divise par la distance
                diff.normalize().scaleInPlace(1 / dist);
                steering.addInPlace(diff);
                count++;
            }
        }

        if (count > 0) {
            steering.scaleInPlace(1 / count); // Moyenne des forces de répulsion

            // On veut que la séparation soit puissante.
            // On la scale par rapport à la maxSpeed pour qu'elle puisse contrer le Seek.
            return steering.scale(owner.config.maxSpeed * 2);
        }

        return Vector3.Zero();
    }
}
