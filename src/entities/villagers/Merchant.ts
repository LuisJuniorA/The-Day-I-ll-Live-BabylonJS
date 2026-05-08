import type { Scene, Vector3 } from "@babylonjs/core";
import { NPCInteractable } from "../../core/abstracts/NPCInteractable";
import { OnDialogueRequest } from "../../core/interfaces/Interactable";
import { type ShopItem, OnOpenShop } from "../../core/interfaces/ShopEvents";
import { ItemData } from "../../data/ItemData";

export class Merchant extends NPCInteractable {
    private _shopInventory: ShopItem[] = [];

    constructor(scene: Scene, position: Vector3, data: any) {
        super(scene, position, data);
        this._prepareInventory();
    }

    private _prepareInventory(): void {
        const shopData = this.data.metadata?.shopItems || [];

        this._shopInventory = shopData
            .map((data: any) => {
                const baseItem = (ItemData as any)[data.id];
                if (!baseItem) return null;

                return {
                    ...baseItem,
                    price: data.price, // On utilise le prix défini par le marchand
                };
            })
            .filter(Boolean);
    }

    public onInteract(): void {
        const text = this.data.texts[this._currentIndex];

        OnDialogueRequest.notifyObservers({
            speakerName: this.name,
            text: text,
            onComplete: () => {
                this._currentIndex++;

                if (this._currentIndex < this.data.texts.length) {
                    this.onInteract();
                    return false;
                }

                this._currentIndex = 0;

                // On envoie l'inventaire complet typé à l'UI
                OnOpenShop.notifyObservers({
                    merchantId: this.id,
                    inventory: this._shopInventory,
                });

                return true;
            },
        });
    }
}
