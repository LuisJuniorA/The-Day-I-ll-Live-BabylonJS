import { Scene, AbstractMesh, AnimationGroup } from "@babylonjs/core";
import { Enemy } from "../core/abstracts/Enemy";
import { ProximitySystem } from "../core/engines/ProximitySystem";
import type { EnemyConfig } from "../core/types/EnemyConfig";

export class Effroi extends Enemy {
    constructor(
        scene: Scene,
        data: EnemyConfig,
        proximitySystem: ProximitySystem,
        rootMesh: AbstractMesh,
        animations: AnimationGroup[],
    ) {
        super(scene, data, proximitySystem, rootMesh);

        animations.forEach((ag) => {
            ag.stop();
            // Sécurité : nom en minuscule pour matcher playAnim()
            this.animations.set(ag.name.toLowerCase(), ag);
        });
    }
}
