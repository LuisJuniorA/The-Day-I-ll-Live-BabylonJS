import { Observable, Vector3 } from "@babylonjs/core";
import type { FactionType } from "../types/Faction";
import type { PlayerReactionAnim, StatusType } from "../types/StatusEffects";
import type { Weapon } from "../abstracts/Weapon";
import type { Character } from "../abstracts/Character";
import type { Item } from "../types/Items";

export interface DamageEvent {
    targetId: string; // Qui on touche
    attackerId: string; // Qui frappe
    amount: number; // Combien de dégâts
    position: Vector3; // Où ça se passe (utile pour le recul/VFX)
    attackerFaction: FactionType;
    hitStopMultiplier?: number; // 1.0 par défaut
}

export interface StatusEvent {
    targetId: string;
    effectType: StatusType; // Enum
    visualAnim?: PlayerReactionAnim;
    duration: number;
    originId: string;
}

export interface HealthChangedEvent {
    currentHp: number;
    maxHp: number;
    entityId: string;
}

export interface WeaponChangedEvent {
    weapon: Weapon;
    allSlots: Record<string, string | null>; // Ajout de l'état complet des slots
}

export interface WeaponRequestEvent {
    character: Character;
    weaponId: string;
}

export interface ExperienceEvent {
    targetId: string; // Généralement le joueur
    amount: number;
}

export interface ItemPickupEvent {
    targetId: string; // Généralement le joueur
    item: Item;
    amount: number;
}

export const OnRequestWeaponEquip = new Observable<WeaponRequestEvent>();
export const OnHealthChanged = new Observable<HealthChangedEvent>();
export const OnEntityDamaged = new Observable<DamageEvent>();
export const OnStatusApplied = new Observable<StatusEvent>();
export const OnWeaponChanged = new Observable<WeaponChangedEvent>();
export const OnDamageConfirmed = new Observable<DamageEvent>();
export const OnExperienceGained = new Observable<ExperienceEvent>();
export const OnItemPickedUp = new Observable<ItemPickupEvent>();
