import { Engine, Scene, Vector3, HemisphericLight, Color3 } from "@babylonjs/core";
import {
    MeshBuilder,
    StandardMaterial,
    Texture,
} from "@babylonjs/core";
import { Player } from "./entities/Player";
import { LevelManager } from "./managers/LevelManager";

export class App {
    private readonly engine: Engine;
    private readonly scene: Scene;
    private readonly canvas: HTMLCanvasElement;
    private readonly player: Player;
    private readonly levelManager: LevelManager;

    // Map des positions centrales de tes zones pour le streaming
    private readonly zonePositions: Map<string, Vector3> = new Map();

    constructor() {
        this.canvas = this.createCanvas();
        this.engine = new Engine(this.canvas, true);
        this.scene = new Scene(this.engine);

        // Configuration essentielle pour un Metroidvania
        this.scene.collisionsEnabled = true;
        this.scene.gravity = new Vector3(0, -9.81, 0);

        // Initialisation des systèmes
        this.player = new Player(this.scene, new Vector3(0, 2, 0));
        this.levelManager = new LevelManager(this.scene);

        this.createLight();
        this.createGround();
        this.setupInspectorToggle();

        // Initialisation du monde
        this.initWorld();

        // Boucle de rendu
        this.engine.runRenderLoop(() => {
            // Mise à jour du joueur (mouvements)
            this.player.update();

            // Mise à jour du streaming des niveaux (chargement/déchargement)
            // On vérifie les zones dans un rayon de 50 unités autour du joueur
            this.levelManager.update(this.player.position, 50, this.zonePositions);

            this.scene.render();
        });

        window.addEventListener("resize", () => this.engine.resize());
    }

    private async initWorld(): Promise<void> {
        // Exemple : On définit les coordonnées de deux zones
        this.zonePositions.set("zone_depart", new Vector3(0, 0, 0));
        this.zonePositions.set("zone_caverne", new Vector3(60, 0, 0));

        // On lance le chargement (sans attendre pour ne pas bloquer le thread principal)
        // Les assets doivent être dans ton dossier public
        await Promise.all([
            this.levelManager.loadZone("zone_depart", "/assets/levels/start.glb", new Vector3(0, 0, 0)),
            this.levelManager.loadZone("zone_caverne", "/assets/levels/cave.glb", new Vector3(60, 0, 0))
        ]);
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.id = "gameCanvas";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block"; // Évite les scrollbars inutiles
        document.body.appendChild(canvas);
        return canvas;
    }

    private createLight(): void {
        const light = new HemisphericLight("light1", new Vector3(1, 1, 0), this.scene);
        light.intensity = 0.7;
        light.groundColor = new Color3(0.2, 0.2, 0.2);
    }

    private createGround(): void {
        // Création d'un grand plan pour le sol
        const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this.scene);
        ground.checkCollisions = true; // Important pour que le Player ne passe pas au travers

        // Création d'un matériau avec un motif de grille (sans assets externes)
        const groundMaterial = new StandardMaterial("groundMat", this.scene);

        // On utilise une texture procédurale simple pour créer un damier
        // On peut aussi utiliser une DynamicTexture pour dessiner une grille en JS
        const dynamicTexture = new Texture("https://assets.babylonjs.com/textures/checkerboard.png", this.scene);
        dynamicTexture.uScale = 20; // Répétition du motif sur l'axe U
        dynamicTexture.vScale = 20; // Répétition du motif sur l'axe V

        groundMaterial.diffuseTexture = dynamicTexture;
        groundMaterial.specularColor = new Color3(0, 0, 0); // Pas de reflets brillants

        ground.material = groundMaterial;
    }

    private setupInspectorToggle(): void {
        if (import.meta.env.DEV) {
            // Import dynamique pour le tree-shaking en prod
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