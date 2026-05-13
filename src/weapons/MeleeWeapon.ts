import {
    AbstractMesh,
    Color3,
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
import { PoolManager } from "../managers/PoolManager";
import { Player } from "../entities/Player";

/**
 * Classe de base pour toutes les armes de mêlée.
 */
export abstract class MeleeWeapon extends Weapon {
    public attackRange: number;
    public attackDuration: number;

    constructor(scene: Scene, data: WeaponData) {
        super(scene, data);
        this.attackRange = data.stats.range;
        this.attackDuration = data.stats.attackDuration;
    }

    public attack(
        owner: Character,
        direction: AttackDirection = AttackDirection.SIDE,
    ): void {
        this.playAttackAnimation(owner, direction);

        const { position, size, rotation } = this._calculateHitboxGeometry(
            owner,
            direction,
        );
        const pool = PoolManager.getInstance();
        const detectionDuration = 0.1;

        // On crée une liste locale pour cette attaque précise
        const hitList = new Set<string>();

        pool.spawn(position, size, detectionDuration, (hitbox) => {
            hitbox.mesh.rotationQuaternion = rotation;
            hitbox.mesh.computeWorldMatrix(true);

            const targets = this._findTargetsInHitbox(hitbox.mesh, owner);

            // On filtre : seulement ceux qui ne sont pas dans hitList
            const newTargets = targets.filter((t) => !hitList.has(t.id));

            if (newTargets.length > 0) {
                newTargets.forEach((t) => hitList.add(t.id)); // On les marque comme touchés
                this._processHits(newTargets, owner, direction);
            }
        });
    }

    protected abstract playAttackAnimation(
        owner: Character,
        direction: AttackDirection,
    ): void;

    private _calculateHitboxGeometry(
        owner: Character,
        direction: AttackDirection,
    ) {
        const range = this.stats.range;
        const worldMatrix = owner.transform.getWorldMatrix();

        const forward = Vector3.TransformNormal(
            new Vector3(1, 0, 0),
            worldMatrix,
        ).normalize();
        const up = Vector3.Up();

        let pos: Vector3;
        let size: Vector3;
        let rot: Quaternion;

        if (direction === AttackDirection.UP) {
            pos = owner.transform.position.add(up.scale(range / 1.5 + 1));
            size = new Vector3(range * 1.5, range, range * 1.5);
            rot = Quaternion.Identity();
        } else if (direction === AttackDirection.DOWN) {
            pos = owner.transform.position.add(up.scale(-1));
            size = new Vector3(range * 1.5, 1.5, range * 1.5);
            rot = Quaternion.Identity();
        } else {
            const permissiveOffset = 0.5;
            const centerOffset = range / 2 + permissiveOffset;
            pos = owner.transform.position.add(forward.scale(centerOffset));
            size = new Vector3(range, 3, range);
            rot = Quaternion.FromRotationMatrix(
                worldMatrix.getRotationMatrix(),
            );
        }

        return { position: pos, size, rotation: rot };
    }

    private _findTargetsInHitbox(
        hitboxMesh: AbstractMesh,
        owner: Character,
    ): any[] {
        const hitTargets: any[] = [];
        const container =
            this.scene.getTransformNodeByName("ENTITIES_CONTAINER");

        if (!container) return [];

        const entities = container.getChildren();

        for (const entityNode of entities) {
            if (entityNode === owner.transform) continue;

            const wrapper = entityNode
                .getChildren()
                .find((child) => child.name.startsWith("hitbox_wrap"));

            if (wrapper && wrapper instanceof AbstractMesh) {
                wrapper.computeWorldMatrix(true);

                if (hitboxMesh.intersectsMesh(wrapper, false)) {
                    if (!hitTargets.includes(entityNode)) {
                        hitTargets.push(entityNode);
                    }
                }
            }
        }
        return hitTargets;
    }

    private _processHits(
        targets: any[],
        owner: Character,
        _direction: AttackDirection,
    ): void {
        let firstTargetPos: Vector3 | null = null;

        // 1. CALCUL DU MULTIPLICATEUR TOTAL
        // On part d'une base de 100% (1.0)
        let totalDamageMultiplier = 1.0;

        // A. Bonus de l'arme (ex: 0.1 pour +10%)
        const weaponBonus = this.data.modifiers?.damageMultiplier?.value ?? 0;
        totalDamageMultiplier += weaponBonus;

        // B. Bonus des consommables/potions (via le dictionnaire du Player)
        if (owner instanceof Player) {
            totalDamageMultiplier += owner.getModifier("damage");
        }

        // 2. CALCUL DES DÉGÂTS DE BASE
        // Dégâts fixes de l'arme + force intrinsèque du perso
        const baseDamage = this.stats.damage + (owner.stats.damage || 0);

        // 3. RÉSULTAT FINAL
        const finalDamage = baseDamage * totalDamageMultiplier;

        for (const targetNode of targets) {
            if (!firstTargetPos) {
                firstTargetPos =
                    targetNode.position || targetNode.getAbsolutePosition();
            }

            const hitStop = this.stats.hitStopDuration ?? 0;
            const knockback = this.stats.knockbackForce ?? 0;

            // Notification avec le montant calculé
            OnEntityDamaged.notifyObservers({
                targetId: targetNode.id,
                attackerId: owner.id,
                amount: finalDamage,
                position: owner.transform.position.clone(),
                attackerFaction: owner.faction,
                hitStopDuration: hitStop,
                knockbackForce: knockback,
            });

            // Feedback visuel de debug
            DebugService.getInstance().drawPoint(
                "hit_" + targetNode.id + "_" + Date.now(),
                this.scene,
                targetNode.getAbsolutePosition
                    ? targetNode.getAbsolutePosition()
                    : targetNode.position,
                Color3.Green(),
                0.4,
            );
        }

        if (firstTargetPos) {
            owner.onHitTarget(firstTargetPos);
        }
    }
}
