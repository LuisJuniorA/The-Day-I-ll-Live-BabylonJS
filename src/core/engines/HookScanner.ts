import { Vector3, Scene, Color3, Ray } from "@babylonjs/core";
import { DebugService } from "./DebugService";
import { CollisionLayers } from "../constants/CollisionLayers";

export interface HookPoint {
    position: Vector3;
    normal: Vector3;
    score: number;
}

export class HookScanner {
    private static readonly RAY_LENGTH = 15;
    private static readonly RAY_OFFSET_Y = 0.5;
    private static readonly MIN_DISTANCE = 1.5;
    private static readonly SLIME_RADIUS = 0.6; // Distance pour ne pas entrer dans le mur

    private static getDynamicDirections(dirToTarget: Vector3): Vector3[] {
        const dirs: Vector3[] = [];
        dirs.push(dirToTarget.clone());

        let up =
            Math.abs(dirToTarget.y) > 0.99 ? Vector3.Right() : Vector3.Up();
        const right = Vector3.Cross(dirToTarget, up).normalize();
        up = Vector3.Cross(right, dirToTarget).normalize();

        const rings = [0.3, 0.7, 1.1];
        const counts = [6, 10, 12];

        rings.forEach((radius, ringIdx) => {
            const count = counts[ringIdx];
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const offset = right
                    .scale(Math.cos(angle) * radius)
                    .add(up.scale(Math.sin(angle) * radius));
                dirs.push(dirToTarget.add(offset).normalize());
            }
        });

        dirs.push(new Vector3(0, -1, 0)); // Sécurité sol
        return dirs;
    }

    public static getBestPoint(
        scene: Scene,
        origin: Vector3,
        targetPos: Vector3,
        currentUp: Vector3,
        id: string,
    ): HookPoint | null {
        let best: HookPoint | null = null;
        let hiScore = -Infinity;

        const rayOrigin = origin.add(new Vector3(0, this.RAY_OFFSET_Y, 0));
        const dirToTarget = targetPos.subtract(rayOrigin).normalize();
        const scanDirs = this.getDynamicDirections(dirToTarget);

        scanDirs.forEach((dir, index) => {
            const ray = new Ray(rayOrigin, dir, this.RAY_LENGTH);
            const hit = scene.pickWithRay(
                ray,
                (m) =>
                    m.checkCollisions &&
                    m.collisionGroup === CollisionLayers.ENVIRONMENT,
            );

            if (hit && hit.pickedPoint && hit.getNormal()) {
                const norm = hit.getNormal(true)!;
                const distToWall = hit.distance;

                if (distToWall < this.MIN_DISTANCE) return;

                // 1. Calcul de la position de destination (OFFSET pour éviter de rentrer dans le mur)
                const potentialPos = hit.pickedPoint.add(
                    norm.scale(this.SLIME_RADIUS),
                );

                let score = 0;

                // 2. DOUBLE SCAN : Visibilité du joueur depuis le point d'arrivée
                const toPlayer = targetPos.subtract(potentialPos);
                const distToPlayer = toPlayer.length();
                const dirToPlayer = toPlayer.normalize();

                const visibilityRay = new Ray(
                    potentialPos,
                    dirToPlayer,
                    distToPlayer,
                );
                const vHit = scene.pickWithRay(
                    visibilityRay,
                    (m) =>
                        m.checkCollisions &&
                        m.collisionGroup === CollisionLayers.ENVIRONMENT,
                );

                const hasLineOfSight =
                    !vHit || !vHit.hit || vHit.distance > distToPlayer - 0.5;

                if (hasLineOfSight) {
                    score += 25.0; // Bonus massif si on voit le joueur
                } else {
                    // Si on ne voit pas le joueur, on score selon si on se rapproche de lui
                    const distGain =
                        Vector3.Distance(origin, targetPos) - distToPlayer;
                    score += distGain * 2.0;
                }

                // 3. PONDÉRATION ENVIRONNEMENT
                const isFloor = Vector3.Dot(norm, currentUp) > 0.8;
                score += isFloor ? -5.0 : 5.0; // Préfère les murs/plafonds

                // 4. ALIGNEMENT
                score += Vector3.Dot(dir, dirToTarget) * 10.0;

                if (score > hiScore) {
                    hiScore = score;
                    best = {
                        position: potentialPos,
                        normal: norm,
                        score: score,
                    };
                }

                if (score > 10) {
                    DebugService.getInstance().drawRay(
                        `${id}_${index}`,
                        scene,
                        rayOrigin,
                        dir,
                        1,
                        Color3.Green(),
                    );
                }
                if (best) {
                    // On dessine le point choisi en vert
                    DebugService.getInstance().drawPoint(
                        `${id}_best_hook`,
                        scene,
                        best.position,
                        Color3.Green(),
                        0.3, // Taille de la sphère
                    );
                } else {
                    // Si aucun point n'est trouvé, on nettoie le debug précédent
                    DebugService.getInstance().clear(`${id}_best_hook`);
                }

                return best;
            }
        });

        return best;
    }
}
