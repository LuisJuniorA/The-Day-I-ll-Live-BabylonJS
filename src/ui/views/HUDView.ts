import { AdvancedDynamicTexture } from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { PromptButtonComponent } from "../components/PromptButtonComponent";
import { HealthBarComponent } from "../components/HealthBarComponent"; // Import ici
import type { AbstractMesh } from "@babylonjs/core";
import { WeaponHUDComponent } from "../components/WeaponHUDComponent";
import { InputConfig } from "../../core/constants/InputConfig";
import { CurrencyHUDComponent } from "../components/CurrencyHUDComponent";

export class HUDView extends BaseView {
    private _interactionPrompt!: PromptButtonComponent;
    private _healthBar!: HealthBarComponent; // Référence au composant
    private _shouldShowPrompt: boolean = false;
    private _weaponHUD!: WeaponHUDComponent;
    public _currencyHUD!: CurrencyHUDComponent;

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
    }

    public updateCurrency(amount: number, delta: number): void {
        this._currencyHUD.updateCurrency(amount, delta);
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
