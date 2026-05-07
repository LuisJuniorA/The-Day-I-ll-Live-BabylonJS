import { AbstractMesh, MeshBuilder, Vector3, Scene } from "@babylonjs/core";

export class Hitbox {
    public mesh: AbstractMesh;
    public isActive: boolean = false;
    private _timer: number = 0;
    private _duration: number = 0;
    private _onTick: (hitbox: Hitbox) => void = () => {};

    constructor(scene: Scene) {
        this.mesh = MeshBuilder.CreateBox("pool_hitbox", { size: 1 }, scene);
        this.mesh.isVisible = false;
        this.mesh.isPickable = false;
        this.mesh.setEnabled(false);
    }

    public activate(
        pos: Vector3,
        size: Vector3,
        duration: number,
        onTick: (h: Hitbox) => void,
    ) {
        this.mesh.position.copyFrom(pos);

        // --- AJUSTEMENT Z ---
        // On prend la taille demandée mais on force une profondeur (Z) massive.
        // On utilise 10 ou 20 pour être sûr de traverser tout le plan de jeu.
        this.mesh.scaling.set(size.x, size.y, 10.0);

        this._duration = duration;
        this._timer = 0;
        this._onTick = onTick;

        this.mesh.setEnabled(true);
        this.isActive = true;
    }

    public update(dt: number) {
        if (!this.isActive) return;

        this._timer += dt;
        this._onTick(this);

        if (this._timer >= this._duration) {
            this.deactivate();
        }
    }

    public deactivate() {
        this.mesh.setEnabled(false);
        this.isActive = false;
        this._onTick = () => {};
        this._timer = 0;
    }
}
