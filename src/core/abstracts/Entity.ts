import { AbstractMesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";

export abstract class Entity {
    public readonly transform: TransformNode; // Source de vérité
    public mesh?: AbstractMesh; // Représentation visuelle/physique
    public readonly name: string;
    public readonly id: string;
    public readonly _scene: Scene;
    public assetPath: string = "";

    constructor(name: string, scene: Scene, id?: string) {
        this.id = id || crypto.randomUUID();
        this.name = name;
        this._scene = scene;

        // On donne l'UUID au TransformNode au lieu du nom générique
        this.transform = new TransformNode(this.id, scene);
        this.transform.name = `${name}_root`; // On garde le nom lisible pour l'inspecteur
    }

    /** Position logique (utilisée par l'IA et les calculs) */
    public get position(): Vector3 {
        return this.transform.position;
    }

    public update(_dt: number): void {}

    public dispose(): void {
        this.mesh?.dispose();
        this.transform.dispose();
    }

    public getScene(): Scene {
        return this._scene;
    }
}
