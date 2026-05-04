import {
    MeshBuilder,
    Scene,
    StandardMaterial,
    Vector3,
    Color3,
    Mesh,
} from "@babylonjs/core";
import type { Perceivable } from "../core/interfaces/Perceivable";
import type { Item } from "../core/types/Items";
import { CollisionLayers } from "../core/constants/CollisionLayers";

export class WorldDrop implements Perceivable {
    public id: string;
    private _mesh: Mesh;
    private _scene: Scene;

    public item?: Item;
    public amount: number;
    public isXp: boolean;

    public velocity: Vector3;
    public isFollowingPlayer: boolean = false;
    public hasToBeDeleted: boolean = false;

    // On définit un rayon de collision pour le drop
    private _ellipsoid: Vector3 = new Vector3(0.15, 0.15, 0.15);

    constructor(scene: Scene, spawnPos: Vector3, amount: number, item?: Item) {
        this.id = `drop_${Math.random().toString(36).slice(2, 11)}`;
        this._scene = scene;
        this.amount = amount;
        this.item = item;
        this.isXp = item === undefined;

        this._mesh = MeshBuilder.CreateSphere(
            this.id,
            { diameter: 0.3 },
            scene,
        );
        this._mesh.position = spawnPos.clone();
        // On remonte un peu le spawn pour éviter qu'il soit coincé dans le sol à la création
        this._mesh.position.y += 0.5;

        // --- CONFIGURATION DES COLLISIONS ---
        this._mesh.checkCollisions = true;
        this._mesh.ellipsoid = this._ellipsoid;
        // CollisionMask : Définit avec quoi l'objet entre en collision (uniquement l'environnement)
        this._mesh.collisionMask = CollisionLayers.ENVIRONMENT;

        const mat = new StandardMaterial("dropMat", scene);
        mat.emissiveColor = this.isXp
            ? new Color3(0.2, 1, 0.2)
            : new Color3(1, 0.8, 0.2);
        mat.disableLighting = true;
        this._mesh.material = mat;

        this.velocity = new Vector3(
            (Math.random() - 0.5) * 4, // Un peu plus de dispersion horizontale
            5, // Un bond un peu plus haut
            (Math.random() - 0.5) * 4,
        );
    }

    public get position(): Vector3 {
        return this._mesh.position;
    }

    public getNearbyNeighbors(): any[] {
        return [];
    }

    public update(dt: number, playerPos?: Vector3): void {
        if (this.isFollowingPlayer && playerPos) {
            // En mode aspiration, on désactive souvent les collisions
            // pour que l'objet ne se bloque pas contre un mur en venant vers nous
            this._mesh.checkCollisions = false;

            this._mesh.position = Vector3.Lerp(
                this._mesh.position,
                playerPos.add(new Vector3(0, 1, 0)),
                8 * dt,
            );

            if (Vector3.DistanceSquared(this._mesh.position, playerPos) < 0.5) {
                this.hasToBeDeleted = true;
            }
        } else {
            // --- PHYSIQUE AVEC COLLISIONS ---
            // Gravité
            this.velocity.y -= 15 * dt;

            // On utilise moveWithCollisions au lieu d'ajouter à la position.
            // Cette méthode utilise l'ellipsoid du mesh pour glisser contre l'ENVIRONMENT.
            const frameMovement = this.velocity.scale(dt);
            this._mesh.moveWithCollisions(frameMovement);

            // Friction au sol : si la vélocité verticale est quasi nulle et qu'on est bas
            // On réduit la vélocité horizontale pour que l'objet s'arrête de glisser
            if (Math.abs(this.velocity.y) < 0.1) {
                this.velocity.x *= 0.9;
                this.velocity.z *= 0.9;
            }
        }
    }

    public dispose(): void {
        this._mesh.dispose();
    }
}
