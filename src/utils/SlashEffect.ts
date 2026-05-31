import {
    Scene,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    Mesh,
} from "@babylonjs/core";

export class SlashEffect {
    public mesh: Mesh;

    constructor(scene: Scene) {
        // Au lieu de CreatePlane, on crée une forme plus complexe.
        // Ici, on utilise un disque dont on ne dessine qu'une partie ou on le déforme.
        // Alternative simple : un disque "écrasé" sur un axe.
        this.mesh = MeshBuilder.CreateDisc(
            "slash",
            {
                radius: 0.5,
                tessellation: 3, // Plus il est élevé, plus l'arrondi est propre
                sideOrientation: Mesh.DOUBLESIDE,
            },
            scene,
        );

        this.mesh.isVisible = false;
        this.mesh.isPickable = false;

        const mat = new StandardMaterial("slashMat", scene);
        mat.emissiveColor = new Color3(0.8, 0.9, 1);
        mat.alpha = 0.6; // Un peu plus opaque pour voir la forme
        this.mesh.material = mat;
    }

    public play(position: Vector3, direction: Vector3, scaling: Vector3) {
        this.mesh.position.copyFrom(position);
        this.mesh.lookAt(position.add(direction));

        // On ajuste le scaling pour créer l'effet d'ovale/étirement
        this.mesh.scaling.set(scaling.x, scaling.y, 1);

        this.mesh.isVisible = true;

        setTimeout(() => {
            if (this.mesh) this.mesh.isVisible = false;
        }, 100);
    }
}
