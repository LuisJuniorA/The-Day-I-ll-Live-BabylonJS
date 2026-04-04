import { Scene } from "@babylonjs/core";
import { Weapon } from "../core/abstracts/Weapon";
import { Character } from "../core/abstracts/Character";
import { OnEntityDamaged } from "../core/interfaces/CombatEvent";
import type { WeaponData } from "../core/types/WeaponStats";

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
                position: target.transform.position.clone(),
                attackerFaction: owner.faction,
            });
        }
    }

    protected abstract playAttackAnimation(owner: Character): void;

    private findTargetsInHitbox(_owner: Character): Character[] {
        // Ici viendra ta logique (Raycast, Distance, ou Trigger volume)
        return [];
    }
}
