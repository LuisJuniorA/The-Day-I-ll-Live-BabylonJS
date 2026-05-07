import { BaseState } from "../../core/abstracts/BaseState";
import type { Spell } from "../../core/interfaces/Spell";
import { Player } from "../../entities/Player";
import { PlayerCombatIdleState } from "./PlayerCombatIdleState";

export class PlayerCastState extends BaseState<Player> {
    public readonly name = "CastingState";
    private _timer: number = 0;
    private _spell: Spell;

    constructor(spell: Spell) {
        super();
        this._spell = spell;
    }

    public onEnter(owner: Player): void {
        super.onEnter(owner);
        this._timer = 0;
        owner.buffer.consume("spell");

        // Exécution du sort
        this._spell.execute(owner);
        this._spell.lastCast = Date.now();

        // Optionnel : ralentir le joueur pendant le cast
        owner.velocity.x *= 0.2;
    }

    protected handleUpdate(owner: Player, dt: number): void {
        this._timer += dt;
        if (this._timer >= this._spell.castDuration) {
            owner.attackFSM.transitionTo(new PlayerCombatIdleState());
        }
    }
}
