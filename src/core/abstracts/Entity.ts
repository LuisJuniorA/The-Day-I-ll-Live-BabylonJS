import { AbstractMesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { FSM } from "../engines/FSM";

export abstract class Entity {
    // Le pivot ou le mesh principal dans la scène
    public transform: TransformNode;
    public mesh?: AbstractMesh;
    public name: string;
    public id: string;
    protected readonly _scene: Scene;

    // On met <any> ici car Entity ne sait pas encore quel type de FSM elle aura
    public movementFSM?: FSM<any>;

    constructor(name: string, scene: Scene) {
        this.id = crypto.randomUUID();
        this.name = name;
        this._scene = scene;
        // Un TransformNode est plus léger qu'un Mesh si on veut juste une position
        this.transform = new TransformNode(`${name}_${this.id.substring(0, 5)}`, scene);
    }

    /**
     * Appelé à chaque frame par le LevelManager ou l'App
     * @param dt DeltaTime en secondes
     */
    public update(dt: number): void {
        this.movementFSM?.update(dt);
    }

    /**
     * Nettoyage propre pour éviter les fuites de mémoire Babylon
     */
    public dispose(): void {
        this.mesh?.dispose();
        this.transform.dispose();
    }

    public get position(): Vector3 {
        return this.mesh ? this.mesh.position : Vector3.Zero();
    }
}