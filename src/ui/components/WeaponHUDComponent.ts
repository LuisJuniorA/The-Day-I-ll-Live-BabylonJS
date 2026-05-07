import { Rectangle, Image, Control, TextBlock, Ellipse } from "@babylonjs/gui";
import {
    OnSpellChanged,
    OnWeaponChanged,
} from "../../core/interfaces/CombatEvent";
import { WEAPONS_DB } from "../../data/WeaponsDb";
import type { Spell } from "../../core/interfaces/Spell";
import { Engine } from "@babylonjs/core";

export class WeaponHUDComponent extends Rectangle {
    private _slotVisuals: Map<string, { rect: Rectangle; icon: Image }> =
        new Map();
    private _activeWeaponLabel!: TextBlock;

    // Éléments spécifiques au Sort
    private _activeSpell: Spell | null = null;
    private _spellCooldownOverlay!: Ellipse;

    private readonly _THEME = {
        SOUL_LIGHT: "#f0faff",
        INK_BLACK: "rgba(5, 5, 10, 0.8)",
        INK_BORDER: "rgba(255, 255, 255, 0.05)",
        COOLDOWN_COLOR: "rgba(0, 0, 0, 0.7)",
    };

    private readonly _ICON_PATH = "assets/ui/icons/weapons/";
    private readonly _SPELL_ICON_PATH = "assets/ui/icons/spells/";

    constructor(name: string) {
        super(name);
        this.width = "400px";
        this.height = "300px";
        this.thickness = 0;
        this.background = "transparent";
        this.clipContent = false;
        this.clipChildren = false;

        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

        this.left = "40px";
        this.top = "-40px";

        this._buildHUD();
        this._initObservers();
    }

    private _buildHUD(): void {
        // Label de l'arme active
        this._activeWeaponLabel = new TextBlock("activeWeaponLabel", "");
        this._activeWeaponLabel.color = this._THEME.SOUL_LIGHT;
        this._activeWeaponLabel.fontSize = 18;
        this._activeWeaponLabel.fontFamily = "Georgia, serif";
        this._activeWeaponLabel.fontWeight = "italic";
        this._activeWeaponLabel.height = "40px";
        this._activeWeaponLabel.top = "130px";
        this._activeWeaponLabel.left = "0px";
        this._activeWeaponLabel.textHorizontalAlignment =
            Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.addControl(this._activeWeaponLabel);

        // --- SLOT SORT ACTIF ---
        const spellVisual = this._createCircle("Spell", 90, 0, 85);
        this._slotVisuals.set("Spell", spellVisual);

        // --- L'EFFET DE RAYON (ELLIPSE) ---
        this._spellCooldownOverlay = new Ellipse("spellCooldownOverlay");
        this._spellCooldownOverlay.width = "90px";
        this._spellCooldownOverlay.height = "90px";
        this._spellCooldownOverlay.background = "transparent";
        this._spellCooldownOverlay.color = this._THEME.COOLDOWN_COLOR;

        // Épaisseur = exactement le rayon (90/2) pour un disque plein sans doublons
        this._spellCooldownOverlay.thickness = 45;

        // Start à 0 (vide), rotation à -90° pour commencer à MIDI
        this._spellCooldownOverlay.arc = 0;
        this._spellCooldownOverlay.alpha = 0;
        this._spellCooldownOverlay.rotation = -Math.PI / 2;

        spellVisual.rect.addControl(this._spellCooldownOverlay);

        // --- SLOTS ARMES ---
        const weaponsData = [
            { slot: "Dagger", x: 105, y: 30, rotation: Math.PI / 4, zoom: 1.4 },
            {
                slot: "Sword",
                x: 135,
                y: 100,
                rotation: -Math.PI / 6,
                zoom: 1.6,
            },
            {
                slot: "GreatSword",
                x: 105,
                y: 170,
                rotation: -Math.PI / 6,
                zoom: 1.5,
            },
        ];

        weaponsData.forEach((data) => {
            const visual = this._createCircle(
                data.slot,
                68,
                data.x,
                data.y,
                data.rotation,
                data.zoom,
            );
            this._slotVisuals.set(data.slot, visual);
        });
    }

