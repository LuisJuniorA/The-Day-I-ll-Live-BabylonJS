import type { Scene, Vector3 } from "@babylonjs/core";
import { Hitbox } from "../utils/Hitbox";

export class PoolManager {
    private static _instance: PoolManager;
    private _hitboxes: Hitbox[] = [];
    private _scene: Scene;

    constructor(scene: Scene, initialSize: number = 10) {
        this._scene = scene;
        for (let i = 0; i < initialSize; i++) {
            this._hitboxes.push(new Hitbox(scene));
        }
        PoolManager._instance = this;
    }

    public static getInstance(): PoolManager {
        return this._instance;
    }

    /** Récupère une hitbox disponible ou en crée une nouvelle si besoin */
    public spawn(
        pos: Vector3,
        size: Vector3,
        duration: number,
        onTick: (h: Hitbox) => void,
    ): Hitbox {
        let hitbox = this._hitboxes.find((h) => !h.isActive);

        if (!hitbox) {
            console.log(
                "Pool plein ! Création d'une nouvelle hitbox. Taille actuelle:",
                this._hitboxes.length + 1,
            );
            hitbox = new Hitbox(this._scene);
            this._hitboxes.push(hitbox);
        } else {
            console.log("Recyclage d'une hitbox existante.");
        }

        hitbox.activate(pos, size, duration, onTick);
        return hitbox;
    }

    public update(dt: number) {
        this._hitboxes.forEach((h) => h.update(dt));
    }
}
