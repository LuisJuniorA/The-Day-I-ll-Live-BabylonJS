export const GameState = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3
} as const;

export type GameStateType = typeof GameState[keyof typeof GameState];