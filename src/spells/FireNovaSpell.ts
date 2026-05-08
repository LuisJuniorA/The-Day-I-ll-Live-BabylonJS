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

    // Cache pour les ressources lourdes
    private static _sharedTexture: Texture | null = null;

    public execute(owner: Player): void {
        const spawnPos = owner.transform.position.clone();
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

        this._createFireEffect(spawnPos, owner._scene);
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
        // --- LA CORRECTION EST ICI ---
        // On vérifie si la texture est absente OU si elle a été "disposed" (le check .isDisposed() est le plus sûr)
        if (
            !FireNovaSpell._sharedTexture ||
            !FireNovaSpell._sharedTexture.getInternalTexture()
        ) {
            FireNovaSpell._sharedTexture = new Texture(
                "/textures/flare.png",
                scene,
                true,
                false,
                Texture.LINEAR_LINEAR,
            );
        }

        // Le NoiseProceduralTexture est recréé à chaque fois car il dépend du timing système
        const noiseTexture = new NoiseProceduralTexture(
            "perlin_nova",
            256,
            scene,
        );
        noiseTexture.animationSpeedFactor = 3;
        noiseTexture.persistence = 1.5;

        const ps = new ParticleSystem("fire_nova_fx", 400, scene);
        ps.particleTexture = FireNovaSpell._sharedTexture;

        ps.emitter = position.clone();
        ps.createSphereEmitter(0.5, 0);

        ps.direction1 = new Vector3(-1, -1, 0);
        ps.direction2 = new Vector3(1, 1, 0);

        ps.manualEmitCount = 300;
        ps.minLifeTime = 0.5;
        ps.maxLifeTime = 1.2;

        ps.disposeOnStop = true;
        ps.blendMode = ParticleSystem.BLENDMODE_ADD;

        // Gradients
        ps.addColorGradient(0.0, new Color4(1, 1, 1, 1));
        ps.addColorGradient(0.2, new Color4(1, 0.8, 0, 1));
        ps.addColorGradient(1.0, new Color4(0.5, 0, 0, 0));

        ps.addSizeGradient(0.0, 0.2);
        ps.addSizeGradient(0.5, 1.5);
        ps.addSizeGradient(1.0, 0.0);

        ps.minEmitPower = 5;
        ps.maxEmitPower = 10;
        ps.addVelocityGradient(0, 1.0);
        ps.addVelocityGradient(1.0, 0.1);

        ps.noiseTexture = noiseTexture;
        ps.noiseStrength = new Vector3(2, 2, 0);

        ps.reset();
        ps.start();
    }
}
