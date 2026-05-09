import { AbstractMesh, Scene } from "@babylonjs/core";
import { Character } from "./Character";
import type { WeaponData } from "../types/WeaponStats";

/**
 * Classe de base abstraite pour toutes les armes du jeu.
 * Gère la logique de liaison au squelette et l'accès aux données.
 */
export abstract class Weapon {
    public mesh?: AbstractMesh;
    public readonly data: WeaponData;
    public name: string;
    protected scene: Scene;

    /**
     * Getter pour un accès rapide aux statistiques de combat (damage, range, etc.)
     */
    public get stats() {
        return this.data.stats;
    }

    /**
     * Getter pour le type d'emplacement (DAGGER, SWORD, etc.)
     */
    public get weaponSlot() {
        return this.data.weaponSlot;
    }

    constructor(scene: Scene, data: WeaponData) {
        this.scene = scene;
        this.data = data;
        // Le nom et la description sont hérités de l'interface Item via WeaponData
        this.name = data.name;
    }

    /**
     * Charge le modèle 3D et configure les matériaux.
     */
    public abstract loadVisuals(): Promise<void>;

    /**
     * Attache physiquement l'arme au squelette du personnage ou à son transform.
     * @param character Le personnage qui équipe l'arme.
     * @param boneName Le nom de l'os (ex: "Hand.R").
     */
    public attachToCharacter(character: Character, boneName: string): void {
        if (!this.mesh || !character.mesh) return;

        const skeleton = character.mesh.skeleton;
        const boneIndex = skeleton ? skeleton.getBoneIndexByName(boneName) : -1;

        if (skeleton && boneIndex !== -1) {
            const bone = skeleton.bones[boneIndex];

            // Attachement à l'os via l'API Babylon
            this.mesh.attachToBone(bone, character.mesh);

            // 1. Reset de la position locale sur l'os
            this.mesh.position.setAll(0);

            // 2. Correction de l'orientation
            // Note : Ajustement standard pour les exports Blender -> Babylon (90° sur X et Y)
            this.mesh.rotation.set(Math.PI / 2, Math.PI / 2, 0);

            // 3. Force la mise à jour de la matrice pour éviter le "glitch" de frame 0
            this.mesh.computeWorldMatrix(true);

            this.mesh.isPickable = false;
        } else {
            // Fallback : Attachement direct au transform du personnage si pas de squelette
            this.mesh.parent = character.transform;
            // Position arbitraire pour le mode test
            this.mesh.position.set(0.6, 0.2, 0);
        }
    }

    /**
     * Exécute la logique d'attaque propre à chaque type d'arme.
     */
    public abstract attack(owner: Character): void;
}
