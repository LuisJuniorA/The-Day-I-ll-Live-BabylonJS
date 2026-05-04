import {
    Color3,
    MeshBuilder,
    Quaternion,
    Scene,
    Vector3,
} from "@babylonjs/core";
import { Weapon } from "../core/abstracts/Weapon";
import { Character } from "../core/abstracts/Character";
import {
    AttackDirection,
    OnEntityDamaged,
} from "../core/interfaces/CombatEvent";
import type { WeaponData } from "../core/types/WeaponStats";
import { DebugService } from "../core/engines/DebugService";

/**
 * Classe de base pour toutes les armes de mêlée.
 * Gère la détection de hitbox directionnelle (Side, Up, Down).
 */
export abstract class MeleeWeapon extends Weapon {
    public attackRange: number;
    public attackDuration: number;

    constructor(scene: Scene, data: WeaponData) {
        super(scene, data);
        this.attackRange = data.stats.range;
        this.attackDuration = data.stats.attackDuration;
    }

    /**
     * Exécute une attaque dans une direction donnée.
     */
    public attack(
        owner: Character,
        direction: AttackDirection = AttackDirection.SIDE,
    ): void {
        // Joue l'animation correspondante (doit être gérée dans la classe fille)
        this.playAttackAnimation(owner, direction);

        const targets = this.findTargetsInHitbox(owner, direction);
        let hasHitAtLeastOne = false;
        let firstTargetPos: Vector3 | null = null;

        for (const target of targets) {
            if (target.faction === owner.faction || target.isDead) continue;

            hasHitAtLeastOne = true;

            if (!firstTargetPos) {
                firstTargetPos =
                    target.transform?.position || target.position || null;
            }

            // Notification du système de combat pour l'application des dégâts
            OnEntityDamaged.notifyObservers({
                targetId: target.id,
                attackerId: owner.id,
                amount: this.stats.damage + (owner.stats.damage || 0),
                position: owner.transform.position.clone(),
                attackerFaction: owner.faction,
            });
        }

        // Si au moins une cible est touchée, on déclenche le feedback de hit (ex: recul)
        if (hasHitAtLeastOne && firstTargetPos) {
            owner.onHitTarget(firstTargetPos);
        }
    }

    /**
     * Méthode abstraite pour jouer l'animation visuelle de l'attaque.
     */
    protected abstract playAttackAnimation(
        owner: Character,
        direction: AttackDirection,
    ): void;

    /**
     * Calcule le volume de collision selon la direction et scanne les entités touchées.
     */
    private findTargetsInHitbox(
        owner: Character,
        direction: AttackDirection,
    ): Character[] {
        const range = this.stats.range;
        const hitTargets: any[] = [];
        const debug = DebugService.getInstance();

        const container =
            this.scene.getTransformNodeByName("ENTITIES_CONTAINER");
        if (!container) {
            console.error("CombatSystem: ENTITIES_CONTAINER introuvable.");
            return [];
        }

        // 1. Récupération des axes de référence
        const worldMatrix = owner.transform.getWorldMatrix();
        const forward = Vector3.TransformNormal(
            new Vector3(1, 0, 0),
            worldMatrix,
        ).normalize();
        const up = Vector3.Up(); // Axe vertical absolu

        let boxPos: Vector3;
        let boxSize = { width: range, height: 3, depth: range };
        let boxRot: Quaternion;

        // 2. Calcul du positionnement et des dimensions selon la direction
        if (direction === AttackDirection.UP) {
            // Attaque vers le haut : la box est centrée au dessus du joueur
            boxPos = owner.transform.position.add(up.scale(range / 1.5 + 1));
            boxSize = { width: range * 1.5, height: range, depth: range * 1.5 };
            boxRot = Quaternion.Identity(); // Alignement horizontal pour couvrir une large zone
        } else if (direction === AttackDirection.DOWN) {
            // Attaque vers le bas : utile pour le "pogo" ou frapper au sol
            boxPos = owner.transform.position.add(up.scale(-1));
            boxSize = { width: range * 1.5, height: 1.5, depth: range * 1.5 };
            boxRot = Quaternion.Identity();
        } else {
            // Attaque latérale (SIDE) : On utilise le forward du personnage
            const permissiveOffset = 0.5;
            const centerOffset = range / 2 + permissiveOffset;
            boxPos = owner.transform.position.add(forward.scale(centerOffset));
            boxRot = Quaternion.FromRotationMatrix(
                worldMatrix.getRotationMatrix(),
            );
        }

        // 3. Création du volume de détection (Mesh temporaire)
        const hitbox = MeshBuilder.CreateBox(
            "temp_hitbox",
            {
                width: boxSize.width,
                height: boxSize.height,
                depth: boxSize.depth,
            },
            this.scene,
        );

        hitbox.position.copyFrom(boxPos);
        hitbox.rotationQuaternion = boxRot;
        hitbox.isVisible = false;
        hitbox.isPickable = false;
        hitbox.computeWorldMatrix(true);

        // --- VISUALISATION DEBUG ---
        const debugColor =
            direction === AttackDirection.SIDE ? Color3.Red() : Color3.Blue();
        debug.drawBox(
            `player_attack_${direction}`,
            this.scene,
            boxPos,
            boxSize,
            boxRot,
            debugColor,
        );
        setTimeout(() => debug.clear(`player_attack_${direction}`), 400);

        // 4. Scan des cibles dans l'ENTITIES_CONTAINER
        const potentialMeshes = container.getChildMeshes(false);

        for (const mesh of potentialMeshes) {
            // Ignorer le propriétaire de l'arme
            if (mesh === owner.mesh || mesh.isDescendantOf(owner.transform))
                continue;

            mesh.computeWorldMatrix(true);
            mesh.refreshBoundingInfo({});

            if (hitbox.intersectsMesh(mesh, false)) {
                let entityNode: any = mesh;
                // Remonter jusqu'au parent direct du container pour identifier l'entité
                while (entityNode.parent && entityNode.parent !== container) {
                    entityNode = entityNode.parent;
                }

                if (
                    entityNode &&
                    entityNode !== container &&
                    !hitTargets.includes(entityNode)
                ) {
                    console.log(
                        `💥 Impact [${direction}] sur: ${entityNode.id}`,
                    );
                    hitTargets.push(entityNode);

                    // Feedback visuel du point d'impact
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

        // 5. Nettoyage de la hitbox temporaire
        hitbox.dispose();

        return hitTargets;
    }
}
