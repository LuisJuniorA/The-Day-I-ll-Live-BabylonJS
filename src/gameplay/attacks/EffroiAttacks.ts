import type { Enemy } from "../../core/abstracts/Enemy";
import type { ActionBehavior } from "../../core/interfaces/Behaviors";
import {
    OnEntityDamaged,
    OnStatusApplied,
} from "../../core/interfaces/CombatEvent";
import { PlayerReactionAnim, StatusType } from "../../core/types/StatusEffects";

export class EffroiClaw implements ActionBehavior {
    public readonly name = "Claw";
    public readonly animationName = "claw"; // Nom de l'anim dans ton .glb
    public readonly duration = 0.8;
    public readonly damageMoment = 0.4;
    public readonly range = 2.5;
    public readonly basePriority = 10;
    public lastUsed = 0;
    public cooldown = 500; // Petit délai entre deux griffes

    executeEffect(_owner: Enemy): void {
        // Optionnel : Son de slash
    }

    onHit(owner: Enemy, targetId: string): void {
        OnEntityDamaged.notifyObservers({
            targetId: targetId,
            attackerId: owner.id,
            amount: owner.stats.damage || 15,
            position: owner.position.clone(),
            attackerFaction: owner.faction,
        });
    }
}

export class EffroiRoar implements ActionBehavior {
    public readonly name = "Roar";
    public readonly animationName = "roar";
    public readonly duration = 3.5;
    public readonly damageMoment = 0.8; // Le cri part assez vite
    public readonly range = 12;
    public readonly basePriority = 5;
    public readonly cooldown = 8000; // 8 secondes de repos
    public lastUsed = 0;

    executeEffect(_owner: Enemy): void {
        console.log("📢 ROAR !");
    }

    onHit(owner: Enemy, targetId: string): void {
        OnStatusApplied.notifyObservers({
            targetId: targetId,
            effectType: StatusType.STUN,
            duration: 2.2, // Un peu plus long que l'anim pour permettre à l'ennemi de charger
            visualAnim: PlayerReactionAnim.COWER,
            originId: owner.id,
        });
    }
}
