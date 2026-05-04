import type { Item } from "../core/types/Items";

export interface InventorySlot {
    item: Item;
    amount: number;
}

export class InventoryManager {
    private _slots: Map<string, InventorySlot> = new Map();
    public readonly maxSlots: number = 24;

    public addItem(item: Item, amount: number): boolean {
        // Si l'objet existe déjà, on augmente la quantité
        if (this._slots.has(item.id)) {
            this._slots.get(item.id)!.amount += amount;
            return true;
        }

        // Sinon, on vérifie s'il reste de la place
        if (this._slots.size >= this.maxSlots) return false;

        this._slots.set(item.id, { item, amount });
        return true;
    }

    public get content(): InventorySlot[] {
        return Array.from(this._slots.values());
    }
}
