import { Observable } from "@babylonjs/core";
import type { Item } from "../types/Items";

export interface LootNotificationEvent {
    item: Item;
    amount: number;
}

export const OnLootReceived = new Observable<LootNotificationEvent>();
