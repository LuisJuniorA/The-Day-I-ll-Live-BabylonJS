import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    Color3
} from "@babylonjs/core";

// Indispensable pour lire les fichiers .glb / .gltf
import "@babylonjs/loaders/glTF";

import { Player } from "./entities/Player";
import { LevelManager } from "./managers/LevelManager";
import { WorldZones } from "./scenes/WorldData";

export class App {
    private readonly engine: Engine;
    private readonly scene: Scene;
    private readonly canvas: HTMLCanvasElement;
    private readonly player: Player;
    private readonly levelManager: LevelManager;

    constructor() {
        // 1. Setup du moteur et du canvas
        this.canvas = this.createCanvas();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);

        // 2. Configuration physique globale
        this.scene.collisionsEnabled = true;
        this.scene.gravity = new Vector3(0, -9.81, 0);

        // 3. Initialisation des gestionnaires
        this.player = new Player(this.scene, new Vector3(0, 2, 0));
        this.levelManager = new LevelManager(this.scene);

        // 4. Lumière de secours (au cas où ton .glb n'en a pas)
        this.createDefaultLight();

        // 5. Outils de développement
        this.setupInspectorToggle();

        // 6. Chargement du monde
        this.initWorld();

        // 7. Boucle de rendu
        this.engine.runRenderLoop(() => {
            this.player.update();

            // Streaming : On affiche les zones à 50 unités du joueur
            this.levelManager.update(this.player.position, 50);

            this.scene.render();
        });

        window.addEventListener("resize", () => this.engine.resize());
    }

    /**
     * Charge les assets via le LevelManager
     */
    private async initWorld(): Promise<void> {
        try {
            await this.levelManager.loadWorld(WorldZones);
            console.log("Monde chargé avec succès !");
        } catch (error) {
            console.error("Erreur lors du chargement initial :", error);
        }
    }

    /**
     * Crée le canvas HTML dans le DOM
     */
    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.id = "gameCanvas";
        canvas.style.width = "100vw";
        canvas.style.height = "100vh";
        canvas.style.display = "block";
        canvas.style.outline = "none";
        document.body.appendChild(canvas);
        return canvas;
    }

    /**
     * Lumière ambiante basique pour éviter le noir total
     */
    private createDefaultLight(): void {
        const light = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.5;
        light.groundColor = new Color3(0.1, 0.1, 0.1);
    }

    /**
     * CTRL + ALT + SHIFT + I pour ouvrir l'inspecteur Babylon
     */
    private setupInspectorToggle(): void {
        if (import.meta.env.DEV) {
            import("@babylonjs/core/Debug/debugLayer");
            import("@babylonjs/inspector");

            window.addEventListener("keydown", (ev) => {
                if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === "I") {
                    if (this.scene.debugLayer.isVisible()) {
                        this.scene.debugLayer.hide();
                    } else {
                        this.scene.debugLayer.show();
                    }
                }
            });
        }
    }
}