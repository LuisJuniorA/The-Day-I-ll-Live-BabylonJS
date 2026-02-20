import { AbstractMesh, Scene } from "@babylonjs/core";
import type { WeaponStats } from "../types/WeaponStats";
import { Character } from "./Character";

export abstract class Weapon {
    public mesh?: AbstractMesh;
    public stats: WeaponStats;
    public name: string;
    protected scene: Scene;

    constructor(
        name: string,
        stats: WeaponStats,
        scene: Scene
    ) {
        this.name = name
        this.scene = scene;
        this.stats = { ...stats };
    }

    /**
     * Charge le modèle 3D (ou le clone depuis un manager)
     */
    public abstract loadVisuals(): Promise<void>;

    /**
     * Attache l'arme à un os (ex: "RightHand") du squelette d'un personnage
     */
    public attachToCharacter(character: Character, boneName: string): void {
        if (!this.mesh || !character.mesh) return;

        const skeleton = character.mesh.skeleton;
        if (skeleton) {
            const boneIndex = skeleton.getBoneIndexByName(boneName);
            const bone = skeleton.bones[boneIndex];

            if (bone) {
                this.mesh.attachToBone(bone, character.mesh);
                // On reset la position locale pour qu'elle s'aligne sur la main
                this.mesh.position.setAll(0);
                this.mesh.rotation.setAll(0);
            }
        }
    }

    /**
     * Logique de l'attaque (à override pour chaque arme)
     */
    public abstract attack(owner: Character): void;
}