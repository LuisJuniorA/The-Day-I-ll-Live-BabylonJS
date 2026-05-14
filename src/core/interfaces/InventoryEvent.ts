import { Observable } from "@babylonjs/core";
import type { Character } from "../abstracts/Character";
import type { Player } from "../../entities/Player";
import type { WeaponSlot } from "../types/WeaponTypes";

export interface InventoryItem {
    id: string;
    quantity: number;
    type: string;
    metadata?: any;
}

export interface InventoryEventData {
    playerId: string;
    items: InventoryItem[];
}

export const OnOpenInventory = new Observable<InventoryEventData>();
export const OnInventoryUpdated = new Observable<void>();
export const OnRequestConsumableUse = new Observable<{
    character: Character;
    itemId: string;
}>();

// src/core/interfaces/InventoryEvent.ts
export const OnRequestEquipToSlot = new Observable<{
    player: Player;
    weaponId: string | null;
    slot: WeaponSlot; // "dagger", "sword", etc.
}>();
