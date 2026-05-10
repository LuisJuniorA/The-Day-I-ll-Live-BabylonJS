import { Vector3 } from "@babylonjs/core";
import type { ZoneConfig } from "../core/interfaces/ZoneConfig";

export const WorldZones: ZoneConfig[] = [
    {
        id: "zone_depart",
        path: "./assets/scenes/start.glb",
        position: new Vector3(0, 0, 0),
    },
];
