import { Vector3 } from "@babylonjs/core";
import { RoomType } from "../types/RoomType";
import type { RoomData, EnemySpawnData } from "../interfaces/RoomData";
import { ENEMY_REGISTRY } from "../../data/EnemyRegistry";

export class MapGenerator {
    private static readonly ROOM_WIDTH = 40;

    public static GenerateMetroidvaniaPlan(): RoomData[] {
        const getTypeName = (val: RoomType) => {
            return Object.keys(RoomType).find(
                (key) => (RoomType as any)[key] === val,
            );
        };

        const sequence: RoomType[] = [
            RoomType.START,
            RoomType.PATH,
            RoomType.POWERUP,
            RoomType.PATH,
            RoomType.VILLAGE,
            RoomType.PATH,
            RoomType.POWERUP,
            RoomType.BOSS,
        ];

        return sequence.map((type, i) => {
            return {
                id: `room_${i}_${getTypeName(type)}`,
                type,
                position: new Vector3(i * this.ROOM_WIDTH, 0, 0),
                size: new Vector3(this.ROOM_WIDTH, 20, 10),
                enemies: this._generateEnemiesForRoom(type),
            };
        });
    }

    private static _generateEnemiesForRoom(type: RoomType): EnemySpawnData[] {
        const spawns: EnemySpawnData[] = [];
        if (type === RoomType.PATH) {
            const enemyKeys = Object.keys(ENEMY_REGISTRY);
            const randomType =
                enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
            spawns.push({
                type: randomType,
                position: new Vector3((Math.random() - 0.5) * 10, 0, 0),
            });
        }
        return spawns;
    }
}
