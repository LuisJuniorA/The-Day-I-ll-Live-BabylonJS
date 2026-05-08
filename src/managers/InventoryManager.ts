import type { Item } from "../core/types/Items";

export interface InventorySlot {
    item: Item;
    amount: number;
}

export class InventoryManager {
    private _slots: Map<string, InventorySlot> = new Map();
    public readonly maxSlots: number = 24;

    /**
     * Ajoute un item ou augmente sa quantité
     */
    public addItem(item: Item, amount: number): boolean {
        if (this._slots.has(item.id)) {
            this._slots.get(item.id)!.amount += amount;
            return true;
        }

        if (this._slots.size >= this.maxSlots) return false;

        this._slots.set(item.id, { item, amount });
        return true;
    }

    /**
     * Retourne la quantité possédée pour un ID d'item donné
     */
    public getItemAmount(itemId: string): number {
        return this._slots.get(itemId)?.amount ?? 0;
    }

    public get content(): InventorySlot[] {
        return Array.from(this._slots.values());
    }
}
