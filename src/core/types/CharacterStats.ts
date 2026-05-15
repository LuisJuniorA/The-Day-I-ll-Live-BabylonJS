export type CharacterStats = {
    hp: number;
    maxHp: number; // Lié à Vitality
    speed: number; // Lié à Dexterity
    damage: number; // Lié à Strength
    strength?: number;
    vitality?: number;
    dexterity?: number;
    agility?: number;
    intelligence?: number;
};
