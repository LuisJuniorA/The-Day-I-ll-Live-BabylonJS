import {
    Color3,
    Mesh,
    MeshBuilder,
    Scene,
    Vector3,
    StandardMaterial,
    LinesMesh,
} from "@babylonjs/core";

export class DebugService {
    private static _instance: DebugService;
    private _rays: Map<string, LinesMesh> = new Map(); // Utilisation de LinesMesh
    private _points: Map<string, Mesh> = new Map();

    public static getInstance(): DebugService {
        if (!this._instance) this._instance = new DebugService();
        return this._instance;
    }

    /** Affiche ou met à jour un trait (anciennement Ray) */
    public drawRay(
        id: string,
        scene: Scene,
        origin: Vector3,
        direction: Vector3,
        length: number,
        color: Color3,
    ): void {
        // On calcule l'arrivée exacte selon la longueur passée
        const endpoint = origin.add(direction.normalize().scale(length));
        const points = [origin, endpoint];

        let line = this._rays.get(id);

        if (!line) {
            // Création initiale
            line = MeshBuilder.CreateLines(
                id,
                {
                    points: points,
                    updatable: true,
                },
                scene,
            );
            line.color = color;
            this._rays.set(id, line);
        } else {
            // MISE À JOUR RÉELLE DE LA GÉOMÉTRIE (Taille + Position)
            line = MeshBuilder.CreateLines(id, {
                points: points,
                instance: line,
            });
            line.color = color; // Mise à jour de la couleur (Rouge/Vert)
        }
    }

    /** Affiche ou met à jour une sphère d'impact */
    public drawPoint(
        id: string,
        scene: Scene,
        position: Vector3,
        color: Color3,
        size: number = 0.2,
    ): void {
        let sphere = this._points.get(id);
        if (!sphere) {
            sphere = MeshBuilder.CreateSphere(id, { diameter: size }, scene);
            const mat = new StandardMaterial(id + "_mat", scene);
            mat.emissiveColor = color;
            mat.disableLighting = true;
            sphere.material = mat;
            this._points.set(id, sphere);
        } else {
            const mat = sphere.material as StandardMaterial;
            if (mat) mat.emissiveColor = color;
        }
        sphere.position.copyFrom(position);
    }

    /** Nettoyage propre */
    public clear(id: string): void {
        if (this._rays.has(id)) {
            this._rays.get(id)?.dispose();
            this._rays.delete(id);
        }
        if (this._points.has(id)) {
            const sphere = this._points.get(id);
            sphere?.material?.dispose();
            sphere?.dispose();
            this._points.delete(id);
        }
    }
}
