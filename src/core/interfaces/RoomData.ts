import { RoomType } from "../types/RoomType";

export interface IVector3 {
    x: number;
    y: number;
    z: number;
}

export interface EnemySpawnData {
    type: string;
    position: IVector3;
}

export interface RoomData {
    id: string;
    type: RoomType;
    position: IVector3;
    size: IVector3;
    enemies: EnemySpawnData[];
}
