import { AbstractMesh, Scene, TransformNode } from "@babylonjs/core";
import { FSM } from "../engines/FSM";

export abstract class Entity {
    // Le pivot ou le mesh principal dans la scène
    public transform: TransformNode;
    public mesh?: AbstractMesh;
    public name: string;

    // On met <any> ici car Entity ne sait pas encore quel type de FSM elle aura
    public fsm?: FSM<any>;

    constructor(name: string, scene: Scene) {
        this.name = name;
        // Un TransformNode est plus léger qu'un Mesh si on veut juste une position
        this.transform = new TransformNode(name, scene);
    }

    /**
     * Appelé à chaque frame par le LevelManager ou l'App
     * @param dt DeltaTime en secondes
     */
    public update(dt: number): void {
        this.fsm?.update(dt);
    }

    /**
     * Nettoyage propre pour éviter les fuites de mémoire Babylon
     */
    public dispose(): void {
        this.mesh?.dispose();
        this.transform.dispose();
    }
}