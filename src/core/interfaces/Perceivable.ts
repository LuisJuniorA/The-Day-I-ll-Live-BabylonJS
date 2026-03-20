import type { Vector3 } from "@babylonjs/core";

export interface Perceivable {
    id: string;
    position: Vector3;
    getNearbyNeighbors(): any[];
}

export function isPerceivableEntity(entity: any): entity is Perceivable {
    return (
        entity &&
        "getNearbyNeighbors" in entity &&
        "id" in entity &&
        "position" in entity
    );
}
