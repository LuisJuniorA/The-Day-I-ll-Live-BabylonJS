import { Scene, AbstractMesh, AnimationGroup, Vector3 } from "@babylonjs/core";
import { Enemy } from "../../core/abstracts/Enemy";
import { ProximitySystem } from "../../core/engines/ProximitySystem";
import type { EnemyConfig } from "../../core/types/EnemyConfig";
import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import { EffroiClaw, EffroiRoar } from "../../gameplay/attacks/EffroiAttacks";

export class Effroi extends Enemy {
    private _claw = new EffroiClaw();
    private _roar = new EffroiRoar();

    // Paramètres de gravité personnalisables pour l'Effroi
    private readonly GRAVITY = -0.98;
    private readonly TERMINAL_VELOCITY = -15;

    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        rootMesh: AbstractMesh,
        animations: AnimationGroup[],
    ) {
        super(scene, data, proximitySystem, rootMesh);
        this.availableAttacks.push(this._claw, this._roar);

        animations.forEach((ag) => {
            ag.stop();
            ag.enableBlending = true;
            ag.blendingSpeed = 0.15;
            this.animations.set(ag.name.toLowerCase(), ag);
        });
    }

    public getNextAttack(): ActionBehavior {
        const target = this.targetTransform;
        if (!target || this.availableAttacks.length === 0) {
            return this.availableAttacks[0];
        }

        const dist = Vector3.Distance(this.position, target.position);

        if (dist > 4 && dist <= 10) return this._roar;
        return this._claw;
    }

    /**
     * Surcharge de l'update pour gérer la physique de l'Effroi
     */
    public update(dt: number): void {
        if (this.isDead || !this.mesh) return;

        // 1. Vérification du sol (Raycast généralement géré dans Character/Enemy)
        this.checkGrounded();

        // 2. Application de la gravité
        if (!this.isGrounded) {
            // On applique l'accélération gravitationnelle
            this.velocity.y += this.GRAVITY;

            // On limite la vitesse de chute
            if (this.velocity.y < this.TERMINAL_VELOCITY) {
                this.velocity.y = this.TERMINAL_VELOCITY;
            }
        } else {
            // Si on touche le sol, on annule la vélocité verticale négative
            // On garde une légère force vers le bas (0.1) pour rester "collé" au sol
            this.velocity.y = Math.max(0, this.velocity.y);
        }

        // 3. Application du mouvement final au TransformNode
        // On multiplie par dt pour l'indépendance du framerate
        const frameMovement = this.velocity.scale(dt);
        this.transform.position.addInPlace(frameMovement);

        // 4. Appel de la logique parente (FSM, Contact Damage, etc.)
        super.update(dt);
    }

    public playIdle(): void {
        this.playAnim("IDLE", true);
    }

    public playMove(): void {
        this.playAnim("RUN", true);
    }
}
