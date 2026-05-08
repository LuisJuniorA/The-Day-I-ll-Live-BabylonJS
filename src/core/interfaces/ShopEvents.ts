import { Observable } from "@babylonjs/core";
import type { Item } from "../types/Items";

export interface ShopItem extends Item {
    price: number; // Le prix de vente du marchand
    ownedCount?: number;
}

export interface ShopEventData {
    merchantId: string;
    inventory: ShopItem[];
}

export const OnOpenShop = new Observable<ShopEventData>();
export const OnPurchaseRequest = new Observable<ShopItem>();
