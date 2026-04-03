import { Vector3, Scene, Color3, Ray } from "@babylonjs/core";
import { DebugService } from "./DebugService";
import { CollisionLayers } from "../constants/CollisionLayers";

export interface HookPoint {
    position: Vector3;
    normal: Vector3;
    score: number;
}

export class HookScanner {
    private static readonly RAY_LENGTH = 18;
    private static readonly RAY_OFFSET_Y = 0.5;
    private static readonly MIN_DISTANCE = 1.5;
    private static readonly SLIME_SAFETY_OFFSET = 0.5;

    public static getBestPoint(
        scene: Scene,
        origin: Vector3,
        targetPos: Vector3,
        currentUp: Vector3,
        id: string,
    ): HookPoint | null {
        let best: HookPoint | null = null;
        let hiScore = -Infinity;

        DebugService.getInstance().clear(`${id}_best_hook`);

        // --- SÉCURITÉ ORIGINE ---
        // On monte un peu l'origine pour éviter de raser le sol
        const rayOrigin = origin.add(new Vector3(0, this.RAY_OFFSET_Y, 0));

        const dirToTarget = targetPos.subtract(rayOrigin).normalize();
        const scanDirs = this.getDynamicDirections(dirToTarget);

        for (const [index, dir] of scanDirs.entries()) {
            // --- ANTI-CORNER HACK ---
            // On fait partir le rayon un tout petit peu AVANT l'origine réelle
            // pour être sûr de percuter le mur même si on est collé dessus.
            const backOffOrigin = rayOrigin.subtract(dir.scale(0.1));
            const ray = new Ray(backOffOrigin, dir, this.RAY_LENGTH);

            const hit = scene.pickWithRay(
                ray,
                (m) =>
                    m.checkCollisions &&
                    m.collisionGroup === CollisionLayers.ENVIRONMENT,
                false,
            );

            const impactId = `${id}_impact_${index}`;
            const potId = `${id}_pot_${index}`;

            if (hit && hit.hit && hit.pickedPoint && hit.getNormal()) {
                let norm = hit.getNormal(true)!;
                if (Vector3.Dot(norm, dir) > 0) norm.scaleInPlace(-1);

                // 1. Calcul du point cible
                const potentialPos = hit.pickedPoint.add(
                    norm.scale(this.SLIME_SAFETY_OFFSET),
                );

                // --- 2. TRAJECTORY CHECK (LE JUGE DE PAIX) ---
                // On vérifie le chemin entre le VRAI centre du slime et le point bleu.
                const toPot = potentialPos.subtract(rayOrigin);
                const distToPot = toPot.length();
                const pathCheck = scene.pickWithRay(
                    new Ray(rayOrigin, toPot.normalize(), distToPot),
                    (m) =>
                        m.checkCollisions &&
                        m.collisionGroup === CollisionLayers.ENVIRONMENT,
                );

                // Si le chemin tape un mur avant d'arriver au point bleu (même à 0.1m), c'est mort.
                if (
                    pathCheck &&
                    pathCheck.hit &&
                    pathCheck.distance < distToPot - 0.1
                ) {
                    DebugService.getInstance().drawPoint(
                        impactId,
                        scene,
                        hit.pickedPoint,
                        Color3.Black(),
                        0.1,
                    );
                    continue;
                }

                // --- 3. EPAISSEUR CHECK ---
                // On vérifie que potentialPos n'est pas DANS un mur
                const insideCheck = scene.pickWithRay(
                    new Ray(
                        potentialPos,
                        norm.scale(-1),
                        this.SLIME_SAFETY_OFFSET,
                    ),
                    (m) =>
                        m.checkCollisions &&
                        m.collisionGroup === CollisionLayers.ENVIRONMENT,
                );
                if (
                    insideCheck &&
                    insideCheck.hit &&
                    insideCheck.distance < this.SLIME_SAFETY_OFFSET - 0.1
                ) {
                    continue;
                }

                if (hit.distance < this.MIN_DISTANCE) continue;

                // Debug
                DebugService.getInstance().drawPoint(
                    impactId,
                    scene,
                    hit.pickedPoint,
                    Color3.Red(),
                    0.1,
                );
                DebugService.getInstance().drawPoint(
                    potId,
                    scene,
                    potentialPos,
                    Color3.Blue(),
                    0.1,
                );

                // --- 4. SCORE ---
                let score = this.calculateScore(
                    potentialPos,
                    targetPos,
                    origin,
                    norm,
                    currentUp,
                    dir,
                    dirToTarget,
                );

                if (score > hiScore) {
                    hiScore = score;
                    best = {
                        position: potentialPos,
                        normal: norm,
                        score: score,
                    };
                }
            }
        }

        if (best) {
            DebugService.getInstance().drawPoint(
                `${id}_best_hook`,
                scene,
                best.position,
                Color3.Green(),
                0.5,
            );
        }
        return best;
    }

    private static calculateScore(
        pos: Vector3,
        target: Vector3,
        origin: Vector3,
        norm: Vector3,
        up: Vector3,
        dir: Vector3,
        targetDir: Vector3,
    ): number {
        let score = 0;
        const distToPlayer = Vector3.Distance(pos, target);

        // Bonus alignement et distance
        score += Vector3.Dot(dir, targetDir) * 10;
        score += (Vector3.Distance(origin, target) - distToPlayer) * 5;

        // Bonus surface (Up dot)
        const dot = Vector3.Dot(norm, up);
        if (dot > 0.8)
            score -= 15; // Sol
        else if (dot < -0.5)
            score += 10; // Plafond
        else score += 5; // Mur

        return score;
    }

    private static getDynamicDirections(dirToTarget: Vector3): Vector3[] {
        const dirs: Vector3[] = [dirToTarget.clone()];
        let up =
            Math.abs(dirToTarget.y) > 0.99 ? Vector3.Right() : Vector3.Up();
        const right = Vector3.Cross(dirToTarget, up).normalize();
        up = Vector3.Cross(right, dirToTarget).normalize();

        [0.3, 0.7, 1.1].forEach((radius, ringIdx) => {
            const count = [6, 10, 12][ringIdx];
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const offset = right
                    .scale(Math.cos(angle) * radius)
                    .add(up.scale(Math.sin(angle) * radius));
                dirs.push(dirToTarget.add(offset).normalize());
            }
        });
        dirs.push(new Vector3(0, -1, 0));
        return dirs;
    }
}
