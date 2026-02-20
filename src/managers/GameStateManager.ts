import { GameState } from "../core/types/GameState";
import type { GameStateType } from "../core/types/GameState";

export class GameStateManager {
    private _currentState: GameStateType = GameState.MENU;

    public get state(): GameStateType {
        return this._currentState;
    }

    public setPlaying(): void {
        this._currentState = GameState.PLAYING;
        console.log("[GAME STATE] Playing...");
    }

    public togglePause(): void {
        if (this._currentState === GameState.PLAYING) {
            this._currentState = GameState.PAUSED;
            console.log("[GAME STATE] Paused.");
        } else if (this._currentState === GameState.PAUSED) {
            this._currentState = GameState.PLAYING;
            console.log("[GAME STATE] Resumed.");
        }
    }

    public isPlaying(): boolean {
        return this._currentState === GameState.PLAYING;
    }

    public setGameOver(): void {
        this._currentState = GameState.GAME_OVER;
        console.log("[GAME STATE] Game Over !");
    }
}