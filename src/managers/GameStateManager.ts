import { Observable } from "@babylonjs/core";
import { GameState } from "../core/types/GameState";
import type { GameStateType } from "../core/types/GameState";

export class GameStateManager {
    private _currentState: GameStateType = GameState.MENU;

    // L'émetteur d'événements
    public onStateChangedObservable = new Observable<GameStateType>();

    public get state(): GameStateType {
        return this._currentState;
    }

    // Méthode interne pour changer l'état et notifier tout le monde
    private _setState(newState: GameStateType): void {
        if (this._currentState === newState) return; // On évite les updates inutiles

        this._currentState = newState;
        console.log(`[GAME STATE] Change to: ${newState}`);

        // On prévient tous les abonnés (comme l'UIManager)
        this.onStateChangedObservable.notifyObservers(this._currentState);
    }

    public setPlaying(): void {
        this._setState(GameState.PLAYING);
    }

    public setPause(): void {
        this._setState(GameState.PAUSED);
    }

    public setGameOver(): void {
        this._setState(GameState.GAME_OVER);
    }

    public isPlaying(): boolean {
        return this._currentState === GameState.PLAYING;
    }
}