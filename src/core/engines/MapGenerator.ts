import { RoomType } from "../types/RoomType";
import type { RoomData, EnemySpawnData } from "../interfaces/RoomData";
import { ENEMY_REGISTRY } from "../../data/EnemyRegistry";

export class MapGenerator {
    private static readonly ROOM_WIDTH = 40;
    private static readonly TOWER_PROBABILITY = 0.3;

    public static GenerateMetroidvaniaPlan(): RoomData[] {
        const rooms: RoomData[] = [];
        const sequence = [
            RoomType.START,
            RoomType.PATH,
            RoomType.PATH,
            RoomType.VILLAGE,
            RoomType.PATH,
            RoomType.POWERUP,
            RoomType.PATH,
            RoomType.BOSS,
        ];

        let currentX = 0;
        let currentY = 0;

        sequence.forEach((type, i) => {
            const isTower =
                Math.random() < this.TOWER_PROBABILITY &&
                type === RoomType.PATH;
            const height = isTower ? 40 : 15;

            const room: RoomData = {
                id: `room_${i}_${type}`,
                type,
                position: { x: currentX, y: currentY, z: 0 },
                size: { x: this.ROOM_WIDTH, y: height, z: 10 },
                enemies: this._generateEnemiesForRoom(type, height),
            };

            rooms.push(room);

            // Logique de connexion : Si c'est une tour, la suite est en haut
            currentX += this.ROOM_WIDTH;
            if (isTower) {
                currentY += 15; // On monte d'un étage pour la salle suivante
            } else {
                currentY += (Math.random() - 0.5) * 4; // Variation légère
            }
        });

        return rooms;
    }

    private static _generateEnemiesForRoom(
        type: RoomType,
        roomHeight: number,
    ): EnemySpawnData[] {
        const spawns: EnemySpawnData[] = [];
        if (type !== RoomType.PATH && type !== RoomType.BOSS) return spawns;

        const enemyKeys = Object.keys(ENEMY_REGISTRY);
        const count =
            type === RoomType.BOSS ? 1 : Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < count; i++) {
            const randomId =
                enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
            spawns.push({
                type: randomId,
                position: {
                    x: (Math.random() - 0.5) * 25,
                    y: Math.random() * (roomHeight - 5), // Spawn possible sur plateformes
                    z: 0,
                },
            });
        }
        return spawns;
    }
}
