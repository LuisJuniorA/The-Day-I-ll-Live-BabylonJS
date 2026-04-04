import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { MeleeWeapon } from "../../weapons/MeleeWeapon";
import { PlayerCombatIdleState } from "./PlayerCombatIdleState";

export class PlayerAttackState extends BaseState<Player> {
    public readonly name = "AttackingState";
    private _timer: number = 0;
    private _attackDuration: number = 0;

    public onEnter(owner: Player): void {
        super.onEnter(owner);
        owner.buffer.consume("attack");
        this._timer = 0;

        if (owner.currentWeapon && owner.currentWeapon instanceof MeleeWeapon) {
            // Récupère la durée de l'attaque en fonction de l'arme (Dague = rapide, GreatSword = lent)
            this._attackDuration = owner.currentWeapon.attackDuration;

            // Déclenche la logique d'attaque (animations, dégâts)
            owner.currentWeapon.attack(owner);

            // OPTIONNEL : Bloquer le mouvement du joueur pendant les attaques lourdes
            // if(owner.currentWeapon.name === "GreatSword") owner.stats.speed = 0;
        } else {
            this._attackDuration = 0.5; // Fallback
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
