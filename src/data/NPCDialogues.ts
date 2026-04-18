export interface NPCConfig {
    name: string;
    texts: string[];
    assetPath: string; // Le chemin vers le .glb
    portrait?: string;
}

export const NPC_DATA: Record<string, NPCConfig> = {
    VILLAGER_BOB: {
        name: "Bob le Bricoleur",
        assetPath: "assets/models/characters/npcs/villager.glb",
        texts: [
            "Salut ! Beau temps pour construire, non ?",
            "Fais attention aux monstres la nuit.",
            "Si tu as besoin d'une pelle, repasse demain.",
        ],
    },
    VILLAGER_ANNA: {
        name: "Anna l'Herboriste",
        assetPath: "assets/models/characters/npcs/villager_female.glb",
        texts: [
            "Mes potions sont les meilleures du royaume !",
            "Les fleurs de ce jardin ont des propriétés magiques.",
        ],
    },
};
