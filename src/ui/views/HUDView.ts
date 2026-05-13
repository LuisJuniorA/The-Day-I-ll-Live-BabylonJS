import { AdvancedDynamicTexture, Control, StackPanel } from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { PromptButtonComponent } from "../components/PromptButtonComponent";
import { HealthBarComponent } from "../components/HealthBarComponent"; // Import ici
import type { AbstractMesh } from "@babylonjs/core";
import { WeaponHUDComponent } from "../components/WeaponHUDComponent";
import { InputConfig } from "../../core/constants/InputConfig";
import { CurrencyHUDComponent } from "../components/CurrencyHUDComponent";
import type { Item } from "../../core/types/Items";
import { LootNotificationComponent } from "../components/LootNotificationComponent";

export class HUDView extends BaseView {
    private _interactionPrompt!: PromptButtonComponent;
    private _healthBar!: HealthBarComponent; // Référence au composant
    private _shouldShowPrompt: boolean = false;
    private _weaponHUD!: WeaponHUDComponent;
    public _currencyHUD!: CurrencyHUDComponent;
    private _lootStack!: StackPanel;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "HUDView");
        this.buildUI();
    }

    protected buildUI(): void {
        // --- Barre de vie ---
        this._healthBar = new HealthBarComponent("PlayerHealthBar");
        this.advancedTexture.addControl(this._healthBar);

        // --- Armes ---
        this._weaponHUD = new WeaponHUDComponent("PlayerWeaponHUD");
        this.rootContainer.addControl(this._weaponHUD);

        // --- Interaction Prompt ---
        const interactKey = InputConfig.getKeyLabel("interact");
        this._interactionPrompt = new PromptButtonComponent(
            "PlayerInteraction",
            interactKey,
        );
        this.advancedTexture.addControl(this._interactionPrompt);

        this._currencyHUD = new CurrencyHUDComponent("PlayerCurrency", 0);
        this.advancedTexture.addControl(this._currencyHUD);

        this._createLootContainer();
    }

    public updateCurrency(amount: number, delta: number): void {
        this._currencyHUD.updateCurrency(amount, delta);
    }

    private _createLootContainer() {
        this._lootStack = new StackPanel("LootStack");
        this._lootStack.width = "250px";
        this._lootStack.isVertical = true;
        this._lootStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._lootStack.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._lootStack.top = "-50px"; // Pour ne pas coller tout en bas
        this.rootContainer.addControl(this._lootStack);
    }

    public displayLoot(item: Item, amount: number) {
        const notification = new LootNotificationComponent(item, amount);

        // On l'ajoute à la pile
        this._lootStack.addControl(notification);

        // Suppression automatique après 3 secondes
        setTimeout(() => {
            this._lootStack.removeControl(notification);
            notification.dispose();
        }, 3000);
    }
    /**
     * API publique pour mettre à jour la vie depuis un Manager ou le Player
     */
    public updatePlayerHealth(current: number, max: number): void {
        this._healthBar.updateHealth(current, max);
    }

    /**
     * Appelé par l'Observable dans l'UIManager
     */
    public setInteractionAvailable(
        isAvailable: boolean,
        mesh?: AbstractMesh,
    ): void {
        this._shouldShowPrompt = isAvailable;

        if (isAvailable && mesh) {
            this._interactionPrompt.showAtMesh(mesh);
            this._interactionPrompt.show();
        } else {
            this._interactionPrompt.hide();
        }
    }

    public show(): void {
        super.show();
        this.healthBar.isVisible = true;
        this._weaponHUD.isVisible = true;

        if (this._shouldShowPrompt) {
            this._interactionPrompt.show();
        }
    }

    public hide(): void {
        super.hide();
        this.healthBar.isVisible = false;
        this._weaponHUD.isVisible = false;
    }

    public get healthBar(): HealthBarComponent {
        return this._healthBar;
    }

    public get interactionPrompt(): PromptButtonComponent {
        return this._interactionPrompt;
    }
}
