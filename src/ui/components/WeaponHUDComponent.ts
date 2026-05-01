import { Rectangle, Image, Control, TextBlock } from "@babylonjs/gui";
import { OnWeaponChanged } from "../../core/interfaces/CombatEvent";
import { WEAPONS_DB } from "../../data/WeaponsDb";

export class WeaponHUDComponent extends Rectangle {
    private _slotVisuals: Map<string, { rect: Rectangle; icon: Image }> =
        new Map();
    private _activeWeaponLabel!: TextBlock;

    private readonly _THEME = {
        SOUL_LIGHT: "#f0faff",
        INK_BLACK: "rgba(5, 5, 10, 0.8)",
        INK_BORDER: "rgba(255, 255, 255, 0.05)",
    };

    private readonly _ICON_PATH = "assets/ui/icons/weapons/";

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
        this._activeWeaponLabel.shadowBlur = 10;
        this._activeWeaponLabel.shadowColor = "white";
        this.addControl(this._activeWeaponLabel);

        // --- Utilitaire ---
        this._createCircle("Utility", 90, 0, 85);

        // --- Armes (Configuration avancée des icônes) ---
        // J'ai ajouté 'rotation' et 'zoom' pour chaque slot.
        const weaponsData = [
            {
                slot: "Dagger",
                x: 105,
                y: 30,
                rotation: Math.PI / 4, // 45° pour la dague (pointe vers le haut droite)
                zoom: 1.4, // Zoom pour qu'elle remplisse le rond
            },
            {
                slot: "Sword",
                x: 135,
                y: 100,
                rotation: -Math.PI / 6, // -30° inclinée légèrement
                zoom: 1.6, // Gros zoom car l'épée est longue
            },
            {
                slot: "GreatSword",
                x: 105,
                y: 170,
                rotation: -Math.PI / 6, // -90° (Horizontale)
                zoom: 1.5, // Énorme zoom pour ne voir que la garde et le début de lame
            },
        ];

        weaponsData.forEach((data) => {
            // On passe la rotation et le zoom à la fonction de création
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
        rotation: number = 0, // Valeurs par défaut
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

        // Empêche l'icône de déborder du rond quand on zoom
        rect.clipContent = true;

        const icon = new Image(`icon_${name}`, "");

        // La taille de base de l'image dans le Rectangle (on la met à 100% du rectangle)
        icon.width = "100%";
        icon.height = "100%";

        // STRETCH_UNIFORM est crucial pour garder le ratio d'aspect
        icon.stretch = Image.STRETCH_UNIFORM;

        icon.alpha = 0.3;

        // --- APPLICATION DE L'ORIENTATION ET DU ZOOM ---
        icon.rotation = rotation; // Applique la rotation (en radians)
        icon.scaleX = zoom; // Applique le zoom horizontal
        icon.scaleY = zoom; // Applique le zoom vertical (doit être identique)

        rect.addControl(icon);

        this.addControl(rect);
        return { rect, icon };
    }

    private _initObservers(): void {
        OnWeaponChanged.add((event) => {
            const slots = event.allSlots;
            const activeWeaponId = event.weapon.data.id;
            const dbData = WEAPONS_DB[activeWeaponId];

            this._activeWeaponLabel.text = dbData
                ? `— ${dbData.name.toLowerCase()} —`
                : "";

            this._slotVisuals.forEach((visual, slotKey) => {
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
                    visual.rect.zIndex = 10;
                    visual.icon.alpha = 1.0;
                } else {
                    visual.rect.scaleX = 1.0;
                    visual.rect.scaleY = 1.0;
                    visual.rect.color = this._THEME.INK_BORDER;
                    visual.rect.background = this._THEME.INK_BLACK;
                    visual.rect.shadowBlur = 0;
                    visual.rect.zIndex = 1;
                    visual.icon.alpha = 0.3;
                }
            });
        });
    }
}
