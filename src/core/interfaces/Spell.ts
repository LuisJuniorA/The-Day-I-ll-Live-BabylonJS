import type { Player } from "../../entities/Player";

export interface Spell {
    name: string;
    manaCost: number;
    cooldown: number;
    lastCast: number;
    castDuration: number;
    execute(owner: Player): void;
}
