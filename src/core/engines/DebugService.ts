import {
    Color3,
    Mesh,
    MeshBuilder,
    Scene,
    Vector3,
    StandardMaterial,
    LinesMesh,
    TransformNode,
} from "@babylonjs/core";

export class DebugService {
    private static _instance: DebugService;
    private _rays: Map<string, LinesMesh> = new Map();
    private _points: Map<string, Mesh> = new Map();
    private readonly _isDevMode: boolean = import.meta.env.DEV;

    // Le dossier parent dans l'explorer
    private _debugRoot: TransformNode | null = null;

    public static getInstance(): DebugService {
        if (!this._instance) this._instance = new DebugService();
        return this._instance;
    }

    /** Récupère ou crée le container de debug */
    private _getDebugRoot(scene: Scene): TransformNode | null {
        if (!this._isDevMode) return null;
        if (!this._debugRoot || this._debugRoot.getScene() !== scene) {
            this._debugRoot = new TransformNode("DEBUG_CONTAINER", scene);
        }
        return this._debugRoot;
    }

    /** Affiche ou met à jour un trait */
    public drawRay(
        id: string,
        scene: Scene,
        origin: Vector3,
        direction: Vector3,
        length: number,
        color: Color3,
    ): void {
        if (!this._isDevMode) return;
        const endpoint = origin.add(direction.normalize().scale(length));
        const points = [origin, endpoint];
        const root = this._getDebugRoot(scene);

        let line = this._rays.get(id);

        if (!line) {
            line = MeshBuilder.CreateLines(
                id,
                { points: points, updatable: true },
                scene,
            );
            line.parent = root; // On range dans le dossier
            line.color = color;
            this._rays.set(id, line);
        } else {
            line = MeshBuilder.CreateLines(id, {
                points: points,
                instance: line,
            });
            line.color = color;
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
        if (!this._isDevMode) return;
        const root = this._getDebugRoot(scene);
        let sphere = this._points.get(id);

        if (!sphere) {
            sphere = MeshBuilder.CreateSphere(id, { diameter: size }, scene);
            sphere.parent = root; // On range dans le dossier

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
        if (!this._isDevMode) return;
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

    /** Tout supprimer d'un coup */
    public clearAll(): void {
        if (!this._isDevMode) return;
        this._rays.forEach((r) => r.dispose());
        this._points.forEach((p) => {
            p.material?.dispose();
            p.dispose();
        });
        this._rays.clear();
        this._points.clear();
        this._debugRoot?.dispose();
        this._debugRoot = null;
    }
}
