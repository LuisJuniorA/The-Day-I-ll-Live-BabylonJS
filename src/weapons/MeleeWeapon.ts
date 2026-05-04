import {
    Color3,
    MeshBuilder,
    Quaternion,
    Scene,
    Vector3,
} from "@babylonjs/core";
import { Weapon } from "../core/abstracts/Weapon";
import { Character } from "../core/abstracts/Character";
import { OnEntityDamaged } from "../core/interfaces/CombatEvent";
import type { WeaponData } from "../core/types/WeaponStats";
import { DebugService } from "../core/engines/DebugService";

export abstract class MeleeWeapon extends Weapon {
    // Propriétés spécifiques à la mêlée, initialisées via les data
    public attackRange: number;
    public attackDuration: number;

    constructor(scene: Scene, data: WeaponData) {
        // Appelle le constructeur de Weapon qui stocke déjà 'data'
        super(scene, data);

        // On synchronise les propriétés locales avec les data reçues
        this.attackRange = data.stats.range;
        this.attackDuration = data.stats.attackDuration;
    }

    public attack(owner: Character): void {
        this.playAttackAnimation(owner);

        const targets = this.findTargetsInHitbox(owner);
        let hasHitAtLeastOne = false;
        let firstTargetPos: Vector3 | null = null; // Pour stocker la position du premier impact

        for (const target of targets) {
            if (target.faction === owner.faction || target.isDead) continue;

            hasHitAtLeastOne = true;

            // On récupère la position de la cible de manière safe
            // Si c'est un Character, il a .transform.position.
            // Si c'est un Mesh, il a .position.
            if (!firstTargetPos) {
                firstTargetPos =
                    target.transform?.position || target.position || null;
            }

            OnEntityDamaged.notifyObservers({
                targetId: target.id,
                attackerId: owner.id,
                amount: this.stats.damage + (owner.stats.damage || 0),
                position: owner.transform.position.clone(),
                attackerFaction: owner.faction,
            });
        }

        // On n'applique le recul que si on a touché ET qu'on a une position valide
        if (hasHitAtLeastOne && firstTargetPos) {
            owner.onHitTarget(firstTargetPos);
        }
    }

    protected abstract playAttackAnimation(owner: Character): void;

    private findTargetsInHitbox(owner: Character): Character[] {
        const range = this.stats.range;
        const hitTargets: any[] = [];
        const debug = DebugService.getInstance();

        const container =
            this.scene.getTransformNodeByName("ENTITIES_CONTAINER");
        if (!container) {
            console.error("CombatSystem: ENTITIES_CONTAINER introuvable.");
            return [];
        }

        // 1. Récupération de la matrice monde pour une précision absolue
        const worldMatrix = owner.transform.getWorldMatrix();
        const forward = Vector3.TransformNormal(
            new Vector3(1, 0, 0),
            worldMatrix,
        ).normalize();

        // 2. Calcul du positionnement (La correction de l'offset est ici)
        // On repousse le centre pour que le bord arrière démarre 0.5 unité derrière le joueur
        const permissiveOffset = 0.5;
        const centerOffset = range / 2 + permissiveOffset;
        const boxPos = owner.transform.position.add(
            forward.scale(centerOffset),
        );

        // 3. Extraction de la rotation 100% fiable depuis la matrice
        const boxRot = Quaternion.FromRotationMatrix(
            worldMatrix.getRotationMatrix(),
        );

        // 4. Création du volume de détection
        const hitbox = MeshBuilder.CreateBox(
            "temp_hitbox",
            {
                width: range,
                height: 3,
                depth: range,
            },
            this.scene,
        );

        hitbox.position.copyFrom(boxPos);
        hitbox.rotationQuaternion = boxRot; // On applique le quaternion parfait
        hitbox.isVisible = false;
        hitbox.isPickable = false;
        hitbox.computeWorldMatrix(true);

        // --- VISUALISATION DEBUG ---
        debug.drawBox(
            "player_attack",
            this.scene,
            boxPos,
            { width: range, height: 3, depth: range },
            boxRot, // Le debug tournera correctement avec le perso
            Color3.Red(),
        );
        setTimeout(() => debug.clear("player_attack"), 400);

        // 5. Scan des cibles
        const potentialMeshes = container.getChildMeshes(false);

        for (const mesh of potentialMeshes) {
            if (mesh === owner.mesh || mesh.isDescendantOf(owner.transform))
                continue;

            mesh.computeWorldMatrix(true);
            mesh.refreshBoundingInfo({});

            if (hitbox.intersectsMesh(mesh, false)) {
                let entityNode: any = mesh;
                while (entityNode.parent && entityNode.parent !== container) {
                    entityNode = entityNode.parent;
                }

                if (
                    entityNode &&
                    entityNode !== container &&
                    !hitTargets.includes(entityNode)
                ) {
                    console.log(
                        `💥 Impact confirmé sur: ${entityNode.id} (via mesh: ${mesh.name})`,
                    );
                    hitTargets.push(entityNode);

                    // --- DEBUG IMPACT ---
                    debug.drawPoint(
                        "hit_" + entityNode.id + Date.now(),
                        this.scene,
                        mesh.getAbsolutePosition(),
                        Color3.Green(),
                        0.4,
                    );
                }
            }
        }

        // 6. Nettoyage
        hitbox.dispose();

        return hitTargets;
    }
}
