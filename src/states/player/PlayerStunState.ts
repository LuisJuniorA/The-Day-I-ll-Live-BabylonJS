import { BaseState } from "../../core/abstracts/BaseState";
import type { Player } from "../../entities/Player";
import { PlayerIdleState } from "./PlayerIdleState";
import { PlayerReactionAnim } from "../../core/types/StatusEffects";

export class PlayerStunState extends BaseState<Player> {
    public readonly name = "StunState";
    private _timer: number = 0;
    private _duration: number;
    private _anim: PlayerReactionAnim;

    constructor(
        duration: number,
        anim: PlayerReactionAnim = PlayerReactionAnim.SHOCK,
    ) {
        super();
        this._duration = duration;
        this._anim = anim;
    }

    protected handleEnter(owner: Player): void {
        // Stop immédiat du joueur
        owner.velocity.setAll(0);

        // Joue l'anim demandée (ex: "cower" pour l'Effroi)
        owner.playAnim(this._anim, true);

        console.log(
            `Joueur étourdi pendant ${this._duration}s avec l'anim: ${this._anim}`,
        );
    }

    protected handleUpdate(owner: Player, dt: number): void {
        this._timer += dt;

        if (this._timer >= this._duration) {
            owner.movementFSM.transitionTo(new PlayerIdleState());
        }
    }
}
