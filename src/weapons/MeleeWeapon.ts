import { Color3, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { Weapon } from "../core/abstracts/Weapon";
import { Character } from "../core/abstracts/Character";
import { OnEntityDamaged } from "../core/interfaces/CombatEvent";
import type { WeaponData } from "../core/types/WeaponStats";
import { DebugService } from "../core/engines/DebugService";

export abstract class MeleeWeapon extends Weapon {
    // Propriétés spécifiques à la mêlée, initialisées via les data
    public attackRange: number;
    public attackDuration: number;

    constructor(scene: Scene, data: WeaponData) {
        // Appelle le constructeur de Weapon qui stocke déjà 'data'
        super(scene, data);

        // On synchronise les propriétés locales avec les data reçues
        this.attackRange = data.stats.range;
        this.attackDuration = data.stats.attackDuration;
    }

    public attack(owner: Character): void {
        // 1. Feedback visuel/animation
        this.playAttackAnimation(owner);

        // 2. Détection des cibles
        const targets = this.findTargetsInHitbox(owner);

        // 3. Notification du système de combat
        for (const target of targets) {
            if (target.faction === owner.faction) continue;
            OnEntityDamaged.notifyObservers({
                targetId: target.id,
                attackerId: owner.id,
                // On additionne les dégâts de l'arme et le modificateur de force du personnage
                amount: this.stats.damage + (owner.stats.damage || 0),
                position: target.position.clone(),
                attackerFaction: owner.faction,
            });
        }
    }

    protected abstract playAttackAnimation(owner: Character): void;

    private findTargetsInHitbox(owner: Character): Character[] {
        const range = this.stats.range;
        const hitTargets: any[] = []; // Stocke les entités touchées pour éviter les doublons
        const debug = DebugService.getInstance();

        // 1. Récupération du container d'entités
        const container =
            this.scene.getTransformNodeByName("ENTITIES_CONTAINER");
        if (!container) {
            console.error("CombatSystem: ENTITIES_CONTAINER introuvable.");
            return [];
        }

        // 2. Calcul du positionnement de la hitbox (Devant le joueur)
        const forward = Vector3.TransformNormal(
            new Vector3(0, 0, 1),
            owner.transform.getWorldMatrix(),
        );
        const boxPos = owner.transform.position.add(forward.scale(range / 2));
        const boxRot = owner.transform.rotationQuaternion?.clone() ?? null;

        // 3. Création du volume de détection (Mesh invisible)
        const hitbox = MeshBuilder.CreateBox(
            "temp_hitbox",
            {
                width: range,
                height: 2,
                depth: range,
            },
            this.scene,
        );

        hitbox.position.copyFrom(boxPos);
        hitbox.rotationQuaternion = boxRot;
        hitbox.isVisible = false;
        hitbox.isPickable = false;
        hitbox.computeWorldMatrix(true);

        // --- VISUALISATION DEBUG ---
        debug.drawBox(
            "player_attack",
            this.scene,
            boxPos,
            { width: range, height: 2, depth: range },
            boxRot,
            Color3.Red(),
        );
        setTimeout(() => debug.clear("player_attack"), 400);

        // 4. Scan des meshes dans le container
        // On récupère TOUS les meshes enfants (les morceaux des GLB, les corps des Slimes, etc.)
        const potentialMeshes = container.getChildMeshes(false);

        for (const mesh of potentialMeshes) {
            // Ignorer le joueur et ses propres accessoires
            if (mesh === owner.mesh || mesh.isDescendantOf(owner.transform))
                continue;

            // Forcer la mise à jour des données physiques (crucial pour les Slimes et les anims GLB)
            mesh.computeWorldMatrix(true);
            mesh.refreshBoundingInfo({});

            if (hitbox.intersectsMesh(mesh, false)) {
                // --- REMONTÉE HIÉRARCHIQUE ---
                // On cherche le nœud parent qui est un enfant direct du ENTITIES_CONTAINER
                // C'est ce nœud qui représente l'ID unique de l'ennemi.
                let entityNode: any = mesh;
                while (entityNode.parent && entityNode.parent !== container) {
                    entityNode = entityNode.parent;
                }

                // Si on a trouvé un nœud et qu'on ne l'a pas déjà frappé durant cette frame
                if (
                    entityNode &&
                    entityNode !== container &&
                    !hitTargets.includes(entityNode)
                ) {
                    console.log(
                        `💥 Impact confirmé sur: ${entityNode.id} (via mesh: ${mesh.name})`,
                    );
                    hitTargets.push(entityNode);

                    // 5. Notification du système de combat
                    OnEntityDamaged.notifyObservers({
                        targetId: entityNode.id,
                        attackerId: owner.id,
                        amount: owner.stats.damage || 10,
                        position: mesh.getAbsolutePosition().clone(),
                        attackerFaction: owner.faction,
                    });

                    // --- DEBUG IMPACT ---
                    debug.drawPoint(
                        "hit_" + entityNode.id + Date.now(),
                        this.scene,
                        mesh.getAbsolutePosition(),
                        Color3.Green(),
                        0.4,
                    );
                }
            }
        }

        // 6. Nettoyage
        hitbox.dispose();

        // On retourne les instances de Character si tu en as besoin dans ton State
        return hitTargets;
    }
}
