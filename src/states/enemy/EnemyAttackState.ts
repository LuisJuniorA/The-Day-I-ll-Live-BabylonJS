import {
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Mesh,
} from "@babylonjs/core";
import { BaseState } from "../../core/abstracts/BaseState";
import { Enemy } from "../../core/abstracts/Enemy";
import { EnemyAttackIdleState } from "./EnemyAttackIdleState";
import { OnEntityDamaged } from "../../core/interfaces/CombatEvent";
import { Faction } from "../../core/types/Faction";

export class EnemyAttackState extends BaseState<Enemy> {
    public readonly name = "AttackState";

    private _elapsedTime: number = 0;
    private _hasDealtDamage: boolean = false;
    private _slashMesh: Mesh | null = null;

    // Timings de l'attaque
    private readonly ATTACK_DURATION = 0.5;
    private readonly DAMAGE_MOMENT = 0.2; // Très rapide pour punir le joueur

    protected handleEnter(owner: Enemy): void {
        this._elapsedTime = 0;
        this._hasDealtDamage = false;

        // On arrête l'inertie pour que l'attaque soit "ancrée"
        owner.velocity.setAll(0);

        owner.playAnim("attack", false);
        this.createSlashVisual(owner);
    }

    protected handleUpdate(owner: Enemy, dt: number): void {
        this._elapsedTime += dt;

        // Animation visuelle du slash (Pop & Fade)
        if (this._slashMesh) {
            const scaleFactor = 1 + dt * 5;
            this._slashMesh.scaling.multiplyInPlace(
                new Vector3(scaleFactor, scaleFactor, 1),
            );

            if (this._slashMesh.material) {
                this._slashMesh.material.alpha -= dt * 4;
            }
        }

        // Logique de dégâts
        if (!this._hasDealtDamage && this._elapsedTime >= this.DAMAGE_MOMENT) {
            this.applyDamage(owner);
            this._hasDealtDamage = true;
        }

        // Fin de l'état
        if (this._elapsedTime >= this.ATTACK_DURATION) {
            owner.attackFSM.transitionTo(new EnemyAttackIdleState());
        }
    }

    protected handleExit(_owner: Enemy): void {
        if (this._slashMesh) {
            this._slashMesh.dispose();
            this._slashMesh = null;
        }
    }

    private createSlashVisual(owner: Enemy): void {
        const visualRadius = owner.config.attackRange - 1;

        this._slashMesh = MeshBuilder.CreateDisc(
            "slash_fx",
            {
                radius: visualRadius,
                tessellation: 12,
                arc: 0.25,
                sideOrientation: Mesh.DOUBLESIDE,
            },
            owner.getScene(),
        );

        this._slashMesh.position = owner.position.clone();

        // Orientation 2D selon le regard de l'ennemi
        const isFacingLeft =
            owner.transform.rotation.y > Math.PI / 2 ||
            owner.transform.rotation.y < -Math.PI / 2;

        // Pivot de l'arc (0 = Droite, PI = Gauche)
        this._slashMesh.rotation.z = isFacingLeft
            ? Math.PI - Math.PI / 4
            : -Math.PI / 3;
        this._slashMesh.position.x += isFacingLeft ? -0.5 : 0.5;

        const mat = new StandardMaterial("slash_mat", owner.getScene());
        mat.emissiveColor = new Color3(1, 0.1, 0.1);
        mat.disableLighting = true;
        mat.alpha = 0.8;
        this._slashMesh.material = mat;
    }

    private applyDamage(owner: Enemy): void {
        const targetNode = owner.targetTransform;
        if (!targetNode) return;

        const dist = Vector3.Distance(owner.position, targetNode.position);
        console.log(dist);
        if (dist <= owner.config.attackRange) {
            OnEntityDamaged.notifyObservers({
                targetId: targetNode.id,
                attackerId: owner.id,
                amount: owner.stats.damage || 10,
                position: owner.position.clone(),
                attackerFaction: Faction.ENEMY,
            });

            console.log("💥 Événement de dégâts envoyé pour :", targetNode.id);
        }
    }
}
