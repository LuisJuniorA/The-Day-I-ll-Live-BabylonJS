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
import { UIManager } from "./managers/UIManager";

export class App {
    private readonly engine: Engine;
    private readonly scene: Scene;
    private readonly canvas: HTMLCanvasElement;

    // Managers
    private readonly gameStateManager: GameStateManager;
    private readonly uiManager: UIManager;
    private readonly levelManager: LevelManager;
    private readonly entityManager: EntityManager;

    private player!: Player;

    constructor() {
        // 1. Initialisation de base
        this.canvas = this.createCanvas();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);

        // 2. Gestionnaires de logique (State & UI en premier)
        this.gameStateManager = new GameStateManager();
        this.uiManager = new UIManager(this.scene, this.gameStateManager);

        this.entityManager = new EntityManager();
        this.levelManager = new LevelManager(this.scene);

        // 3. Configuration du Monde et Physique
        this.scene.collisionsEnabled = true;
        this.scene.gravity = new Vector3(0, -9.81, 0);

        // 4. Initialisation du Joueur et des Entrées
        this.initPlayer();
        this.setupInputs();

        // 5. Environnement et Lancement
        this.createDefaultLight();
        this.setupInspectorToggle();
        this.initWorld();
        this.startRenderLoop();
    }

    /**
     * Initialise le joueur et ses événements
     */
    private initPlayer(): void {
        this.player = new Player(this.scene, new Vector3(0, 5, 0));

        // On lie la mort du joueur au GameState
        this.player.onDeath = () => {
            this.gameStateManager.setGameOver();
        };

        this.entityManager.add(this.player);
    }

    /**
     * Centralise la gestion des entrées clavier et des clics UI
     */
    private setupInputs(): void {
        // 1. On passe par pointerlock et non echap, car le navigateur intercepte la touche, libère la souris, mais ne propage pas forcément l'événement (et c'est chiant)
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === null) {
                this.gameStateManager.setPause();
            }
        });

        // 2. Le bouton Resume relance le jeu ET cache la souris (autorisé car c'est un clic)
        this.uiManager.mainMenuView.onResumeObservable.add(() => {
            this.gameStateManager.setPlaying();
            this.pointerLock();
        });

        this.uiManager.mainMenuView.onQuitObservable.add(() => {
            window.location.reload();
        });
    }

    private pointerLock(): void {
        const canvas = document.querySelector("canvas");

        if (this.gameStateManager.isPlaying()) {
            canvas?.requestPointerLock();
        } else {
            // Sécurité : on ne demande la sortie que si le pointeur est déjà locké
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
    }

    /**
     * Boucle de rendu principale
     */
    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            const deltaTime = this.engine.getDeltaTime() / 1000;

            // --- UPDATE LOGIQUE ---
            // On ne met à jour le monde que si on est en jeu
            if (this.gameStateManager.isPlaying()) {
                this.entityManager.update(deltaTime);

                if (this.player) {
                    // Check additionnel pour la mort (sécurité)
                    if (this.player.stats.hp <= 0 || this.player.isDead) {
                        this.gameStateManager.setGameOver();
                    }
                    this.levelManager.update(this.player.position, 100);
                }
            }

            // --- RENDU ---
            // On rend toujours la scène (pour voir le jeu en fond derrière l'UI)
            this.scene.render();
        });

        window.addEventListener("resize", () => this.engine.resize());
    }

    /**
     * Chargement asynchrone des assets du monde
     */
    private async initWorld(): Promise<void> {
        try {
            await this.levelManager.loadWorld(WorldZones);
            console.log("Monde chargé !");
        } catch (error) {
            console.error("Erreur de chargement :", error);
        }
    }

    // --- HELPERS ENVIRONNEMENT ---

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.id = "gameCanvas";
        Object.assign(canvas.style, {
            width: "100vw", height: "100vh",
            display: "block", outline: "none",
            position: "fixed", top: "0", left: "0"
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
        // @ts-ignore
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