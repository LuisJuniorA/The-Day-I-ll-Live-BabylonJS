import {
    AssetContainer,
    Vector3,
} from "@babylonjs/core";

export interface ZoneEntry {
    container: AssetContainer;
    position: Vector3; // On stocke la position ici maintenant
    isShown: boolean;
}