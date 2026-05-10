import { Scene, KeyboardEventTypes } from "@babylonjs/core";
import { InputConfig, type PlayerAction } from "../constants/InputConfig";

export class InputHandler {
    private _keys: Set<string> = new Set();
    private _lastKeys: Set<string> = new Set();

    public horizontal: number = 0;
    public vertical: number = 0;

    public isJumping: boolean = false;
    public isAttacking: boolean = false;
    public isInteracting: boolean = false;
    public isSwitchingWeapon: boolean = false;
    public isCasting: boolean = false;
    public isInventoryPressed: boolean = false;

    constructor(scene: Scene) {
        InputConfig.load();

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
        // Mouvement
        const right = this._check("right");
        const left = this._check("left");
        this.horizontal = (right ? 1 : 0) - (left ? 1 : 0);

        const up = this._check("up");
        const down = this._check("down");
        this.vertical = (up ? 1 : 0) - (down ? 1 : 0);

        // Actions (Impulsions)
        this.isJumping = this._isJustPressed("jump");
        this.isAttacking = this._isJustPressed("attack");
        this.isInteracting = this._isJustPressed("interact");
        this.isSwitchingWeapon = this._isJustPressed("switch");
        this.isCasting = this._isJustPressed("cast");

        // Nouvelle action : Inventaire
        this.isInventoryPressed = this._isJustPressed("inventory");

        // Sauvegarde de l'état précédent
        this._lastKeys = new Set(this._keys);
    }
}
