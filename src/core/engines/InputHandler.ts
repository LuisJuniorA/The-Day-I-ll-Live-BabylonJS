import { Scene, KeyboardEventTypes } from "@babylonjs/core";

export class InputHandler {
    private _keys: Set<string> = new Set();
    private _lastKeys: Set<string> = new Set(); // <--- Nouveau : pour comparer avec la frame d'avant

    public horizontal: number = 0;
    public vertical: number = 0;

    public isJumping: boolean = false;
    public isAttacking: boolean = false;
    public isInteracting: boolean = false;

    constructor(scene: Scene) {
        scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                this._keys.add(key);
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
                this._keys.delete(key);
            }
        });
    }

    /**
     * Méthode utilitaire pour savoir si une touche vient d'être pressée
     */
    private _isJustPressed(key: string): boolean {
        return this._keys.has(key) && !this._lastKeys.has(key);
    }

    public update(): void {
        // --- Mouvements (Continus) ---
        const right = (this._keys.has("d") || this._keys.has("arrowright")) ? 1 : 0;
        const left = (this._keys.has("q") || this._keys.has("arrowleft")) ? 1 : 0;
        this.horizontal = right - left;

        // --- Actions "One-shot" (Déclenchées une seule fois) ---
        // On utilise _isJustPressed au lieu de .has()
        this.isJumping = this._isJustPressed(" ");
        this.isInteracting = this._isJustPressed("e");
        this.isAttacking = this._isJustPressed("f");

        // --- FIN DE UPDATE : On synchronise les states ---
        // On copie les touches actuelles dans lastKeys pour la prochaine frame
        this._lastKeys = new Set(this._keys);
    }

    /**
     * Utile si on veut vider les touches (ex: lors d'une pause ou d'un changement de scène)
     */
    public reset(): void {
        this._keys.clear();
        this.horizontal = 0;
        this.vertical = 0;
        this.isJumping = false;
        this.isAttacking = false;
    }
}