import { Scene, KeyboardEventTypes } from "@babylonjs/core";

export class InputHandler {
    // On utilise un Set pour stocker les touches pressées (plus rapide qu'un objet/record)
    private _keys: Set<string> = new Set();

    // Valeurs lissées pour le mouvement
    public horizontal: number = 0;
    public vertical: number = 0;

    // Actions "One-shot" ou continues
    public isJumping: boolean = false;
    public isAttacking: boolean = false;

    constructor(scene: Scene) {
        // L'observable de Babylon est plus performant que window.addEventListener
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
     * Doit être appelé à chaque frame (dans le update du Player)
     */
    public update(): void {
        // --- Calcul du mouvement horizontal (X) ---
        // Droite (D ou flèche droite) - Gauche (Q ou flèche gauche)
        const right = (this._keys.has("d") || this._keys.has("arrowright")) ? 1 : 0;
        const left = (this._keys.has("q") || this._keys.has("arrowleft")) ? 1 : 0;
        this.horizontal = right - left;

        // --- Calcul du mouvement vertical (Y) ---
        // Uniquement si tu en as besoin pour grimper ou voler, sinon sert pour ZQSD
        const up = (this._keys.has("z") || this._keys.has("arrowup")) ? 1 : 0;
        const down = (this._keys.has("s") || this._keys.has("arrowdown")) ? 1 : 0;
        this.vertical = up - down;

        // --- Saut ---
        this.isJumping = this._keys.has(" "); // Barre espace

        // --- Attaque (E, F ou Clic Gauche plus tard) ---
        this.isAttacking = this._keys.has("f") || this._keys.has("e");
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