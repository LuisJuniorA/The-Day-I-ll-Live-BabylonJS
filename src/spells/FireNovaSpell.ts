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

    // Cache statique pour éviter les lags de création d'objets GPU
    private static _sharedTexture: Texture | null = null;
    private static _sharedNoise: NoiseProceduralTexture | null = null;

    public execute(owner: Player): void {
        const spawnPos = owner.transform.position.clone();

        // 1. On lance le visuel IMMÉDIATEMENT pour éviter la sensation de lag
        this._createFireEffect(spawnPos, owner._scene);

        // 2. On gère la logique de collision (plus lourde) après
        const pool = PoolManager.getInstance();
        const size = new Vector3(6, 6, 1);

        let lastTickTime = 0;
        const tickRate = 0.1;

        pool.spawn(spawnPos, size, 2.0, (hitbox) => {
            const dt = owner._scene.getEngine().getDeltaTime() / 1000;
            lastTickTime += dt;

            if (lastTickTime >= tickRate) {
                this._checkCollisions(hitbox.mesh, owner);
                lastTickTime = 0;
            }
        });
    }

    private _checkCollisions(hitbox: AbstractMesh, owner: Player): void {
        const container =
            owner._scene.getTransformNodeByName("ENTITIES_CONTAINER");
        if (!container) return;

        hitbox.computeWorldMatrix(true);
        const entities = container.getChildren();

        entities.forEach((entityNode) => {
            if (entityNode === owner.transform) return;
            const targetMesh = entityNode.getChildMeshes()[0] as AbstractMesh;

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
        // Gestion de la texture de flare (partagée)
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

        // Gestion du bruit procedural (partagé pour éviter le lag de génération de shader)
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
        ps.noiseTexture = FireNovaSpell._sharedNoise; // Réutilisation du bruit statique

        ps.emitter = position.clone();
        ps.createSphereEmitter(0.5, 0);

        ps.direction1 = new Vector3(-1, -1, 0);
        ps.direction2 = new Vector3(1, 1, 0);

        ps.manualEmitCount = 300;
        ps.minLifeTime = 0.5;
        ps.maxLifeTime = 1.2;

        ps.disposeOnStop = true;
        ps.blendMode = ParticleSystem.BLENDMODE_ADD;

        // Gradients de couleurs
        ps.addColorGradient(0.0, new Color4(1, 1, 1, 1));
        ps.addColorGradient(0.2, new Color4(1, 0.8, 0, 1));
        ps.addColorGradient(1.0, new Color4(0.5, 0, 0, 0));

        // Gradients de taille
        ps.addSizeGradient(0.0, 0.2);
        ps.addSizeGradient(0.5, 1.5);
        ps.addSizeGradient(1.0, 0.0);

        // Puissance d'émission
        ps.minEmitPower = 5;
        ps.maxEmitPower = 10;
        ps.addVelocityGradient(0, 1.0);
        ps.addVelocityGradient(1.0, 0.1);

        // Paramètres de bruit
        ps.noiseStrength = new Vector3(2, 2, 0);

        // Lancement (On ne fait plus de reset() ici pour gagner en performance)
        ps.start();
    }
}
