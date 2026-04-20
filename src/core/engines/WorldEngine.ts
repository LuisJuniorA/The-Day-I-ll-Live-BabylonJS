// core/logic/WorldEngine.ts (ou core/engines/WorldEngine.ts)
import type { RoomData } from "../interfaces/RoomData";
import { MapGenerator } from "./MapGenerator";

export interface WorldEngineDelegate {
    onRoomVisible: (room: RoomData) => void;
    onRoomHidden: (roomId: string) => void;
}

/** * Interface simple pour accepter n'importe quel objet avec x, y, z
 * Permet de passer un Vector3 de Babylon sans importer Babylon dans le Core.
 */
export interface IVector3 {
    x: number;
    y: number;
    z: number;
}

export class WorldEngine {
    private _plan: RoomData[];
    private _visibleRooms: Set<string> = new Set();
    private _delegate: WorldEngineDelegate;

    constructor(_delegate: WorldEngineDelegate) {
        this._delegate = _delegate;
        // On génère le plan logique dès la création
        this._plan = MapGenerator.GenerateMetroidvaniaPlan();
    }

    /**
     * Méthode d'initialisation demandée par App.ts
     */
    public async init(): Promise<void> {
        console.log(
            "[WorldEngine] Plan generated with",
            this._plan.length,
            "rooms.",
        );
        // Tu pourrais ici charger des données JSON ou configurer des biomes
        return Promise.resolve();
    }

    /**
     * Mise à jour du streaming
     * @param playerPos : La position du joueur (accepte le Vector3 de Babylon)
     * @param viewRange : La distance de chargement
     */
    public update(playerPos: IVector3, viewRange: number): void {
        for (const room of this._plan) {
            // Calcul de distance sur l'axe X (standard pour Metroidvania horizontal)
            const dist = Math.abs(playerPos.x - room.position.x);
            const isInside = dist < viewRange;

            if (isInside && !this._visibleRooms.has(room.id)) {
                this._visibleRooms.add(room.id);
                this._delegate.onRoomVisible(room);
            } else if (!isInside && this._visibleRooms.has(room.id)) {
                this._visibleRooms.delete(room.id);
                this._delegate.onRoomHidden(room.id);
            }
        }
    }

    public getPlan(): RoomData[] {
        return this._plan;
    }
}
