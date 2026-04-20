import type { RoomData, IVector3 } from "../interfaces/RoomData";
import { MapGenerator } from "./MapGenerator";

export interface WorldEngineDelegate {
    onRoomVisible: (room: RoomData) => void;
    onRoomHidden: (roomId: string) => void;
}

export class WorldEngine {
    private _plan: RoomData[];
    private _visibleRooms: Set<string> = new Set();
    private _delegate: WorldEngineDelegate;

    constructor(delegate: WorldEngineDelegate) {
        this._delegate = delegate;
        this._plan = MapGenerator.GenerateMetroidvaniaPlan();
    }

    public async init(): Promise<void> {
        console.log("[WorldEngine] Plan ready.");
    }

    public update(playerPos: IVector3, viewRange: number): void {
        for (const room of this._plan) {
            // Calcul de distance 2D pour supporter la verticalité
            const dx = playerPos.x - room.position.x;
            const dy = playerPos.y - room.position.y;
            const isInside =
                Math.abs(dx) < viewRange && Math.abs(dy) < viewRange;

            if (isInside && !this._visibleRooms.has(room.id)) {
                this._visibleRooms.add(room.id);
                this._delegate.onRoomVisible(room);
            } else if (!isInside && this._visibleRooms.has(room.id)) {
                this._visibleRooms.delete(room.id);
                this._delegate.onRoomHidden(room.id);
            }
        }
    }
}
