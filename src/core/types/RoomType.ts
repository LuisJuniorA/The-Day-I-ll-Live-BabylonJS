export const RoomType = {
    START: 0,
    PATH: 1,
    POWERUP: 2,
    VILLAGE: 3,
    BOSS: 4,
} as const;

export type RoomType = (typeof RoomType)[keyof typeof RoomType];
