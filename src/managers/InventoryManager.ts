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
     * Retire une quantité d'un item.
     * Retourne true si l'opération a réussi, false si l'item n'existe pas ou quantité insuffisante.
     */
    public removeItem(itemId: string, amount: number): boolean {
        const slot = this._slots.get(itemId);

        if (!slot || slot.amount < amount) {
            return false;
        }

        slot.amount -= amount;

        // Si la quantité tombe à 0 (ou moins par sécurité), on libère le slot
        if (slot.amount <= 0) {
            this._slots.delete(itemId);
        }

        return true;
    }

    /**
     * Vérifie si l'inventaire contient toutes les quantités demandées
     */
    public hasResources(
        requirements: { itemId: string; amount: number }[],
    ): boolean {
        return requirements.every(
            (req) => this.getItemAmount(req.itemId) >= req.amount,
        );
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
