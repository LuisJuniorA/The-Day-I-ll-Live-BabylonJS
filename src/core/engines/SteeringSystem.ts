import { Vector3 } from "@babylonjs/core";
import { Enemy } from "../abstracts/Enemy";

export class SteeringSystem {
    /**
     * SEEK : Force d'accélération vers la cible, limitée par maxForce.
     */
    public static seek(owner: Enemy, target: Vector3): Vector3 {
        const desired = target.subtract(owner.position);
        desired.y = 0; // Plan horizontal (Metroidvania X/Z ou X/Y selon ta config)
        const distance = desired.length();

        // Zone d'interaction : on freine brutalement
        if (distance <= owner.config.interactionRange) {
            return owner.velocity.scale(-1.5);
        }

        let speed = owner.config.maxSpeed;

        // Arrival radius pour freinage progressif
        if (distance < owner.config.arrivalRadius) {
            speed =
                owner.config.maxSpeed * (distance / owner.config.arrivalRadius);
        }

        // 1. Calcul de la vitesse désirée
        const desiredVelocity = desired.normalize().scale(speed);

        // 2. Calcul de la force de steering (Vitesse désirée - Vitesse actuelle)
        let steeringForce = desiredVelocity.subtract(owner.velocity);

        // 3. APPLICATION DU MAXFORCE
        // On limite l'amplitude du vecteur de force pour une accélération progressive
        const maxF = owner.config.maxForce || 0.1; // Fallback au cas où
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
            const desiredSeparation = steering.scale(owner.config.maxSpeed * 2);
            let separationForce = desiredSeparation.subtract(owner.velocity);

            // On bride aussi la séparation par maxForce pour la fluidité
            const maxF = owner.config.maxForce || 0.1;
            if (separationForce.length() > maxF) {
                separationForce.normalize().scaleInPlace(maxF);
            }

            return separationForce;
        }

        return Vector3.Zero();
    }
}
