import { Observable, Vector3 } from "@babylonjs/core";
import type { FactionType } from "../types/Faction";
import type { PlayerReactionAnim, StatusType } from "../types/StatusEffects";

export interface DamageEvent {
    targetId: string; // Qui on touche
    attackerId: string; // Qui frappe
    amount: number; // Combien de dégâts
    position: Vector3; // Où ça se passe (utile pour le recul/VFX)
    attackerFaction: FactionType;
}

export interface StatusEvent {
    targetId: string;
    effectType: StatusType; // Enum
    visualAnim?: PlayerReactionAnim;
    duration: number;
    originId: string;
}

export const OnEntityDamaged = new Observable<DamageEvent>();
export const OnStatusApplied = new Observable<StatusEvent>();
