export const Faction = {
    PLAYER: "PLAYER",
    ENEMY: "ENEMY",
    NEUTRAL: "NEUTRAL",
} as const;

export type FactionType = (typeof Faction)[keyof typeof Faction];
