import type { State } from "../interfaces/State";

export class FSM<T> {
    private _currentState: State<T> | null = null;
    private _owner: T;

    constructor(owner: T) {
        this._owner = owner;
    }

    public get currentStateName(): string {
        return this._currentState?.name ?? "None";
    }

    /**
     * Change l'état actuel pour un nouveau
     * @param newState L'instance du nouvel état
     */
    public transitionTo(newState: State<T>): void {
        // 1. On quitte l'état précédent proprement
        if (this._currentState) {
            this._currentState.onExit(this._owner);
        }

        // 2. On change de référence
        this._currentState = newState;

        // 3. On initialise le nouvel état
        this._currentState.onEnter(this._owner);
    }

    /**
     * Doit être appelé dans la boucle de rendu de Babylon (ou l'update de l'entité)
     */
    public update(dt: number): void {
        if (this._currentState) {
            this._currentState.onUpdate(this._owner, dt);
        }
    }
}