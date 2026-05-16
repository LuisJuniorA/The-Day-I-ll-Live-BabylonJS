import { Vector3 } from "@babylonjs/core";

export class CheckpointManager {
    private static _instance: CheckpointManager | null = null;
    private _respawnPosition: Vector3 | null = null;

    private constructor() {
        // Constructeur privé pour empêcher l'instanciation directe
    }

    /**
     * Récupère l'instance unique du gestionnaire
     */
    public static getInstance(): CheckpointManager {
        if (!CheckpointManager._instance) {
            CheckpointManager._instance = new CheckpointManager();
        }
        return CheckpointManager._instance;
    }

    /**
     * Définit la nouvelle position de respawn
     */
    public setRespawnPosition(position: Vector3): void {
        if (!this._respawnPosition) {
            this._respawnPosition = position.clone();
        } else {
            this._respawnPosition.copyFrom(position);
        }

        console.log(
            `%c [CHECKPOINT] Nouvelle position enregistrée : ${this._respawnPosition.toString()}`,
            "color: #00d2d3; font-weight: bold;",
        );
    }

    /**
     * Récupère la position actuelle de respawn
     */
    public getPosition(): Vector3 | null {
        return this._respawnPosition;
    }

    /**
     * Réinitialise le manager (utile pour les changements de niveau)
     */
    public reset(): void {
        this._respawnPosition = null;
    }
}
