import { BaseState } from "../../core/abstracts/BaseState";
import { AttackDirection } from "../../core/interfaces/CombatEvent";
import { Player } from "../../entities/Player";
import { MeleeWeapon } from "../../weapons/MeleeWeapon";
import { PlayerCombatIdleState } from "./PlayerCombatIdleState";

export class PlayerAttackState extends BaseState<Player> {
    public readonly name = "AttackingState";
    private _timer: number = 0;
    private _attackDuration: number = 0;
    private _direction: AttackDirection = AttackDirection.SIDE;

    public onEnter(owner: Player): void {
        super.onEnter(owner);
        this._direction = owner.queuedAttackDirection;
        owner.buffer.consume("attack");

        this._timer = 0;

        if (owner.currentWeapon && owner.currentWeapon instanceof MeleeWeapon) {
            this._attackDuration = owner.currentWeapon.attackDuration;

            // On passe la direction à la méthode attack
            owner.currentWeapon.attack(owner, this._direction);
        } else {
            this._attackDuration = 0.5;
        }
    }

    protected handleUpdate(owner: Player, dt: number): void {
        this._timer += dt;

        // Une fois l'animation/le temps d'attaque terminé, on retourne en Idle
        if (this._timer >= this._attackDuration) {
            owner.attackFSM.transitionTo(new PlayerCombatIdleState());
        }
    }

    public onExit(_owner: Player): void {
        // Rétablir la vitesse de mouvement si on l'avait modifiée
        // owner.stats.speed = owner.originalSpeed;
    }
}
