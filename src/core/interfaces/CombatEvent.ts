import { Observable, Vector3 } from "@babylonjs/core";
import type { FactionType } from "../types/Faction";
import type { PlayerReactionAnim, StatusType } from "../types/StatusEffects";
import type { Weapon } from "../abstracts/Weapon";
import type { Character } from "../abstracts/Character";
import type { Item } from "../types/Items";
import type { Spell } from "./Spell";

// core/interfaces/CombatEvent.ts
export interface DamageEvent {
    targetId: string;
    attackerId: string;
    amount: number;
    position: Vector3;
    attackerFaction: FactionType;

    // --- NOUVEAUX PARAMÈTRES DE GAME FEEL ---
    hitStopDuration?: number; // Si undefined ou 0 => pas de hitstop
    knockbackForce?: number; // Si undefined ou 0 => pas de recul
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

export const AttackDirection = {
    SIDE: "side",
    UP: "up",
    DOWN: "down",
} as const;

export type AttackDirection =
    (typeof AttackDirection)[keyof typeof AttackDirection];

export const OnRequestWeaponEquip = new Observable<WeaponRequestEvent>();
export const OnHealthChanged = new Observable<HealthChangedEvent>();
export const OnEntityDamaged = new Observable<DamageEvent>();
export const OnStatusApplied = new Observable<StatusEvent>();
export const OnWeaponChanged = new Observable<WeaponChangedEvent>();
export const OnDamageConfirmed = new Observable<DamageEvent>();
export const OnExperienceGained = new Observable<ExperienceEvent>();
export const OnItemPickedUp = new Observable<ItemPickupEvent>();
export const OnSpellChanged = new Observable<Spell | null>();
