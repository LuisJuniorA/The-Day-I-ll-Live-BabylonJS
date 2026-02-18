import { Vector3 } from "@babylonjs/core";

export interface ZoneConfig {
    id: string;
    path: string;
    position: Vector3;
}

export const WorldZones: ZoneConfig[] = [
    {
        id: "zone_depart",
        path: "assets/scenes/start.glb",
        position: new Vector3(0, 0, 0)
    },
];