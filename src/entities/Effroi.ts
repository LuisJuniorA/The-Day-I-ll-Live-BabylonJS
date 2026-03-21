import { Scene, AbstractMesh, AnimationGroup, Vector3 } from "@babylonjs/core";
import { Enemy } from "../core/abstracts/Enemy";
import { ProximitySystem } from "../core/engines/ProximitySystem";
import type { EnemyConfig } from "../core/types/EnemyConfig";
import type { AttackBehavior } from "../core/interfaces/AttackBehavior";
import { EffroiClaw, EffroiRoar } from "../gameplay/attacks/EffroiAttacks";

export class Effroi extends Enemy {
    // On définit les attaques spécifiques à l'Effroi
    private _claw = new EffroiClaw();
    private _roar = new EffroiRoar();

    protected availableAttacks = [this._claw, this._roar];

    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        rootMesh: AbstractMesh,
        animations: AnimationGroup[],
    ) {
        super(scene, data, proximitySystem, rootMesh);

        animations.forEach((ag) => {
            ag.stop();
            // Active le mélange fluide
            ag.enableBlending = true;
            // Temps de transition (0.05 à 0.2 est idéal pour du combat rapide)
            ag.blendingSpeed = 0.15;

            this.animations.set(ag.name.toLowerCase(), ag);
        });
    }

    public getNextAttack(): AttackBehavior {
        const target = this.targetTransform;

        // Sécurité si pas de cible ou pas d'attaques
        if (!target || this.availableAttacks.length === 0) {
            return this.availableAttacks[0];
        }

        const dist = Vector3.Distance(this.position, target.position);

        // LOGIQUE SPECIFIQUE A L'EFFROI
        // Si le joueur est entre 4m et 10m, on rugit pour le stun
        if (dist > 4 && dist <= 10) return this._roar;
        return this._claw;
    }

    public playIdle(): void {
        this.playAnim("IDLE", true);
    }

    public playMove(): void {
        this.playAnim("RUN", true);
    }
}
