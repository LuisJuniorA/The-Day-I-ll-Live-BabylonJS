import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    Color3,
    UniversalCamera,
} from "@babylonjs/core";

import "@babylonjs/loaders/glTF";

import { Player } from "./entities/Player";
import { LevelManager } from "./managers/LevelManager";
import { EntityManager } from "./managers/EntityManager";
import { WorldZones } from "./scenes/WorldData";
import { GameStateManager } from "./managers/GameStateManager";
import { UIManager } from "./managers/UIManager";
import { NPCInteractable } from "./core/abstracts/NPCInteractable";

export class App {
    private readonly engine: Engine;
    private readonly scene: Scene;
    private readonly canvas: HTMLCanvasElement;

    // Managers
    private readonly gameStateManager: GameStateManager;
    private readonly uiManager: UIManager;
    private readonly levelManager: LevelManager;
    private readonly entityManager: EntityManager;

    private menuCamera!: UniversalCamera;
    private player!: Player;

    constructor() {
        // 1. Initialisation de base
        this.canvas = this.createCanvas();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);

        // --- FIX DU SKIP D'ANIMATION ---
        // On dit à la scène de ne pas utiliser le temps système pour les animations
        // mais d'attendre qu'on lui donne manuellement le delta (via render)
        this.scene.useConstantAnimationDeltaTime = true;

        // 2. Gestionnaires de logique
        this.gameStateManager = new GameStateManager();
        this.uiManager = new UIManager(this.scene, this.gameStateManager);
        this.entityManager = new EntityManager(this.scene);
        this.levelManager = new LevelManager(this.scene);

        // 3. Configuration du Monde et Physique
        this.scene.collisionsEnabled = true;
        this.scene.gravity = new Vector3(0, -9.81, 0);

        // 4. Initialisation du Joueur et des Entrées
        this.setupInputs();

        // 5. Environnement et Lancement
        this.createDefaultLight();
        this.setupInspectorToggle();
        this.initWorld();
        this.initMenu();
        this.startRenderLoop();

        this.spawnTest();
    }

    private spawnPlayer(): void {
        this.player = new Player(this.scene, new Vector3(0, 5, 0));

        this.player.onDeath = () => {
            console.log("GAME OVER");
            this.gameStateManager.setGameOver();
        };

        if (this.menuCamera) {
            this.menuCamera.dispose();
        }

        this.entityManager.setPlayerTarget(this.player.transform);
        this.entityManager.add(this.player);
    }

    private async spawnTest(): Promise<void> {
        const npc = new NPCInteractable(this.scene, new Vector3(0, 1, 0), {
            name: "Bob le Bricoleur",
            texts: [
                "Salut ! Beau temps pour construire, non ?",
                "Fais attention aux monstres la nuit.",
                "Si tu as besoin d'une pelle, repasse demain.",
            ],
        });
        this.entityManager.add(npc);

        await this.entityManager.spawn("effroi", new Vector3(0, 1, 0));
        console.log("Spawn de test terminé.");
    }

    private setupInputs(): void {
        document.addEventListener("pointerlockchange", () => {
            if (
                document.pointerLockElement === null &&
                this.gameStateManager.isPlaying()
            ) {
                this.gameStateManager.setPause();
            }
        });

        this.uiManager.mainMenuView.onResumeObservable.add(() => {
            if (!this.player) {
                this.spawnPlayer();
            }
            this.gameStateManager.setPlaying();
            this.pointerLock();
        });

        this.uiManager.mainMenuView.onQuitObservable.add(() => {
            window.location.reload();
        });
    }

    private initMenu(): void {
        this.menuCamera = new UniversalCamera(
            "menuCam",
            new Vector3(0, 10, -20),
            this.scene,
        );
        this.menuCamera.setTarget(new Vector3(0, 5, 0));
        this.scene.activeCamera = this.menuCamera;
    }

    private pointerLock(): void {
        const canvas = document.querySelector("canvas");
        if (this.gameStateManager.isPlaying()) {
            canvas?.requestPointerLock();
        } else {
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
    }

    /**
     * Boucle de rendu principale avec gestion du temps figé
     */
    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            if (this.gameStateManager.isPlaying()) {
                // On récupère le delta réel entre deux frames
                const deltaTime = this.engine.getDeltaTime() / 1000;

                // On active les animations
                this.scene.animationsEnabled = true;

                // Update de la logique
                this.entityManager.update(deltaTime);

                if (this.player) {
                    if (this.player.stats.hp <= 0 || this.player.isDead) {
                        this.gameStateManager.setGameOver();
                    }
                    this.levelManager.update(this.player.position, 100);
                }

                // Rendu normal : Babylon utilise le delta interne pour avancer les anims
                this.scene.render();
            } else {
                // EN PAUSE :
                // On coupe les calculs d'animations
                this.scene.animationsEnabled = false;

                // render(true) dessine l'image mais SANS mettre à jour les timers.
                // Comme useConstantAnimationDeltaTime est actif, l'horloge ne bouge pas.
                this.scene.render(true);
            }
        });

        window.addEventListener("resize", () => this.engine.resize());
    }

    private async initWorld(): Promise<void> {
        try {
            await this.levelManager.loadWorld(WorldZones);
            console.log("Monde chargé !");
        } catch (error) {
            console.error("Erreur de chargement :", error);
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
            left: "0",
        });
        document.body.appendChild(canvas);
        return canvas;
    }

    private createDefaultLight(): void {
        const light = new HemisphericLight(
            "ambientLight",
            new Vector3(0, 1, 0),
            this.scene,
        );
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
                    this.scene.debugLayer.isVisible()
                        ? this.scene.debugLayer.hide()
                        : this.scene.debugLayer.show();
                }
            });
        }
    }
}
