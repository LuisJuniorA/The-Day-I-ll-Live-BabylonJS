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

        // 2. Gestionnaires de logique (State & UI en premier)
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

        // On lance le test (async)
        this.spawnTest();
    }

    /**
     * Initialise le joueur et ses événements
     */
    private spawnPlayer(): void {
        // 1. Création du joueur (le constructeur gère déjà la hiérarchie interne)
        this.player = new Player(this.scene, new Vector3(0, 5, 0));

        // 2. Réintégration du callback de mort (Essentiel !)
        this.player.onDeath = () => {
            console.log("GAME OVER");
            this.gameStateManager.setGameOver();
            //this.uiManager.showGameOver();
        };

        // 3. Nettoyage caméra menu
        if (this.menuCamera) {
            this.menuCamera.dispose();
        }

        // 4. Enregistrement dans les systèmes
        // On donne le TRANSFORM (pivot) à l'EntityManager pour le calcul de distance
        this.entityManager.setPlayerTarget(this.player.transform);
        this.entityManager.add(this.player);
    }

    /**
     * Test de spawn utilisant la Factory et l'EntityManager
     */
    private async spawnTest(): Promise<void> {
        // 1. Test NPC (Interactable)
        // Note: Si tu veux un NPC spécifique via Factory, il faudra ajouter le case "npc" dans la factory
        const npc = new NPCInteractable(this.scene, new Vector3(0, 1, 0), {
            name: "Bob le Bricoleur",
            texts: [
                "Salut ! Beau temps pour construire, non ?",
                "Fais attention aux monstres la nuit.",
                "Si tu as besoin d'une pelle, repasse demain.",
            ],
        });
        this.entityManager.add(npc);

        // 2. Test Ennemi "Effroi" via la Factory (Async)
        // Cela va charger le GLB (ou le placeholder rouge si échec)
        await this.entityManager.spawn("effroi", new Vector3(0, 1, 0));
        await this.entityManager.spawn("effroi", new Vector3(0, 1, 0));

        console.log("Spawn de test terminé.");
    }

    /**
     * Centralise la gestion des entrées clavier et des clics UI
     */
    private setupInputs(): void {
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === null) {
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
     * Boucle de rendu principale
     */
    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            const deltaTime = this.engine.getDeltaTime() / 1000;

            if (this.gameStateManager.isPlaying()) {
                this.entityManager.update(deltaTime);

                if (this.player) {
                    if (this.player.stats.hp <= 0 || this.player.isDead) {
                        this.gameStateManager.setGameOver();
                    }
                    this.levelManager.update(this.player.position, 100);
                }
            }

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
