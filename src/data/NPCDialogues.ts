export interface DialogueData {
    name: string;
    texts: string[];
    portrait?: string; // Optionnel : chemin vers une image
}

export const NPC_DATA: Record<string, DialogueData> = {
    "VILLAGER_BOB": {
        name: "Bob le Bricoleur",
        texts: [
            "Salut ! Beau temps pour construire, non ?",
            "Fais attention aux monstres la nuit.",
            "Si tu as besoin d'une pelle, repasse demain."
        ]
    },
    "VILLAGER_ANNA": {
        name: "Anna l'Herboriste",
        texts: [
            "Mes potions sont les meilleures du royaume !",
            "Les fleurs de ce jardin ont des propriétés magiques."
        ]
    }
};