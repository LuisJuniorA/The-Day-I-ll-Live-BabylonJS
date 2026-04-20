import { Vector3 } from "@babylonjs/core";
import { RoomType } from "../types/RoomType";

export interface RoomData {
    id: string;
    type: RoomType;
    position: Vector3;
    size: Vector3;
    enemies: EnemySpawnData[];
}

export interface EnemySpawnData {
    type: string;
    position: { x: number; y: number; z: number };
}
