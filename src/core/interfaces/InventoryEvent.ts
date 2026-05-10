import { Observable } from "@babylonjs/core";

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
