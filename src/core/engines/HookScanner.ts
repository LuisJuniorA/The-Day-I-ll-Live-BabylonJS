import { Vector3, Scene, Color3, Ray } from "@babylonjs/core";
import { DebugService } from "./DebugService";
import { CollisionLayers } from "../constants/CollisionLayers";

export interface HookPoint {
    position: Vector3;
    normal: Vector3;
    score: number;
}

export class HookScanner {
    // --- CONFIGURATION FACILE ---
    private static readonly RAY_LENGTH = 15; // Taille du raycast
    private static readonly RAY_OFFSET_Y = 0.5; // Décalage pour ne pas partir du sol
    private static readonly MIN_DISTANCE = 1.5; // Distance min pour valider un hit

    private static readonly _scanDirections: Vector3[] = [
        new Vector3(0, 1, 0), // 0: Plein Haut (Plafond)
        new Vector3(0, -1, 0), // 1: Plein Bas (Sol)
        new Vector3(1, 0, 0), // 2: Devant (ou Droite)
        new Vector3(-1, 0, 0), // 3: Derrière (ou Gauche)

        // Diagonales (45°)
        new Vector3(1, 1, 0).normalize(), // 4: Devant-Haut
        new Vector3(-1, 1, 0).normalize(), // 5: Derrière-Haut
        new Vector3(2, -1, 0).normalize(), // 6: Devant-Bas
        new Vector3(-2, -1, 0).normalize(), // 7: Derrière-Bas

        // Angles allongés (Les "Bras" qui cherchent loin devant)
        new Vector3(1, 0.5, 0).normalize(), // 8: Devant-Haut léger
        new Vector3(1, 0.2, 0).normalize(), // 9: Presque tout droit (Bras long)
        new Vector3(-1, 0.5, 0).normalize(), // 10: Derrière-Haut léger
    ];

    public static getBestPoint(
        scene: Scene,
        origin: Vector3,
        targetPos: Vector3,
        currentUp: Vector3,
        id: string,
    ): HookPoint | null {
        let best: HookPoint | null = null;
        let hiScore = -1;

        const dirToTarget = targetPos.subtract(origin).normalize();
        const rayOrigin = origin.add(new Vector3(0, this.RAY_OFFSET_Y, 0));

        let index = 0;
        for (const dir of this._scanDirections) {
            const ray = new Ray(rayOrigin, dir, this.RAY_LENGTH);
            const debugId = `${id}_scan_${index}`;
            index++;

            // On tente le hit
            const hit = scene.pickWithRay(ray, (mesh) => {
                return (
                    mesh.checkCollisions &&
                    mesh.collisionGroup === CollisionLayers.ENVIRONMENT
                );
            });

            if (hit && hit.pickedPoint) {
                const pos = hit.pickedPoint;
                const distFromMe = Vector3.Distance(pos, rayOrigin);

                // Même si c'est trop proche, on l'affiche en gris pour savoir que c'est ignoré
                if (distFromMe < this.MIN_DISTANCE) {
                    DebugService.getInstance().drawRay(
                        debugId,
                        scene,
                        rayOrigin,
                        dir,
                        distFromMe,
                        new Color3(0.3, 0.3, 0.3),
                    );
                    continue;
                }

                const alignment = Vector3.Dot(dir, dirToTarget);
                const norm = hit.getNormal(true);

                if (!norm) {
                    DebugService.getInstance().drawRay(
                        debugId,
                        scene,
                        rayOrigin,
                        dir,
                        distFromMe,
                        Color3.Magenta(),
                    );
                    continue;
                }

                // --- CALCUL SCORE ---
                const opposition = 1 - Vector3.Dot(currentUp, norm);
                const score =
                    alignment * 6.0 + distFromMe * 0.8 + opposition * 1.5;

                // --- DEBUG : IMPACT RÉUSSI ---
                const col = Color3.Lerp(
                    Color3.Red(),
                    Color3.Green(),
                    (alignment + 1) / 2,
                );
                DebugService.getInstance().drawRay(
                    debugId,
                    scene,
                    rayOrigin,
                    dir,
                    distFromMe,
                    col,
                );

                if (score > hiScore) {
                    hiScore = score;
                    best = {
                        position: pos.clone(),
                        normal: norm.clone(),
                        score: score,
                    };
                }
            } else {
                // --- DEBUG : RIEN TOUCHÉ ---
                // On affiche le rayon en rouge translucide ou sombre sur toute sa longueur
                DebugService.getInstance().drawRay(
                    debugId,
                    scene,
                    rayOrigin,
                    dir,
                    this.RAY_LENGTH,
                    new Color3(0.5, 0, 0),
                );
            }
        }

        // Point final
        if (best) {
            DebugService.getInstance().drawPoint(
                id + "_best",
                scene,
                best.position,
                Color3.Yellow(),
                0.4,
            );
        }

        return best;
    }
}
