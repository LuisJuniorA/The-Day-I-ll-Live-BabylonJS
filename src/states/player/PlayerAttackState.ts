import { BaseState } from "../../core/abstracts/BaseState";
import { AttackDirection } from "../../core/interfaces/CombatEvent";
import { Player } from "../../entities/Player";
import { MeleeWeapon } from "../../weapons/MeleeWeapon";
import { PlayerCastState } from "./PlayerCastState";
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
            // --- MODIFICATION : Calcul de la vitesse d'attaque via la dextérité ---
            // On récupère la durée de base de l'arme
            const baseDuration = owner.currentWeapon.attackDuration;

            // On récupère la stat de dextérité (par défaut 1 si non définie)
            const dex = owner.stats.dexterity!;

            // Formule : Chaque point de dextérité augmente la vitesse de 10%
            // Exemple : 1 point = baseDuration / 1.1 | 10 points = baseDuration / 2
            this._attackDuration = baseDuration / (1 + dex * 0.1);
            console.log(this._attackDuration);
            // On passe la direction à la méthode attack
            owner.currentWeapon.attack(owner, this._direction);
        } else {
            this._attackDuration = 0.5;
        }
    }

    protected handleUpdate(owner: Player, dt: number): void {
        this._timer += dt;

        // --- AJOUT : Permettre de lancer un sort pour annuler la fin de l'attaque ---
        if (owner.activeSpell && owner.buffer.isActive("spell")) {
            const spell = owner.activeSpell;
            const now = Date.now();
            if (now - (spell.lastCast || 0) >= spell.cooldown * 1000) {
                owner.attackFSM.transitionTo(new PlayerCastState(spell));
                return; // On sort de l'attaque physique
            }
        }

        if (this._timer >= this._attackDuration) {
            owner.attackFSM.transitionTo(new PlayerCombatIdleState());
        }
    }

    public onExit(_owner: Player): void {
        // Rétablir la vitesse de mouvement si on l'avait modifiée
        // owner.stats.speed = owner.originalSpeed;
    }
}
