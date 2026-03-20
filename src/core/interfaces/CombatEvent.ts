import { Observable, Vector3 } from "@babylonjs/core";
import type { FactionType } from "../types/Faction";

export interface DamageEvent {
    targetId: string; // Qui on touche
    attackerId: string; // Qui frappe
    amount: number; // Combien de dégâts
    position: Vector3; // Où ça se passe (utile pour le recul/VFX)
    attackerFaction: FactionType;
}

export const OnEntityDamaged = new Observable<DamageEvent>();
