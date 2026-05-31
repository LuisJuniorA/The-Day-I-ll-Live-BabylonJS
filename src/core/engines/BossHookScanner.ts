import { Vector3, Scene, Ray } from "@babylonjs/core";
import { CollisionLayers } from "../constants/CollisionLayers";

export interface HookPoint {
    position: Vector3;
    normal: Vector3;
    score: number;
}

export class BossHookScanner {
    private static readonly RAY_LENGTH = 50;
    private static readonly RAY_OFFSET_Y = 0; // Pour ne pas toucher le sol sous le boss
    private static readonly _RayOrigin = new Vector3();

    public static getBestPoint(
        scene: Scene,
        origin: Vector3,
        targetPos: Vector3,
    ): HookPoint | null {
        this._RayOrigin.copyFrom(origin);
        this._RayOrigin.y += this.RAY_OFFSET_Y;

        // Remplace le calcul de dirToTarget par ceci :
        const dirToTarget = targetPos.subtract(this._RayOrigin);

        // Force le Z (ou Y selon ton repère) à 0 pour rester parfaitement horizontal
        dirToTarget.z = 0;
        dirToTarget.normalize();

        // Maintenant, le rayon sera toujours parfaitement à plat
        // au niveau du Boss (avec ton offset Y de 0.5)
        const backOffOrigin = this._RayOrigin.subtract(dirToTarget.scale(0.2));
        const ray = new Ray(backOffOrigin, dirToTarget, this.RAY_LENGTH);

        const hit = scene.pickWithRay(
            ray,
            (m) => {
                // DEBUG : Affiche chaque mesh testé en console pour voir ce qu'il "voit"
                // console.log("Test de collision avec:", m.name, "Group:", m.collisionGroup);
                return (
                    m.checkCollisions &&
                    m.collisionGroup === CollisionLayers.ENVIRONMENT
                );
            },
            false,
        );

        if (!hit || !hit.hit) {
            console.warn(
                "BossHookScanner: Rien touché. Origine:",
                backOffOrigin,
                "Dir:",
                dirToTarget,
            );
            return null;
        }

        return {
            position: hit.pickedPoint!,
            normal: hit.getNormal(true) || Vector3.Up(),
            score: 1000,
        };
    }
}
