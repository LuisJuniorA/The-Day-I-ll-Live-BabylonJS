import { BaseState } from "../../core/abstracts/BaseState";
import { Player } from "../../entities/Player";
import { PlayerAttackState } from "./PlayerAttackState";

export class PlayerCombatIdleState extends BaseState<Player> {
    public readonly name = "CombatIdleState";

    protected handleUpdate(owner: Player, _dt: number): void {
        // Si le joueur n'a pas d'arme, il ne peut pas attaquer
        if (!owner.currentWeapon) return;

        if (owner.buffer.isActive("attack")) {
            owner.attackFSM.transitionTo(new PlayerAttackState());
        }
    }
}
