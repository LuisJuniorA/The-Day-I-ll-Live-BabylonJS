import {
    Color4,
    ParticleSystem,
    Texture,
    Vector3,
    AbstractMesh,
    NoiseProceduralTexture,
    Scene,
} from "@babylonjs/core";
import { OnEntityDamaged } from "../core/interfaces/CombatEvent";
import type { Spell } from "../core/interfaces/Spell";
import type { Player } from "../entities/Player";
import { PoolManager } from "../managers/PoolManager";

export class FireNovaSpell implements Spell {
    public readonly manaCost = 0;
    public readonly name = "Fire Nova";
    public readonly cooldown = 3.0;
    public readonly castDuration = 0.2;
    public lastCast = 0;

    public execute(owner: Player): void {
        const spawnPos = owner.transform.position.clone();
        const pool = PoolManager.getInstance();

        // On définit la taille de la boîte (6x6x1 pour ton side-scroller)
        const size = new Vector3(6, 6, 1);

        // Variables pour gérer le tick de dégâts
        let lastTickTime = 0;
        const tickRate = 0.1;

        pool.spawn(spawnPos, size, 2.0, (hitbox) => {
            // Cette fonction tourne à chaque frame (onBeforeRender) via le PoolManager
            const dt = owner._scene.getEngine().getDeltaTime() / 1000;
            lastTickTime += dt;

            if (lastTickTime >= tickRate) {
                this._checkCollisions(hitbox.mesh, owner);
                lastTickTime = 0;
            }
        });

        this._createFireEffect(spawnPos, owner._scene);
    }

    private _checkCollisions(hitbox: AbstractMesh, owner: Player): void {
        const container =
            owner._scene.getTransformNodeByName("ENTITIES_CONTAINER");
        if (!container) return;

        hitbox.computeWorldMatrix(true);
        const entities = container.getChildren().slice();

        entities.forEach((entityNode) => {
            if (entityNode === owner.transform) return;
            const targetMesh = entityNode.getChildMeshes()[0] as AbstractMesh;

            // Utilise intersectsMesh ou un simple test de distance X/Y si tu veux optimiser
            if (targetMesh && hitbox.intersectsMesh(targetMesh, false)) {
                OnEntityDamaged.notifyObservers({
                    targetId: entityNode.id,
                    attackerId: owner.id,
                    amount: 10,
                    position: hitbox.position.clone(),
                    attackerFaction: owner.faction,
                });
            }
        });
    }

    private _createFireEffect(position: Vector3, scene: Scene): void {
        // 1. Noise Texture (Optionnel mais recommandé pour le côté organique)
        const noiseTexture = new NoiseProceduralTexture("perlin", 256, scene);
        noiseTexture.animationSpeedFactor = 3;
        noiseTexture.persistence = 1.5;

        const ps = new ParticleSystem("fire_nova_fx", 400, scene);
        ps.particleTexture = new Texture("public/textures/flare.png", scene);
        ps.emitter = position.clone();

        // 2. LA CORRECTION : Utilisation de createSphereEmitter
        // Le premier paramètre est le rayon de la sphère d'où partent les particules
        // Le deuxième paramètre (0) fait que les particules partent du centre vers l'extérieur
        ps.createSphereEmitter(0.5, 0);

        // 3. DIRECTIONS (Contraintes en 2D pour ton side-scroller)
        // On définit la plage de direction : de "Bas-Gauche" à "Haut-Droite"
        // Le Z à 0 est CRUCIAL pour rester sur le plan de jeu
        ps.direction1 = new Vector3(-1, -1, 0);
        ps.direction2 = new Vector3(1, 1, 0);

        // 4. EMISSION (Mode Explosion)
        ps.manualEmitCount = 300;
        ps.minLifeTime = 0.5;
        ps.maxLifeTime = 1.2;
        ps.disposeOnStop = true;
        ps.blendMode = ParticleSystem.BLENDMODE_ADD;

        // 5. GRADIENTS (Couleur et Taille pour le réalisme)
        ps.addColorGradient(0.0, new Color4(1, 1, 1, 1)); // Blanc chaud au coeur
        ps.addColorGradient(0.2, new Color4(1, 0.8, 0, 1)); // Jaune
        ps.addColorGradient(1.0, new Color4(0.5, 0, 0, 0)); // Rouge sombre transparent

        ps.addSizeGradient(0.0, 0.2);
        ps.addSizeGradient(0.5, 1.5);
        ps.addSizeGradient(1.0, 0.0);

        // 6. VELOCITY (L'inertie de l'explosion)
        ps.minEmitPower = 5;
        ps.maxEmitPower = 10;
        ps.addVelocityGradient(0, 1.0); // Départ rapide
        ps.addVelocityGradient(1.0, 0.1); // Freinage de fin

        // 7. BRUIT (Ondulation des flammes)
        ps.noiseTexture = noiseTexture;
        ps.noiseStrength = new Vector3(2, 2, 0); // Déformation uniquement en X/Y

        ps.start();
    }
}
