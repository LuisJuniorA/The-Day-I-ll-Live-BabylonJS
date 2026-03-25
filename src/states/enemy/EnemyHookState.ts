import { Vector3, Quaternion } from "@babylonjs/core";
import { EnemyState } from "../../core/abstracts/EnemyState";
import { Enemy } from "../../core/abstracts/Enemy";
import type { HookPoint } from "../../core/engines/HookScanner";
import { EnemyChaseState } from "./EnemyChaseState";
import { HookScannerBehavior } from "../../gameplay/behaviors/HookScannerBehavior";

export class EnemyHookState extends EnemyState {
    public readonly name = "HookState";

    private _target: HookPoint;
    private readonly HOOK_DURATION = 0.3; // Temps du trajet en secondes
    private _isFinished = false;
    private _startRotation: Quaternion = new Quaternion();

    constructor(target: HookPoint) {
        super();
        this._target = target;
    }

    protected handleEnter(owner: Enemy): void {
        // 1. On stoppe l'inertie du steering précédent
        owner.velocity.setAll(0);

        // 2. Préparation obligatoire pour les rotations fluides (Slerp)
        if (!owner.transform.rotationQuaternion) {
            owner.transform.rotationQuaternion = Quaternion.FromEulerVector(
                owner.transform.rotation,
            );
        }
        this._startRotation.copyFrom(owner.transform.rotationQuaternion);

        console.log(
            `[${this.name}] Propulsion vers le mur (Normale: ${this._target.normal})`,
        );
    }

    protected handleUpdate(owner: Enemy, dt: number): void {
        if (this._isFinished) return;

        const toTarget = this._target.position.subtract(owner.position);
        const distance = toTarget.length();

        // --- 1. CALCUL DE LA VÉLOCITÉ ---
        // On calcule la vitesse nécessaire pour arriver exactement à HOOK_DURATION
        const timeLeft = Math.max(this.HOOK_DURATION - this.timeInState, dt);
        const speed = distance / timeLeft;
        const moveVelocity = toTarget.normalize().scale(speed);

        // On utilise TA méthode move() pour respecter moveWithCollisions et les limites Z
        owner.move(moveVelocity, dt);

        // --- 2. ROTATION (ALIGNEMENT MUR) ---
        const progress = Math.min(this.timeInState / this.HOOK_DURATION, 1);

        // On génère un vecteur "Forward" orthogonal à la normale du mur
        // Si la normale est trop proche de Right, on utilise Forward pour le produit en croix
        let forward = Vector3.Cross(this._target.normal, Vector3.Right());
        if (forward.length() < 0.1) {
            forward = Vector3.Cross(this._target.normal, Vector3.Forward());
        }

        // On crée la rotation : la normale du mur devient le "Haut" (Up) du slime
        const targetRot = Quaternion.FromLookDirectionLH(
            forward.normalize(),
            this._target.normal,
        );

        // Interpolation sphérique (Slerp) pour pivoter pendant le vol
        Quaternion.SlerpToRef(
            this._startRotation,
            targetRot,
            progress,
            owner.transform.rotationQuaternion!,
        );

        // --- 3. ARRIVÉE ---
        // Si on est assez proche ou que le temps est écoulé
        if (distance < 0.2 || progress >= 1) {
            this._isFinished = true;
            this.finalizeHook(owner, targetRot);
        }
    }

    private finalizeHook(owner: Enemy, finalRot: Quaternion): void {
        // On sature la rotation à la valeur cible exacte
        owner.transform.rotationQuaternion!.copyFrom(finalRot);

        // On repasse en ChaseState
        const nextState = new EnemyChaseState();

        // CRUCIAL : On ré-attache le scanner pour que le slime puisse
        // scanner un nouveau mur une fois arrivé sur celui-ci
        nextState.addBehavior(new HookScannerBehavior());

        owner.movementFSM.transitionTo(nextState);
    }
}
