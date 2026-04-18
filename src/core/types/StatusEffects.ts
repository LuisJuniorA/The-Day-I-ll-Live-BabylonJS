export const StatusType = {
    NONE: "NONE",
    STUN: "STUN",
    FREEZE: "FREEZE",
    BURN: "BURN",
} as const;

export type StatusType = (typeof StatusType)[keyof typeof StatusType];

export const PlayerReactionAnim = {
    IDLE: "idle",
    HIT: "hit_react",
    COWER: "cower",
    SHOCK: "shock",
} as const;

export type PlayerReactionAnim =
    (typeof PlayerReactionAnim)[keyof typeof PlayerReactionAnim];
