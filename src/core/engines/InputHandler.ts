import { Scene, KeyboardEventTypes } from "@babylonjs/core";
import { InputConfig, type PlayerAction } from "../constants/InputConfig";

export class InputHandler {
    private _keys: Set<string> = new Set();
    private _lastKeys: Set<string> = new Set();

    public horizontal: number = 0;
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
        return InputConfig.current[action].some((k) => this._keys.has(k));
    }

    private _isJustPressed(action: PlayerAction): boolean {
        const keys = InputConfig.current[action];
        return keys.some((k) => this._keys.has(k) && !this._lastKeys.has(k));
    }

    public update(): void {
        const right = this._check("right") ? 1 : 0;
        const left = this._check("left") ? 1 : 0;
        this.horizontal = right - left;

        this.isJumping = this._isJustPressed("jump");
        this.isAttacking = this._isJustPressed("attack");
        this.isInteracting = this._isJustPressed("interact");
        this.isSwitchingWeapon = this._isJustPressed("switch");

        this._lastKeys = new Set(this._keys);
    }
}
