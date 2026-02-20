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
        // On garde la gravité globale même si ton Player a sa propre constante
        this.scene.gravity = new Vector3(0, -9.81, 0);

        // 3. Initialisation des gestionnaires
        // Note: Le Player est créé avec une position de départ
        this.player = new Player(this.scene, new Vector3(0, 5, 0));
        this.levelManager = new LevelManager(this.scene);

        // 4. Lumière de secours
        this.createDefaultLight();

        // 5. Outils de développement
        this.setupInspectorToggle();

        // 6. Chargement du monde (Asynchrone)
        this.initWorld();

        // 7. Boucle de rendu
        this.engine.runRenderLoop(() => {
            // On récupère le temps écoulé entre deux frames (pour la FSM et la physique)
            // Babylon donne le temps en millisecondes, on divise souvent par 1000 pour avoir des secondes
            const deltaTime = this.engine.getDeltaTime() / 1000;

            if (this.player) {
                // MISE À JOUR DU JOUEUR (Physique, FSM, Inputs)
                this.player.update(deltaTime);

                // MISE À JOUR DU STREAMING DE NIVEAU
                // On passe la position du joueur (via le getter) et la distance de vue
                this.levelManager.update(this.player.position, 100);
            }

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
        canvas.style.position = "fixed"; // Évite les barres de scroll
        canvas.style.top = "0";
        canvas.style.left = "0";
        document.body.appendChild(canvas);
        return canvas;
    }

    private createDefaultLight(): void {
        const light = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
        light.groundColor = new Color3(0.2, 0.2, 0.2);
    }

    private setupInspectorToggle(): void {
        // @ts-ignore - meta.env est spécifique à Vite
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