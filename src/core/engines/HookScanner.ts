import { Vector3, Scene, Color3, Ray, AbstractMesh } from "@babylonjs/core";
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
    private static readonly SLIME_SAFETY_OFFSET = 0.8;

    private static readonly _RayOrigin = new Vector3();

    public static getBestPoint(
        scene: Scene,
        origin: Vector3,
        targetPos: Vector3,
        currentUp: Vector3,
        id: string,
        playerCollider?: AbstractMesh, // Passé depuis l'Enemy pour éviter getMeshByName
    ): HookPoint | null {
        let best: HookPoint | null = null;
        let hiScore = -Infinity;

        // Nettoyage debug
        DebugService.getInstance().clear(`${id}_best_hook`);

        // Calcul de l'origine du scan
        this._RayOrigin.copyFrom(origin);
        this._RayOrigin.y += this.RAY_OFFSET_Y;

        // Direction vers le joueur
        const dirToTarget = targetPos.subtract(this._RayOrigin).normalize();

        // On récupère moins de directions pour économiser le CPU
        const scanDirs = this.getSimplifiedDirections(dirToTarget);

        for (const [index, dir] of scanDirs.entries()) {
            // Anti-corner : recul léger
            const backOffOrigin = this._RayOrigin.subtract(dir.scale(0.1));
            const ray = new Ray(backOffOrigin, dir, this.RAY_LENGTH);

            // 1. SCAN PRIMAIRE (Le plus important)
            const hit = scene.pickWithRay(
                ray,
                (m) =>
                    m.checkCollisions &&
                    m.collisionGroup === CollisionLayers.ENVIRONMENT,
                false,
            );

            if (hit && hit.hit && hit.pickedPoint && hit.getNormal()) {
                let norm = hit.getNormal(true)!;
                if (Vector3.Dot(norm, dir) > 0) norm.scaleInPlace(-1);

                // Point où le slime va se coller (décalé de la surface)
                const potentialPos = hit.pickedPoint.add(
                    norm.scale(this.SLIME_SAFETY_OFFSET),
                );

                if (hit.distance < this.MIN_DISTANCE) continue;

                // 2. CHECK INTERSECTION JOUEUR (Rapide)
                let intersectsPlayer = false;
                if (playerCollider) {
                    const intersectInfo = ray.intersectsMesh(
                        playerCollider,
                        false,
                    );
                    if (
                        intersectInfo.hit &&
                        intersectInfo.distance < hit.distance
                    ) {
                        intersectsPlayer = true;
                    }
                }

                // 3. CALCUL DU SCORE PRÉLIMINAIRE
                // On calcule le score avant les tests de trajectoire lourds
                let score = this.calculateScore(
                    potentialPos,
                    targetPos,
                    origin,
                    norm,
                    currentUp,
                    dir,
                    dirToTarget,
                    intersectsPlayer,
                );

                // --- OPTIMISATION CRUCIALE : EARLY EXIT ---
                // Si le score est déjà moins bon que notre meilleur, on ne fait pas les tests de collision suivants
                if (score <= hiScore) continue;

                // 4. TRAJECTORY CHECK (Seulement pour les bons candidats)
                const toPot = potentialPos.subtract(this._RayOrigin);
                const distToPot = toPot.length();
                const pathCheck = scene.pickWithRay(
                    new Ray(this._RayOrigin, toPot.normalize(), distToPot),
                    (m) =>
                        m.checkCollisions &&
                        m.collisionGroup === CollisionLayers.ENVIRONMENT,
                );

                if (
                    pathCheck &&
                    pathCheck.hit &&
                    pathCheck.distance < distToPot - 0.1
                ) {
                    continue; // Chemin obstrué
                }

                // 5. EPAISSEUR / INSIDE CHECK
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
                    continue; // Point à l'intérieur d'un mur
                }

                // Si on arrive ici, c'est notre nouveau meilleur point
                hiScore = score;
                best = {
                    position: potentialPos,
                    normal: norm,
                    score: score,
                };

                // Debug visuel uniquement pour les points validés
                this.drawDebug(
                    scene,
                    id,
                    index,
                    hit.pickedPoint,
                    potentialPos,
                    intersectsPlayer,
                );
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
        intersectsPlayer: boolean,
    ): number {
        let score = 0;
        const distToPlayerSq = Vector3.DistanceSquared(pos, target);
        const distOriginToPlayerSq = Vector3.DistanceSquared(origin, target);

        // Bonus alignement (Dot product)
        score += Vector3.Dot(dir, targetDir) * 10;

        // Bonus si rapprochement
        if (distToPlayerSq < distOriginToPlayerSq) score += 15;

        // GROS BONUS : Traverse le joueur (Attaque)
        if (intersectsPlayer) score += 80;

        // Bonus type de surface
        const dotUp = Vector3.Dot(norm, up);
        if (dotUp > 0.8)
            score -= 10; // Sol (Bof)
        else if (dotUp < -0.5)
            score += 15; // Plafond (Top pour slime)
        else score += 5; // Murs

        return score;
    }

    private static getSimplifiedDirections(dirToTarget: Vector3): Vector3[] {
        const dirs: Vector3[] = [dirToTarget.clone()];

        // Construction d'un repère local
        let up =
            Math.abs(dirToTarget.y) > 0.99 ? Vector3.Right() : Vector3.Up();
        const right = Vector3.Cross(dirToTarget, up).normalize();
        up = Vector3.Cross(right, dirToTarget).normalize();

        // On réduit à deux "anneaux" de détection (15 rayons total au lieu de 30)
        const rings = [
            { radius: 0.4, count: 6 },
            { radius: 0.9, count: 8 },
        ];

        for (const ring of rings) {
            for (let i = 0; i < ring.count; i++) {
                const angle = (i / ring.count) * Math.PI * 2;
                const offset = right
                    .scale(Math.cos(angle) * ring.radius)
                    .add(up.scale(Math.sin(angle) * ring.radius));
                dirs.push(dirToTarget.add(offset).normalize());
            }
        }

        dirs.push(new Vector3(0, -1, 0)); // Toujours checker le bas au cas où
        return dirs;
    }

    private static drawDebug(
        scene: Scene,
        id: string,
        idx: number,
        impact: Vector3,
        potential: Vector3,
        pierce: boolean,
    ) {
        const ds = DebugService.getInstance();
        ds.drawPoint(`${id}_imp_${idx}`, scene, impact, Color3.Red(), 0.05);
        ds.drawPoint(`${id}_pot_${idx}`, scene, potential, Color3.Blue(), 0.05);
        if (pierce) {
            ds.drawPoint(
                `${id}_pierce_${idx}`,
                scene,
                impact.add(new Vector3(0, 1, 0)),
                Color3.Yellow(),
                0.2,
            );
        }
    }
}
