import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    Color3,
    UniversalCamera,
    MeshBuilder,
    StandardMaterial,
} from "@babylonjs/core";

import "@babylonjs/loaders/glTF";

import { Player } from "./entities/Player";
import { LevelManager } from "./managers/LevelManager";
import { EntityManager } from "./managers/EntityManager";
import { WorldZones } from "./scenes/WorldData";
import { GameStateManager } from "./managers/GameStateManager";
import { UIManager } from "./managers/UIManager";
import { GameState } from "./core/types/GameState";
import { CollisionLayers } from "./core/constants/CollisionLayers";
import { EntityFactory } from "./factories/EntityFactory";

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
        EntityFactory.setScene(this.scene);

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
        try {
            // --- CRÉATION DU GROUND DE TEST (PLATEFORME EN HAUTEUR) ---
            const testPlatform = MeshBuilder.CreateBox(
                "ground_test",
                {
                    width: 20,
                    height: 0.5,
                    depth: 20,
                },
                this.scene,
            );

            // Positionnement à (0, 10, 0) comme demandé
            testPlatform.position.set(0, 10, 0);

            // Configuration physique et collisions
            testPlatform.checkCollisions = true;

            // Application du layer ENVIRONMENT pour que le HookScanner le détecte
            testPlatform.collisionGroup = CollisionLayers.ENVIRONMENT;

            // Petit feedback visuel (matériau gris foncé)
            const mat = new StandardMaterial("platformMat", this.scene);
            mat.diffuseColor = new Color3(0.4, 0.4, 0.4);
            testPlatform.material = mat;

            // --- SPAWN DES ENTITÉS ---
            // On spawn le slime un peu en dessous pour qu'il "voit" la plateforme au dessus
            await this.entityManager.spawn(
                "VILLAGER_BOB",
                new Vector3(0, 1, 0),
            );

            await this.entityManager.spawn("effroi", new Vector3(5, 1, 0));

            // Le Slime spawn à (0, 1, 0), juste sous la plateforme qui est à 10
            await this.entityManager.spawn("slime", new Vector3(0, 1, 0));

            console.log(
                "Spawn de test terminé. Plateforme de Hook créée à Y=10.",
            );
        } catch (e) {
            console.error("Erreur lors du spawn de test :", e);
        }
    }

    private setupInputs(): void {
        document.addEventListener("pointerlockchange", () => {
            if (
                document.pointerLockElement === null &&
                this.gameStateManager.getCurrentState() === GameState.PLAYING
            ) {
                this.gameStateManager.setPause();
            }
        });

        this.gameStateManager.onStateChangedObservable.add((state) => {
            const canvas = this.canvas;

            if (state === GameState.PLAYING) {
                canvas.requestPointerLock();
            } else {
                // On libère le curseur pour le MENU, PAUSE et DIALOGUE
                if (document.pointerLockElement === canvas) {
                    document.exitPointerLock();
                }
            }
        });

        this.uiManager.mainMenuView.onResumeObservable.add(async () => {
            if (!this.player) {
                this.spawnPlayer();

                await this.spawnTest();
            }
            this.gameStateManager.setPlaying();
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

    /**
     * Boucle de rendu principale avec gestion du temps figé
     */
    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            const dt = this.engine.getDeltaTime() / 1000;
            const currentState = this.gameStateManager.getCurrentState();

            switch (currentState) {
                case GameState.MENU:
                    this.scene.render();
                    break;

                case GameState.PLAYING:
                    this.scene.animationsEnabled = true;
                    this.entityManager.update(dt);
                    if (this.player) {
                        if (this.player.stats.hp <= 0 || this.player.isDead) {
                            this.gameStateManager.setGameOver();
                        }
                        this.levelManager.update(this.player.position, 100);
                    }
                    this.scene.render();
                    break;

                case GameState.DIALOGUE:
                    // Logique UI
                    this.uiManager.update(dt);
                    // On permet au joueur de tourner la caméra ou d'interagir
                    if (this.player) this.player.updateInput(dt);

                    // PLUS DE CHECK "isVisible" ICI.
                    // L'UIManager s'en occupe via l'observable.

                    this.scene.render();
                    break;

                case GameState.PAUSED:
                    this.scene.animationsEnabled = false;
                    this.scene.render(true);
                    break;
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
