import {
    AbstractMesh,
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
    /**
     * Calcule le volume de collision selon la direction et scanne les entités touchées.
     * Optimisé pour détecter les Hitbox Wrappers.
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

        // 1. Récupération des axes de référence (Inchangé)
        const worldMatrix = owner.transform.getWorldMatrix();
        const forward = Vector3.TransformNormal(
            new Vector3(1, 0, 0),
            worldMatrix,
        ).normalize();
        const up = Vector3.Up();

        let boxPos: Vector3;
        let boxSize = { width: range, height: 3, depth: range };
        let boxRot: Quaternion;

        // 2. Calcul du positionnement (Inchangé)
        if (direction === AttackDirection.UP) {
            boxPos = owner.transform.position.add(up.scale(range / 1.5 + 1));
            boxSize = { width: range * 1.5, height: range, depth: range * 1.5 };
            boxRot = Quaternion.Identity();
        } else if (direction === AttackDirection.DOWN) {
            boxPos = owner.transform.position.add(up.scale(-1));
            boxSize = { width: range * 1.5, height: 1.5, depth: range * 1.5 };
            boxRot = Quaternion.Identity();
        } else {
            const permissiveOffset = 0.5;
            const centerOffset = range / 2 + permissiveOffset;
            boxPos = owner.transform.position.add(forward.scale(centerOffset));
            boxRot = Quaternion.FromRotationMatrix(
                worldMatrix.getRotationMatrix(),
            );
        }

        // 3. Création du volume de détection (Hitbox d'attaque)
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

        // 4. SCAN OPTIMISÉ : On cherche uniquement les Wrappers
        // On récupère les enfants directs du container (les TransformNodes des entités)
        const entities = container.getChildren();

        for (const entityNode of entities) {
            // Ignorer le propriétaire
            if (entityNode === owner.transform) continue;

            // On cherche le wrapper dans les enfants de l'entité
            // (Il s'appelle "hitbox_wrap_..." comme défini dans la factory)
            const wrapper = entityNode
                .getChildren()
                .find((child) => child.name.startsWith("hitbox_wrap"));

            if (wrapper && wrapper instanceof AbstractMesh) {
                // On force la mise à jour pour être sûr de la position
                wrapper.computeWorldMatrix(true);

                if (hitbox.intersectsMesh(wrapper, false)) {
                    // On récupère l'objet Character associé (souvent stocké dans une map ou via l'ID)
                    // Ici on ajoute l'entityNode au tableau s'il n'y est pas déjà
                    if (!hitTargets.includes(entityNode)) {
                        console.log(
                            `💥 Impact [${direction}] sur le wrapper de: ${entityNode.id}`,
                        );
                        hitTargets.push(entityNode);

                        // Feedback visuel
                        debug.drawPoint(
                            "hit_" + entityNode.id + Date.now(),
                            this.scene,
                            wrapper.getAbsolutePosition(),
                            Color3.Green(),
                            0.4,
                        );
                    }
                }
            }
        }

        hitbox.dispose();
        return hitTargets;
    }
}
