import { Observable } from "@babylonjs/core";
import type { Character } from "../abstracts/Character";

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
