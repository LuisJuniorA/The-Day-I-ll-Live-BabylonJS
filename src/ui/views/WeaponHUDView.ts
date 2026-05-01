import {
    TextBlock,
    AdvancedDynamicTexture,
    Rectangle,
    Control,
} from "@babylonjs/gui";
import { OnWeaponChanged } from "../../core/interfaces/CombatEvent";
import { BaseView } from "../../core/abstracts/BaseView";
import { WEAPONS_DB } from "../../data/WeaponsDb";

export class WeaponHUDView extends BaseView {
    private _container: Rectangle | null = null;
    private _slotVisuals: Map<string, { rect: Rectangle; text: TextBlock }> =
        new Map();

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "WeaponHUDView");
        this.buildUI();
        this._initObservers();
    }

    protected buildUI(): void {
        // Container principal en bas à droite
        this._container = new Rectangle("weaponHUD");
        this._container.width = "300px";
        this._container.height = "120px";
        this._container.thickness = 0;
        this._container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._container.left = "-20px";
        this._container.top = "-20px";
        this.rootContainer.addControl(this._container);

        // On crée les 3 slots (Dagger, Sword, GreatSword)
        const slots = ["Dagger", "Sword", "GreatSword"];

        slots.forEach((slot, index) => {
            const slotRect = new Rectangle(`slot_${slot}`);
            slotRect.width = "60px";
            slotRect.height = "60px";
            slotRect.cornerRadius = 30; // Cercle
            slotRect.thickness = 2;
            slotRect.color = "#444444";
            slotRect.background = "rgba(0,0,0,0.5)";
            slotRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;

            // Calcul de la position (l'arme active sera plus grosse et décalée)
            slotRect.left = `${-index * 70}px`;

            const txt = new TextBlock(`txt_${slot}`, "");
            txt.color = "white";
            txt.fontSize = 12;
            slotRect.addControl(txt);

            this._container!.addControl(slotRect);
            this._slotVisuals.set(slot, { rect: slotRect, text: txt });
        });
    }

    private _initObservers(): void {
        OnWeaponChanged.add((event) => {
            const slots = (event as any).allSlots;
            if (!slots) return;

            Object.keys(slots).forEach((slotName) => {
                const visual = this._slotVisuals.get(slotName);
                if (!visual) return;

                const weaponId = slots[slotName];
                const isEquipped = event.weapon.slot === slotName;

                if (weaponId) {
                    const data = WEAPONS_DB[weaponId];
                    visual.text.text = data
                        ? data.name.substring(0, 3).toUpperCase()
                        : "";
                    visual.rect.alpha = 1;
                } else {
                    visual.text.text = "";
                    visual.rect.alpha = 0.3; // Slot vide
                }

                // Animation de l'arme active
                if (isEquipped) {
                    visual.rect.scaleX = 1.3;
                    visual.rect.scaleY = 1.3;
                    visual.rect.color = "#00FFaa"; // Couleur d'âme
                    visual.rect.background = "rgba(0,100,80,0.4)";
                    visual.rect.zIndex = 10;
                } else {
                    visual.rect.scaleX = 1.0;
                    visual.rect.scaleY = 1.0;
                    visual.rect.color = "#444444";
                    visual.rect.background = "rgba(0,0,0,0.5)";
                    visual.rect.zIndex = 1;
                }
            });
        });
    }
}
