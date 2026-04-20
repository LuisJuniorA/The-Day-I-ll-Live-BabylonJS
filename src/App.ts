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
import { GameStateManager } from "./managers/GameStateManager";
import { UIManager } from "./managers/UIManager";
import { WeaponManager } from "./managers/WeaponManager";
import { WorldEngine } from "./core/engines/WorldEngine"; // Ton nouveau moteur
import { GameState } from "./core/types/GameState";
import { WeaponSlot } from "./core/types/WeaponTypes";
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
    private readonly weaponManager: WeaponManager;

    // Core Engine
    private worldEngine!: WorldEngine;

    private menuCamera!: UniversalCamera;
    private player!: Player;

    constructor() {
        // 1. Initialisation de base
        this.canvas = this.createCanvas();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);
        EntityFactory.setScene(this.scene);

        this.scene.useConstantAnimationDeltaTime = true;

        // 2. Initialisation des gestionnaires
        this.gameStateManager = new GameStateManager();
        this.uiManager = new UIManager(this.scene, this.gameStateManager);
        this.entityManager = new EntityManager(this.scene);
        this.levelManager = new LevelManager(this.scene);
        this.weaponManager = new WeaponManager(this.scene);

        // 3. Configuration du Moteur du Monde (Le lien Core <-> App)
        this.setupWorldEngine();

        // 4. Physique et Monde
        this.scene.collisionsEnabled = true;
        this.scene.gravity = new Vector3(0, -9.81, 0);

        this.setupInputs();
        this.createDefaultLight();
        this.setupInspectorToggle();

        this.initMenu();
        this.startRenderLoop();
    }

    /**
     * Configure le WorldEngine avec les délégués pour piloter les managers
     * sans que le Core ne dépende d'eux.
     */
    private setupWorldEngine(): void {
        this.worldEngine = new WorldEngine({
            onRoomVisible: (room) => {
                // 1. Affichage du décor
                this.levelManager.showProceduralRoom(room);

                // 2. Spawn des ennemis
                room.enemies.forEach((spawn) => {
                    const roomPos = new Vector3(
                        room.position.x,
                        room.position.y,
                        room.position.z,
                    );
                    const spawnOffset = new Vector3(
                        spawn.position.x,
                        spawn.position.y,
                        spawn.position.z,
                    );

                    const absolutePos = roomPos.add(spawnOffset);

                    this.entityManager.spawn(spawn.type, absolutePos);
                });
            },
            onRoomHidden: (roomId) => {
                this.levelManager.hideZone(roomId);
            },
        });
    }

    private spawnPlayer(): void {
        this.player = new Player(this.scene, new Vector3(0, 5, 0));

        this.player.onDeath = () => {
            this.gameStateManager.setGameOver();
        };

        if (this.menuCamera) {
            this.menuCamera.dispose();
        }

        this.entityManager.setPlayerTarget(this.player.transform);
        this.entityManager.add(this.player);
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
            if (state === GameState.PLAYING) {
                this.canvas.requestPointerLock();
            } else if (document.pointerLockElement === this.canvas) {
                document.exitPointerLock();
            }
        });

        this.uiManager.mainMenuView.onResumeObservable.add(async () => {
            if (!this.player) {
                // Initialisation du joueur et de ses armes
                this.spawnPlayer();
                await this.setupInitialWeapons();

                // Initialisation du monde via le WorldEngine
                await this.worldEngine.init();
            }
            this.gameStateManager.setPlaying();
        });

        this.uiManager.mainMenuView.onQuitObservable.add(() => {
            window.location.reload();
        });
    }

    private async setupInitialWeapons(): Promise<void> {
        const weapons = [
            { slot: WeaponSlot.SWORD, id: "knight_sword" },
            { slot: WeaponSlot.DAGGER, id: "butcher_dagger" },
            { slot: WeaponSlot.GREATSWORD, id: "great_imperial_sword" },
        ];

        for (const w of weapons) {
            await this.weaponManager.setSlotWeapon(this.player, w.slot, w.id);
        }
    }

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
                        // Mise à jour du WorldEngine (Streaming de la map + IA)
                        this.worldEngine.update(this.player.position, 60);
                    }

                    this.scene.render();
                    break;

                case GameState.PAUSED:
                    this.scene.animationsEnabled = false;
                    this.scene.render(true);
                    break;

                case GameState.DIALOGUE:
                    this.uiManager.update(dt);
                    if (this.player) this.player.updateInput(dt);
                    this.scene.render();
                    break;
            }
        });

        window.addEventListener("resize", () => this.engine.resize());
    }

    // --- Helpers de setup ---

    private initMenu(): void {
        this.menuCamera = new UniversalCamera(
            "menuCam",
            new Vector3(0, 10, -20),
            this.scene,
        );
        this.menuCamera.setTarget(new Vector3(0, 5, 0));
        this.scene.activeCamera = this.menuCamera;
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.id = "gameCanvas";
        Object.assign(canvas.style, {
            width: "100vw",
            height: "100vh",
            display: "block",
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
