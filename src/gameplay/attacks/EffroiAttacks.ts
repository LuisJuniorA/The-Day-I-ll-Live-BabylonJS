import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import { Enemy } from "../../core/abstracts/Enemy";
import {
    OnEntityDamaged,
    OnStatusApplied,
} from "../../core/interfaces/CombatEvent";
import { PlayerReactionAnim, StatusType } from "../../core/types/StatusEffects";

export class EffroiClaw implements ActionBehavior {
    public readonly animationName = "SWORD_SLASH";
    public readonly duration = 0.6;
    public readonly damageMoment = 0.3;
    public readonly range = 2.5;

    executeEffect(_owner: Enemy): void {
        // Logique visuelle (CreateDisc, etc.)
        console.log("Visual: Slash rouge");
    }

    onHit(owner: Enemy, targetId: string): void {
        OnEntityDamaged.notifyObservers({
            targetId: targetId,
            attackerId: owner.id,
            amount: owner.stats.damage || 10,
            position: owner.position.clone(),
            attackerFaction: owner.faction,
        });
    }
}

export class EffroiRoar implements ActionBehavior {
    public readonly animationName = "roar";
    public readonly duration = 2.0;
    public readonly damageMoment = 0.8;
    public readonly range = 6;

    executeEffect(_owner: Enemy): void {
        // Optionnel : Secouer la caméra ou créer une onde de choc visuelle
        console.log("📢 Effroi rugit !");
    }

    onHit(owner: Enemy, targetId: string): void {
        OnStatusApplied.notifyObservers({
            targetId: targetId,
            effectType: StatusType.STUN,
            duration: 2.0,
            visualAnim: PlayerReactionAnim.COWER,
            originId: owner.id,
        });
    }
}
