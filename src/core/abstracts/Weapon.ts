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
        const boneIndex = skeleton ? skeleton.getBoneIndexByName(boneName) : -1;

        if (skeleton && boneIndex !== -1) {
            const bone = skeleton.bones[boneIndex];

            // Attacher à l'os
            this.mesh.attachToBone(bone, character.mesh);

            // 1. Reset position sur l'os
            this.mesh.position.setAll(0);

            // 2. Correction de l'orientation (Le "Plat" de la lame)
            // La plupart des GLB Blender -> Babylon ont besoin d'un pivot de 90°
            // On tourne sur Y pour que le tranchant regarde devant
            this.mesh.rotation.set(Math.PI / 2, Math.PI / 2, 0);

            // 3. Forcer la mise à jour pour éviter que l'arme reste à (0,0,0) au premier frame
            this.mesh.computeWorldMatrix(true);

            this.mesh.isPickable = false;
        } else {
            // Fallback si pas de squelette (ton collider de test)
            this.mesh.parent = character.transform;
            this.mesh.position.set(0.6, 0.2, 0); // Positionné "à la main"
        }
    }

    public abstract attack(owner: Character): void;
}
