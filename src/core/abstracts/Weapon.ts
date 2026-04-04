import { AbstractMesh, Scene } from "@babylonjs/core";
import type { WeaponData } from "../types/WeaponStats";
import { Character } from "./Character";

export abstract class Weapon {
    public mesh?: AbstractMesh;
    public readonly data: WeaponData; // Stockage centralisé des données
    public name: string;
    protected scene: Scene;

    // Getter pour un accès rapide aux stats de combat
    public get stats() {
        return this.data.stats;
    }

    constructor(scene: Scene, data: WeaponData) {
        this.scene = scene;
        this.data = data;
        this.name = data.name;
    }

    public abstract loadVisuals(): Promise<void>;

    public attachToCharacter(character: Character, boneName: string): void {
        if (!this.mesh || !character.mesh) return;

        const skeleton = character.mesh.skeleton;
        if (skeleton) {
            const boneIndex = skeleton.getBoneIndexByName(boneName);
            const bone = skeleton.bones[boneIndex];

            if (bone) {
                this.mesh.attachToBone(bone, character.mesh);
                this.mesh.position.setAll(0);
                this.mesh.rotation.setAll(0);
                this.mesh.isPickable = false;
            }
        } else {
            this.mesh.parent = character.transform;
        }
    }

    public abstract attack(owner: Character): void;
}
