import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerAttackState } from "./PlayerAttackState";
import { PlayerCastState } from "./PlayerCastState";

export class PlayerCombatIdleState extends BaseState<Player> {
    public readonly name = "CombatIdleState";

    protected handleUpdate(owner: Player, _dt: number): void {
        // --- 1. GESTION DES SORTS ---
        // Si le joueur a un sort et qu'il a appuyé sur la touche (présent dans le buffer)
        if (owner.activeSpell && owner.buffer.isActive("spell")) {
            const spell = owner.activeSpell;
            const now = Date.now();
            const cooldownMs = spell.cooldown * 1000;

            // Vérification du Cooldown uniquement (pas de mana)
            if (now - (spell.lastCast || 0) >= cooldownMs) {
                // Le PlayerCastState s'occupera de faire owner.buffer.consume("spell")
                owner.attackFSM.transitionTo(new PlayerCastState(spell));
                return;
            }
        }

        // --- 2. GESTION DES ATTAQUES PHYSIQUES ---
        // Note : On ne vérifie l'attaque que si le sort n'a pas été lancé (grâce au return plus haut)
        if (owner.currentWeapon && owner.buffer.isActive("attack")) {
            owner.attackFSM.transitionTo(new PlayerAttackState());
        }
    }
}
