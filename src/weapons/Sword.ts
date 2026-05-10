import { Vector3, VertexBuffer, type Scene } from "@babylonjs/core";
import type { Character } from "../core/abstracts/Character";
import { MeleeWeapon } from "./MeleeWeapon";
import type { WeaponData } from "../core/types/WeaponStats";

export class Sword extends MeleeWeapon {
    constructor(scene: Scene, data: WeaponData) {
        super(scene, data);
    }

    public async loadVisuals(): Promise<void> {
        this.mesh!.rotation = new Vector3(0, 1, 0);
        const actualMesh = this.mesh!.getChildMeshes()[0];
        const positions = actualMesh.getVerticesData(VertexBuffer.PositionKind);
        const normals = actualMesh.getVerticesData(VertexBuffer.NormalKind);

        const thickness = 1;

        for (let i = 0; i < positions!.length; i++) {
            positions![i] += normals![i] * thickness;
        }
        this.mesh!.updateVerticesData(VertexBuffer.PositionKind, positions!);
    }

    protected playAttackAnimation(_owner: Character): void {
        console.log("Joue l'animation : Medium Swing");
    }
}
