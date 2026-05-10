export const GameState = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3,
    DIALOGUE: 4,
    SHOP: 5,
    FORGE: 6,
    INVENTORY: 7,
} as const;

export type GameStateType = (typeof GameState)[keyof typeof GameState];
