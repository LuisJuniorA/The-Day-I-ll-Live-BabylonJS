import { AdvancedDynamicTexture, Control, StackPanel } from "@babylonjs/gui";
import { BaseView } from "../../core/abstracts/BaseView";
import { PromptButtonComponent } from "../components/PromptButtonComponent";
import { HealthBarComponent } from "../components/HealthBarComponent";
import { ExperienceBarComponent } from "../components/ExperienceBarComponent";
import { WeaponHUDComponent } from "../components/WeaponHUDComponent";
import { CurrencyHUDComponent } from "../components/CurrencyHUDComponent";
import { LootNotificationComponent } from "../components/LootNotificationComponent";
import { InputConfig } from "../../core/constants/InputConfig";
import type { AbstractMesh } from "@babylonjs/core";
import type { Item } from "../../core/types/Items";

export class HUDView extends BaseView {
    // Composants UI
    private _healthBar!: HealthBarComponent;
    private _expBar!: ExperienceBarComponent;
    private _interactionPrompt!: PromptButtonComponent;
    private _weaponHUD!: WeaponHUDComponent;
    public _currencyHUD!: CurrencyHUDComponent;

    // Conteneurs
    private _statsStack!: StackPanel;
    private _lootStack!: StackPanel;

    // État
    private _shouldShowPrompt: boolean = false;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        super(advancedTexture, "HUDView");
        this.buildUI();
    }

    protected buildUI(): void {
        // Le conteneur "Maître" pour tout le bloc en haut à gauche
        this._statsStack = new StackPanel("PlayerStatsStack");
        this._statsStack.width = "400px";
        this._statsStack.height = "100px"; // Hauteur réduite
        this._statsStack.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._statsStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._statsStack.left = "40px";
        this._statsStack.top = "40px";
        this._statsStack.spacing = 0; // On gère l'espace manuellement ou on le met à 2 max
        this.advancedTexture.addControl(this._statsStack);

        // Ajout des composants dans la pile
        this._healthBar = new HealthBarComponent("PlayerHealthBar");
        this._statsStack.addControl(this._healthBar);

        this._expBar = new ExperienceBarComponent("PlayerExpBar");
        this._expBar.paddingTop = "2px"; // Juste un petit pixel de séparation
        this._expBar.paddingLeft = "2px";
        this._statsStack.addControl(this._expBar);

        // --- 2. Armes (Généralement en bas à gauche ou droite via son composant) ---
        this._weaponHUD = new WeaponHUDComponent("PlayerWeaponHUD");
        this.rootContainer.addControl(this._weaponHUD);

        // --- 3. Interaction Prompt (Bouton contextuel) ---
        const interactKey = InputConfig.getKeyLabel("interact");
        this._interactionPrompt = new PromptButtonComponent(
            "PlayerInteraction",
            interactKey,
        );
        this.advancedTexture.addControl(this._interactionPrompt);

        // --- 4. Argent (Currency) ---
        this._currencyHUD = new CurrencyHUDComponent("PlayerCurrency", 0);
        this.advancedTexture.addControl(this._currencyHUD);

        // --- 5. Notifications de Loot ---
        this._createLootContainer();
    }

    /**
     * Crée le conteneur vertical pour empiler les notifications de loot
     */
    private _createLootContainer(): void {
        this._lootStack = new StackPanel("LootStack");
        this._lootStack.width = "250px";
        this._lootStack.isVertical = true;
        this._lootStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._lootStack.horizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._lootStack.top = "-50px";
        this.rootContainer.addControl(this._lootStack);
    }

    // --- API Publique de mise à jour ---

    public updatePlayerHealth(current: number, max: number): void {
        this._healthBar.updateHealth(current, max);
    }

    public updatePlayerExperience(
        current: number,
        next: number,
        level: number,
    ): void {
        this._expBar.updateProgress(current, next, level);
    }

    public updateCurrency(amount: number, delta: number): void {
        this._currencyHUD.updateCurrency(amount, delta);
    }

    public displayLoot(item: Item, amount: number): void {
        const notification = new LootNotificationComponent(item, amount);
        this._lootStack.addControl(notification);

        // Suppression automatique après 3 secondes
        setTimeout(() => {
            this._lootStack.removeControl(notification);
            notification.dispose();
        }, 3000);
    }

    /**
     * Gère l'affichage du prompt d'interaction au-dessus d'un mesh
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

    // --- Overrides de BaseView ---

    public show(): void {
        super.show();
        this._statsStack.isVisible = true;
        this._weaponHUD.isVisible = true;
        this._currencyHUD.isVisible = true;

        if (this._shouldShowPrompt) {
            this._interactionPrompt.show();
        }
    }

    public hide(): void {
        super.hide();
        this._statsStack.isVisible = false;
        this._weaponHUD.isVisible = false;
        this._currencyHUD.isVisible = false;
        this._interactionPrompt.hide();
    }

    // --- Getters ---

    public get healthBar(): HealthBarComponent {
        return this._healthBar;
    }

    public get expBar(): ExperienceBarComponent {
        return this._expBar;
    }

    public get interactionPrompt(): PromptButtonComponent {
        return this._interactionPrompt;
    }
}