    private _createCircle(
        name: string,
        size: number,
        x: number,
        y: number,
        rotation: number = 0,
        zoom: number = 1.0,
    ) {
        const rect = new Rectangle(`rect_${name}`);
        rect.width = `${size}px`;
        rect.height = `${size}px`;
        rect.cornerRadius = size / 2;
        rect.thickness = 1;
        rect.color = this._THEME.INK_BORDER;
        rect.background = this._THEME.INK_BLACK;
        rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        rect.left = `${x}px`;
        rect.top = `${y}px`;
        rect.clipContent = true; // Crucial pour l'overlay

        const icon = new Image(`icon_${name}`, "");
        icon.width = "100%";
        icon.height = "100%";
        icon.stretch = Image.STRETCH_UNIFORM;
        icon.alpha = 0.3;
        icon.rotation = rotation;
        icon.scaleX = zoom;
        icon.scaleY = zoom;

        rect.addControl(icon);
        this.addControl(rect);
        return { rect, icon };
    }

    private _updateCooldownDisplay(): void {
        if (!this._activeSpell || this._activeSpell.lastCast === 0) {
            this._spellCooldownOverlay.alpha = 0;
            this._spellCooldownOverlay.arc = 0;
            return;
        }

        const now = Date.now();
        const elapsed = (now - this._activeSpell.lastCast) / 1000;
        const cooldown = this._activeSpell.cooldown;

        if (elapsed < cooldown) {
            // progress : 1.0 (début cooldown) -> 0.0 (prêt)
            const progress = 1 - elapsed / cooldown;

            this._spellCooldownOverlay.alpha = 1;
            // On s'assure que l'arc est au moins très petit pour éviter les glitchs
            this._spellCooldownOverlay.arc = Math.max(0.00001, progress);
        } else {
            this._spellCooldownOverlay.alpha = 0;
            this._spellCooldownOverlay.arc = 0;
        }
    }

    private _initObservers(): void {
        // Observer pour le Sort
        OnSpellChanged.add((spell) => {
            this._activeSpell = spell;
            const visual = this._slotVisuals.get("Spell");
            if (!visual) return;

            if (this._activeSpell) {
                const iconName = this._activeSpell.name
                    .toLowerCase()
                    .replace(/\s+/g, "_");
                visual.icon.source = `${this._SPELL_ICON_PATH}${iconName}.png`;
                visual.icon.alpha = 1.0;
                visual.rect.alpha = 1.0;
            } else {
                visual.icon.source = "";
                visual.rect.alpha = 0.2;
            }
        });

        // Loop de rendu
        const engine = Engine.LastCreatedEngine;
        if (engine) {
            engine.onBeginFrameObservable.add(() => {
                this._updateCooldownDisplay();
            });
        }

        // Observer pour les Armes
        OnWeaponChanged.add((event) => {
            const slots = event.allSlots;
            const activeWeaponId = event.weapon.data.id;
            const dbData = WEAPONS_DB[activeWeaponId];

            this._activeWeaponLabel.text = dbData
                ? `— ${dbData.name.toLowerCase()} —`
                : "";

            this._slotVisuals.forEach((visual, slotKey) => {
                if (slotKey === "Spell") return;

                const weaponIdInSlot = slots[slotKey];
                const isEquipped = event.weapon.slot === slotKey;

                if (weaponIdInSlot) {
                    visual.icon.source = `${this._ICON_PATH}${weaponIdInSlot}.png`;
                    visual.rect.alpha = 1.0;
                } else {
                    visual.icon.source = "";
                    visual.rect.alpha = 0.1;
                }

                if (isEquipped) {
                    visual.rect.scaleX = 1.15;
                    visual.rect.scaleY = 1.15;
                    visual.rect.color = this._THEME.SOUL_LIGHT;
                    visual.rect.background = "rgba(255, 255, 255, 0.15)";
                    visual.rect.shadowBlur = 15;
                    visual.rect.shadowColor = "white";
                    visual.icon.alpha = 1.0;
                } else {
                    visual.rect.scaleX = 1.0;
                    visual.rect.scaleY = 1.0;
                    visual.rect.color = this._THEME.INK_BORDER;
                    visual.rect.background = this._THEME.INK_BLACK;
                    visual.rect.shadowBlur = 0;
                    visual.icon.alpha = 0.3;
                }
            });
        });
    }
}
