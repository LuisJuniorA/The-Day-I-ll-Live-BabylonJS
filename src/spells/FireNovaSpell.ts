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

    // Configuration des bonus par point de stat
    private readonly DAMAGE_BONUS_PER_INT = 0.05; // +5% de dégâts
    private readonly RANGE_BONUS_PER_INT = 0.01; // +1% de taille de zone
    private readonly BASE_DAMAGE = 10;
    private readonly BASE_SIZE = 6;

    // Cache statique pour éviter les lags de création d'objets GPU
    private static _sharedTexture: Texture | null = null;
    private static _sharedNoise: NoiseProceduralTexture | null = null;

    public execute(owner: Player): void {
        const spawnPos = owner.transform.position.clone();

        // --- CALCUL DES BONUS D'INTELLIGENCE ---
        const intelligence = owner.stats.intelligence || 0;

        // Dégâts : Base * (1 + 0.05 * intel)
        const totalDamage =
            this.BASE_DAMAGE * (1 + intelligence * this.DAMAGE_BONUS_PER_INT);

        // Taille : On augmente la hitbox légèrement avec l'intelligence pour le feeling
        const sizeMultiplier = 1 + intelligence * this.RANGE_BONUS_PER_INT;
        const finalSize = new Vector3(
            this.BASE_SIZE * sizeMultiplier,
            this.BASE_SIZE * sizeMultiplier,
            1,
        );

        // 1. On lance le visuel (on passe le multiplicateur pour agrandir aussi les particules)
        this._createFireEffect(spawnPos, owner._scene, sizeMultiplier);

        // 2. Logique de collision
        const pool = PoolManager.getInstance();
        let lastTickTime = 0;
        const tickRate = 0.1;

        pool.spawn(spawnPos, finalSize, 2.0, (hitbox) => {
            const dt = owner._scene.getEngine().getDeltaTime() / 1000;
            lastTickTime += dt;

            if (lastTickTime >= tickRate) {
                // On passe les dégâts calculés à la détection de collision
                this._checkCollisions(hitbox.mesh, owner, totalDamage);
                lastTickTime = 0;
            }
        });
    }

    private _checkCollisions(
        hitbox: AbstractMesh,
        owner: Player,
        damage: number,
    ): void {
        const container =
            owner._scene.getTransformNodeByName("ENTITIES_CONTAINER");
        if (!container) return;

        hitbox.computeWorldMatrix(true);
        const entities = container.getChildren();

        entities.forEach((entityNode) => {
            if (entityNode === owner.transform) return;

            const meshes = entityNode.getChildMeshes();
            if (meshes.length === 0) return;

            const targetMesh = meshes[0] as AbstractMesh;

            if (targetMesh && hitbox.intersectsMesh(targetMesh, false)) {
                OnEntityDamaged.notifyObservers({
                    targetId: entityNode.id,
                    attackerId: owner.id,
                    amount: damage, // Dégâts buffés par l'intelligence
                    position: hitbox.position.clone(),
                    attackerFaction: owner.faction,
                });
            }
        });
    }

    private _createFireEffect(
        position: Vector3,
        scene: Scene,
        scale: number,
    ): void {
        // Gestion de la texture de flare
        if (
            !FireNovaSpell._sharedTexture ||
            !FireNovaSpell._sharedTexture.getInternalTexture()
        ) {
            FireNovaSpell._sharedTexture = new Texture(
                "./textures/flare.png",
                scene,
                true,
                false,
                Texture.LINEAR_LINEAR,
            );
        }

        // Gestion du bruit procedural
        if (!FireNovaSpell._sharedNoise) {
            FireNovaSpell._sharedNoise = new NoiseProceduralTexture(
                "perlin_nova_shared",
                256,
                scene,
            );
            FireNovaSpell._sharedNoise.animationSpeedFactor = 3;
            FireNovaSpell._sharedNoise.persistence = 1.5;
        }

        const ps = new ParticleSystem("fire_nova_fx", 400, scene);
        ps.particleTexture = FireNovaSpell._sharedTexture;
        ps.noiseTexture = FireNovaSpell._sharedNoise;

        ps.emitter = position.clone();
        ps.createSphereEmitter(0.5 * scale, 0);

        ps.direction1 = new Vector3(-1, -1, 0);
        ps.direction2 = new Vector3(1, 1, 0);

        ps.manualEmitCount = 300;
        ps.minLifeTime = 0.5;
        ps.maxLifeTime = 1.0;

        ps.disposeOnStop = true;
        ps.blendMode = ParticleSystem.BLENDMODE_ADD;

        // Gradients de couleurs (Feu -> Or -> Disparition)
        ps.addColorGradient(0.0, new Color4(1, 1, 1, 1));
        ps.addColorGradient(0.2, new Color4(1, 0.8, 0, 1));
        ps.addColorGradient(1.0, new Color4(0.5, 0, 0, 0));

        // Gradients de taille (On multiplie par le scale de l'intelligence)
        ps.addSizeGradient(0.0, 0.2 * scale);
        ps.addSizeGradient(0.5, 1.5 * scale);
        ps.addSizeGradient(1.0, 0.0);

        // Puissance d'émission
        ps.minEmitPower = 5 * scale;
        ps.maxEmitPower = 10 * scale;
        ps.addVelocityGradient(0, 1.0);
        ps.addVelocityGradient(1.0, 0.1);

        ps.noiseStrength = new Vector3(2, 2, 0);

        ps.start();
    }
}
