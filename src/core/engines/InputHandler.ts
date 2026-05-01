import { Scene, KeyboardEventTypes } from "@babylonjs/core";
import { InputConfig, type PlayerAction } from "../constants/InputConfig";

export class InputHandler {
    private _keys: Set<string> = new Set();
    private _lastKeys: Set<string> = new Set();

    public horizontal: number = 0;
    // Ajout de la propriété manquante pour le mouvement vertical
    public vertical: number = 0;

    public isJumping: boolean = false;
    public isAttacking: boolean = false;
    public isInteracting: boolean = false;
    public isSwitchingWeapon: boolean = false;

    constructor(scene: Scene) {
        InputConfig.load(); // On charge les touches au démarrage

        scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                this._keys.add(key);
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
                this._keys.delete(key);
            }
        });
    }

    private _check(action: PlayerAction): boolean {
        // Attention : Assure-toi que "up" et "down" sont bien définis dans ton PlayerAction et InputConfig
        return (
            InputConfig.current[action]?.some((k) => this._keys.has(k)) ?? false
        );
    }

    private _isJustPressed(action: PlayerAction): boolean {
        const keys = InputConfig.current[action];
        if (!keys) return false;
        return keys.some((k) => this._keys.has(k) && !this._lastKeys.has(k));
    }

    public update(): void {
        // Calcul Horizontal (Axe X)
        const right = this._check("right" as PlayerAction) ? 1 : 0;
        const left = this._check("left" as PlayerAction) ? 1 : 0;
        this.horizontal = right - left;

        // Calcul Vertical (Axe Y) - Crucial pour le "Look Down" de la caméra
        const up = this._check("up" as PlayerAction) ? 1 : 0;
        const down = this._check("down" as PlayerAction) ? 1 : 0;
        this.vertical = up - down;

        // Actions impulsionnelles
        this.isJumping = this._isJustPressed("jump" as PlayerAction);
        this.isAttacking = this._isJustPressed("attack" as PlayerAction);
        this.isInteracting = this._isJustPressed("interact" as PlayerAction);
        this.isSwitchingWeapon = this._isJustPressed("switch" as PlayerAction);

        // Sauvegarde de l'état précédent pour le prochain frame
        this._lastKeys = new Set(this._keys);
    }
}
