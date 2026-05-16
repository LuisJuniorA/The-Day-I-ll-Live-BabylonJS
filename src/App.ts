import {
    Engine,
    Scene,
    Vector3,
    UniversalCamera,
    GlowLayer,
} from "@babylonjs/core";

import "@babylonjs/loaders/glTF";

import { Player } from "./entities/Player";
import { LevelManager } from "./managers/LevelManager";
import { EntityManager } from "./managers/EntityManager";
import { GameStateManager } from "./managers/GameStateManager";
import { UIManager } from "./managers/UIManager";
import { WeaponManager } from "./managers/WeaponManager";
import { AudioManager } from "./managers/AudioManager";
import { WorldEngine } from "./core/engines/WorldEngine";
import { GameState } from "./core/types/GameState";
import { WeaponSlot } from "./core/types/WeaponTypes";
import { EntityFactory } from "./factories/EntityFactory";
import { HitStopManager } from "./managers/HitStopManager";
import { FireNovaSpell } from "./spells/FireNovaSpell";
import { PoolManager } from "./managers/PoolManager";
import { CameraManager } from "./managers/CameraManager";
import { CustomLoadingScreen } from "./core/engines/LoadingScreen";
import { CheckpointManager } from "./managers/CheckpointManager";
import { ALL_ITEMS } from "./data/ItemDb";
import "@babylonjs/core/Audio/audioSceneComponent";

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
    private readonly hitStopManager: HitStopManager;
    private readonly poolManager: PoolManager;
    private readonly audioManager: AudioManager;
    private cameraManager!: CameraManager;

    // Core Engine
    private worldEngine!: WorldEngine;

    private menuCamera!: UniversalCamera;
    private player!: Player;

    constructor() {
        // 1. Initialisation de base
        this.canvas = this.createCanvas();
        // Dans ton fichier d'initialisation (ex: App.ts)
        this.engine = new Engine(this.canvas, true, {
            deterministicLockstep: true,
        });
        this.scene = new Scene(this.engine);
        this.engine.loadingScreen = new CustomLoadingScreen();
        EntityFactory.setScene(this.scene);

        this.scene.useConstantAnimationDeltaTime = true;

        // 2. Initialisation des gestionnaires
        this.gameStateManager = new GameStateManager();
        this.audioManager = new AudioManager(this.scene);
        this.audioManager.playSfx("UI_CLICK");
        this.uiManager = new UIManager(this.scene, this.gameStateManager);
        this.entityManager = new EntityManager(this.scene);
        this.levelManager = new LevelManager(this.scene);
        this.weaponManager = new WeaponManager(this.scene);
        this.hitStopManager = new HitStopManager(this.scene);
        this.poolManager = new PoolManager(this.scene);

        this.weaponManager.dispose();

        // 3. Configuration du Moteur du Monde
        this.setupWorldEngine();

        // 4. Physique et Monde
        this.scene.collisionsEnabled = true;
        this.scene.gravity = new Vector3(0, -9.81, 0);

        this.setupInputs();
        this.createDefaultLight();
        this.setupInspectorToggle();

        this.initMenu();
        this.startRenderLoop();

        const glow = new GlowLayer("glow", this.scene);
        glow.intensity = 0.1;
    }

    private setupWorldEngine(): void {
        this.worldEngine = new WorldEngine({
            onWorldGenerated: (grid, blockSize) => {
                this.levelManager.generateProceduralWorld(
                    "proc_map",
                    grid,
                    blockSize,
                );
            },
            onLevelLoaded: (url) => {
                this.levelManager.loadMap(url);
            },
            onEnemiesReady: (enemies) => {
                enemies.forEach((spawn) => {
                    const pos = new Vector3(
                        spawn.position.x * 2,
                        spawn.position.y * 2,
                        0,
                    );
                    this.entityManager.spawn(spawn.type, pos);
                });
            },
        });
    }

    private spawnPlayer(): void {
        // Regarder d'abord si un feu de camp a été activé précédemment via le CheckpointManager
        const activeCheckpoint = CheckpointManager.getInstance().getPosition();
        let finalSpawnPos: Vector3;

        if (activeCheckpoint) {
            finalSpawnPos = activeCheckpoint.clone();
        } else {
            const startPos = this.worldEngine.getStartPosition();
            finalSpawnPos = new Vector3(startPos.x, startPos.y, 0);
        }

        this.player = new Player(this.scene, finalSpawnPos);

        this.player.onDeath = () => {
            this.gameStateManager.setGameOver();
        };

        if (this.menuCamera) {
            this.menuCamera.dispose();
        }

        this.entityManager.setPlayerTarget(this.player.transform);
        this.entityManager.add(this.player);
        this.cameraManager = new CameraManager(this.scene, this.player);

        const startPos = this.worldEngine.getStartPosition();
        const merchantPos = new Vector3(startPos.x + 1, startPos.y, 0);
        const merchantPos2 = new Vector3(startPos.x - 1, startPos.y, 0);
        const merchantPos3 = new Vector3(startPos.x - 3, startPos.y, 0);

        this.entityManager.spawn("BLACKSMITH", merchantPos);
        this.entityManager.spawn("MERCHANT_SILAS", merchantPos2);
        this.entityManager.spawn("BONFIRE_MAIN", merchantPos3);
        this.uiManager.setPlayer(this.player);

        console.log(`[App] Player spawned at: ${finalSpawnPos.toString()}`);
    }

    /**
     * Déclenché uniquement lorsque le joueur clique sur le bouton "RENAÎTRE" de l'écran de mort
     */
    public respawnPlayer(): void {
        const respawnPos = CheckpointManager.getInstance().getPosition();

        // Ajout d'un écran noir / UI de chargement durant le repositionnement
        this.engine.displayLoadingUI();

        setTimeout(() => {
            if (this.player) {
                // 1. Repositionnement sur le checkpoint ou le point de départ global
                if (respawnPos) {
                    this.player.transform.position.copyFrom(respawnPos);
                } else {
                    const startPos = this.worldEngine.getStartPosition();
                    this.player.transform.position.set(
                        startPos.x,
                        startPos.y,
                        0,
                    );
                }

                // Ajustement de hauteur pour éviter les problèmes de collision au sol
                this.player.transform.position.y += 0.5;

                // 2. Restauration complète des PV du joueur
                this.player.heal(this.player.stats.maxHp || 100);

                // 3. Réinitialisation des flags et FSM de mort du joueur
                if (typeof (this.player as any).revive === "function") {
                    (this.player as any).revive();
                } else {
                    (this.player as any).isDead = false;
                }
            }

            // 4. Remise en route du moteur de jeu et bascule du State
            this.scene.animationsEnabled = true;
            this.gameStateManager.setPlaying();
            this.engine.hideLoadingUI();

            console.log(
                "[App] Player respawned successfully via death screen choice.",
            );
        }, 1000);
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
                // Activation de l'ambiance sonore au début du jeu
                //this.audioManager.playMusic("ENVIRONMENT");
            } else if (document.pointerLockElement === this.canvas) {
                document.exitPointerLock();
            }
        });

        this.uiManager.mainMenuView.onPlayObservable.add(async () => {
            if (!this.player) {
                this.engine.displayLoadingUI();

                try {
                    // Laisser un peu de temps à l'UI pour s'afficher
                    await new Promise((r) => setTimeout(r, 50));

                    // 1. Initialiser le monde (chargement assets)
                    await this.worldEngine.init("./assets/scenes/start.glb");

                    // 2. CRUCIAL : Attendre que Babylon ait fini de traiter la scène
                    // et que tous les meshes soient prêts pour les collisions
                    await this.scene.whenReadyAsync();

                    // 3. Spawner les entités maintenant que le sol est "physique"
                    this.spawnPlayer();
                    this.entityManager.spawn("SLIME", new Vector3(0, 0, 0));

                    // 4. Armes et Spells
                    await this.setupInitialWeapons();

                    // 5. Cleanup UI et démarrage
                    this.engine.hideLoadingUI();
                    this.gameStateManager.setPlaying();
                } catch (err) {
                    console.error("Échec du chargement :", err);
                    this.engine.hideLoadingUI();
                }
            } else {
                this.gameStateManager.setPlaying();
            }
        });

        this.uiManager.mainMenuView.onQuitObservable.add(() => {
            window.location.reload();
        });

        // Écoute de l'action RENAÎTRE depuis la vue de mort (DeathScreenView)
        if (this.uiManager.deathView) {
            this.uiManager.deathView.onRetryObservable.add(() => {
                this.respawnPlayer();
            });
        }
    }

    private async setupInitialWeapons(): Promise<void> {
        const weapons = [
            { slot: WeaponSlot.SWORD, id: "knight_sword" },
            { slot: WeaponSlot.DAGGER, id: "butcher_dagger" },
            { slot: WeaponSlot.GREATSWORD, id: "great_imperial_sword" },
        ];
        this.player.learnSpell(new FireNovaSpell());

        weapons.forEach((weapon) =>
            this.player.inventory.addItem(ALL_ITEMS[weapon.id], 1),
        );
    }

    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            const dt = this.engine.getDeltaTime() / 1000;
            const currentState = this.gameStateManager.getCurrentState();
            this.uiManager.update(dt);

            switch (currentState) {
                case GameState.MENU:
                    this.scene.render();
                    break;

                case GameState.PLAYING:
                    this.hitStopManager.update(dt);
                    this.poolManager.update(dt);

                    if (this.scene.animationsEnabled) {
                        this.entityManager.update(dt);
                    }

                    if (this.player) {
                        if (this.player.stats.hp <= 0 || this.player.isDead) {
                            this.gameStateManager.setGameOver();
                        }
                        this.cameraManager.update(dt);
                    }

                    this.scene.render();
                    break;
                case GameState.GAME_OVER:
                case GameState.PAUSED:
                case GameState.SHOP:
                case GameState.FORGE:
                case GameState.INVENTORY:
                case GameState.BONFIRE:
                    this.scene.animationsEnabled = false;
                    this.scene.render();
                    break;

                case GameState.DIALOGUE:
                    if (this.player) this.player.updateInput(dt);
                    this.scene.render();
                    break;
            }
        });

        window.addEventListener("resize", () => this.engine.resize());
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

    private createDefaultLight(): void {}

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
