import { Engine, Scene, Vector3, UniversalCamera } from "@babylonjs/core";

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
import { HitStopManager } from "./managers/HitStopManager";
import { FireNovaSpell } from "./spells/FireNovaSpell";
import { PoolManager } from "./managers/PoolManager";
import { CameraManager } from "./managers/CameraManager";
import { CustomLoadingScreen } from "./core/engines/LoadingScreen";

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
    private cameraManager!: CameraManager;

    // Core Engine
    private worldEngine!: WorldEngine;

    private menuCamera!: UniversalCamera;
    private player!: Player;

    constructor() {
        // 1. Initialisation de base
        this.canvas = this.createCanvas();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);
        this.engine.loadingScreen = new CustomLoadingScreen();
        EntityFactory.setScene(this.scene);

        this.scene.useConstantAnimationDeltaTime = true;

        // 2. Initialisation des gestionnaires
        this.gameStateManager = new GameStateManager();
        this.uiManager = new UIManager(this.scene, this.gameStateManager);
        this.entityManager = new EntityManager(this.scene);
        this.levelManager = new LevelManager(this.scene);
        this.weaponManager = new WeaponManager(this.scene);
        this.hitStopManager = new HitStopManager(this.scene);
        this.poolManager = new PoolManager(this.scene);

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
        // 1. On récupère la position sécurisée
        const startPos = this.worldEngine.getStartPosition();

        // 2. On force le Z à 0 (le plan de jeu)
        // startPos est déjà un Vector3(x * blockSize, y * blockSize, 0)
        const finalSpawnPos = new Vector3(startPos.x, startPos.y, 0);

        this.player = new Player(this.scene, finalSpawnPos);

        this.player.onDeath = () => {
            this.gameStateManager.setGameOver();
        };

        if (this.menuCamera) {
            this.menuCamera.dispose();
        }

        // Important pour que l'IA sache où aller
        this.entityManager.setPlayerTarget(this.player.transform);
        this.entityManager.add(this.player);
        this.cameraManager = new CameraManager(this.scene, this.player);

        const merchantPos = new Vector3(startPos.x + 1, startPos.y, 0);
        const merchantPos2 = new Vector3(startPos.x - 1, startPos.y, 0);
        this.entityManager.spawn("BLACKSMITH", merchantPos);
        this.entityManager.spawn("MERCHANT_SILAS", merchantPos2);
        this.uiManager.setPlayer(this.player);

        console.log(`[App] Player spawned at: ${finalSpawnPos.toString()}`);
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

        this.uiManager.mainMenuView.onPlayObservable.add(async () => {
            if (!this.player) {
                // 1. Affiche l'écran de chargement
                this.engine.displayLoadingUI();
                this.engine.displayLoadingUI();

                try {
                    // Petit délai pour laisser l'UI s'afficher avant de bloquer le thread
                    await new Promise((r) => setTimeout(r, 50));

                    // 2. Initialisation du monde
                    await this.worldEngine.init("./assets/scenes/start.glb");

                    // 3. Initialisation du joueur et CameraManager
                    this.spawnPlayer();
                    this.entityManager.spawn("SLIME", new Vector3(0, 0, 0));

                    // 4. Armes
                    await this.setupInitialWeapons();

                    // 5. CRUCIAL : On attend que le GPU soit prêt (évite le lag au 1er rendu)
                    await this.scene.whenReadyAsync();

                    // 6. On cache le loading et on joue
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
    }

    private async setupInitialWeapons(): Promise<void> {
        const weapons = [
            { slot: WeaponSlot.SWORD, id: "knight_sword" },
            { slot: WeaponSlot.DAGGER, id: "butcher_dagger" },
            { slot: WeaponSlot.GREATSWORD, id: "great_imperial_sword" },
        ];
        this.player.learnSpell(new FireNovaSpell());

        for (const w of weapons) {
            await this.weaponManager.setSlotWeapon(this.player, w.slot, w.id);
        }
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
                    // Laisse le manager décider si on doit freeze ou non
                    this.hitStopManager.update(dt);
                    this.poolManager.update(dt);

                    // On ne met à jour la logique des entités QUE si on n'est pas en hitstop
                    // Sinon ils vont continuer à bouger/glisser pendant le freeze
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

                case GameState.PAUSED:
                    this.scene.animationsEnabled = false;
                    this.scene.render(true);
                    break;

                case GameState.DIALOGUE:
                    if (this.player) this.player.updateInput(dt);
                    this.scene.render();
                    break;
                case GameState.SHOP:
                    this.scene.animationsEnabled = false;
                    this.scene.render();
                    break;
                case GameState.FORGE:
                    this.scene.animationsEnabled = false;
                    this.scene.render();
                    break;
                case GameState.INVENTORY:
                    this.scene.animationsEnabled = false;
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
        // const light = new HemisphericLight(
        //     "ambientLight",
        //     new Vector3(0, 1, 0),
        //     this.scene,
        // );
        // // On baisse l'intensité à 0.2 (au lieu de 0.7)
        // // Ça permet de voir la silhouette du monstre même sans torche
        // light.intensity = 0.2;
        // light.diffuse = new Color3(0.5, 0.5, 0.8); // Teinte légèrement bleutée pour la nuit
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
