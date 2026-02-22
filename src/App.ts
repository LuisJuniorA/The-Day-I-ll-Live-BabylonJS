import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    Color3
} from "@babylonjs/core";

import "@babylonjs/loaders/glTF";

import { Player } from "./entities/Player";
import { LevelManager } from "./managers/LevelManager";
import { EntityManager } from "./managers/EntityManager";
import { WorldZones } from "./scenes/WorldData";
import { GameStateManager } from "./managers/GameStateManager";
import { GameState } from "./core/types/GameState";

export class App {
    private readonly engine: Engine;
    private readonly scene: Scene;
    private readonly canvas: HTMLCanvasElement;
    private readonly levelManager: LevelManager;
    private readonly entityManager: EntityManager;
    private readonly gameStateManager: GameStateManager

    // On garde une référence typée pour les besoins spécifiques (Caméra, Position)
    private player: Player;

    constructor() {
        // 1. Setup du moteur et du canvas
        this.canvas = this.createCanvas();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);

        // 2. Configuration physique globale
        this.scene.collisionsEnabled = true;
        this.scene.gravity = new Vector3(0, -9.81, 0);

        // 3. Initialisation des gestionnaires
        this.entityManager = new EntityManager(); // Initialisation du manager
        this.levelManager = new LevelManager(this.scene);
        this.gameStateManager = new GameStateManager();

        // 4. Création du Player et enregistrement dans le manager
        this.player = new Player(this.scene, new Vector3(0, 5, 0));
        this.player.onDeath = () => {
            this.gameStateManager.setGameOver();
        };
        this.entityManager.add(this.player); // Le manager gère maintenant son cycle de vie

        // 5. Setup environnement
        this.createDefaultLight();
        this.setupInspectorToggle();

        // 6. Chargement du monde
        this.initWorld();

        // 7. Boucle de rendu
        this.startRenderLoop();
    }

    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            const deltaTime = this.engine.getDeltaTime() / 1000;

            // --- MISE À JOUR LOGIQUE ---

            // Le manager met à jour TOUTES les entités (Player, Ennemis, etc.)
            // Cela inclut la FSM, la physique et les inputs du joueur
            if (this.gameStateManager.isPlaying()) {

                this.entityManager.update(deltaTime);

                if (this.player) {
                    // VERIFICATION DE LA MORT
                    if (this.player.stats.hp <= 0 || this.player.isDead) {
                        this.gameStateManager.setGameOver();
                    }

                    this.levelManager.update(this.player.position, 100);
                }
            }
            else if (this.gameStateManager.state === GameState.GAME_OVER) {
                // Optionnel: On peut faire tourner la caméra ou ralentir le temps
            }

            // --- RENDU ---
            this.scene.render();
        });

        window.addEventListener("resize", () => this.engine.resize());
    }

    private async initWorld(): Promise<void> {
        try {
            await this.levelManager.loadWorld(WorldZones);
            console.log("Monde chargé avec succès !");
        } catch (error) {
            console.error("Erreur lors du chargement initial :", error);
        }
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.id = "gameCanvas";
        Object.assign(canvas.style, {
            width: "100vw",
            height: "100vh",
            display: "block",
            outline: "none",
            position: "fixed",
            top: "0",
            left: "0"
        });
        document.body.appendChild(canvas);
        return canvas;
    }

    private createDefaultLight(): void {
        const light = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
        light.groundColor = new Color3(0.2, 0.2, 0.2);
    }

    private setupInspectorToggle(): void {
        // @ts-ignore import.meta.env.DEV viens de vite
        if (import.meta.env.DEV) {
            import("@babylonjs/core/Debug/debugLayer");
            import("@babylonjs/inspector");
            window.addEventListener("keydown", (ev) => {
                if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === "I") {
                    this.scene.debugLayer.isVisible() ? this.scene.debugLayer.hide() : this.scene.debugLayer.show();
                }
            });
        }
    }
}