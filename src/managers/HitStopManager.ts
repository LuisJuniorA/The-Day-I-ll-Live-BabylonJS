import { Scene } from "@babylonjs/core";
import {
    OnDamageConfirmed,
    OnEntityDamaged,
} from "../core/interfaces/CombatEvent";
import { Faction } from "../core/types/Faction";
import { AudioManager } from "./AudioManager"; // Import de ton manager

export class HitStopManager {
    private _scene: Scene;
    private _isFrozen: boolean = false;
    private _stopTimer: number = 0;

    constructor(scene: Scene) {
        this._scene = scene;

        // 1. Quand une entité est touchée (Le joueur frappe quelqu'un)
        OnEntityDamaged.add((event) => {
            if (event.hitStopDuration && event.hitStopDuration > 0) {
                if (event.attackerFaction === Faction.PLAYER) {
                    // --- SON D'IMPACT (Le joueur touche un ennemi) ---
                    // On le joue ici car le hitstop confirme l'impact physique
                    setTimeout(() => {
                        AudioManager.getInstance().playSfx("HIT");
                    }, 20);

                    this.trigger(event.hitStopDuration);
                }
            }
        });

        // 2. Quand le DOMMAGE est confirmé sur le JOUEUR (Le joueur prend un coup)
        OnDamageConfirmed.add((event) => {
            if (event.targetId === "Player") {
                // --- SON DE DOULEUR / IMPACT LOURD ---
                // Un son différent pour quand le joueur est la victime
                setTimeout(() => {
                    AudioManager.getInstance().playSfx("HIT");
                }, 20);

                this.trigger(0.15);
            }
        });
    }

    public trigger(duration: number): void {
        if (this._isFrozen || duration <= 0) return;

        this._isFrozen = true;
        this._stopTimer = duration;

        // On coupe les animations pour le feeling "poids"
        this._scene.animationsEnabled = false;

        // OPTIONNEL : Petite astuce de Sound Design
        // On pourrait baisser légèrement la vitesse du moteur audio (pitch global)
        // ou mettre un filtre passe-bas pendant le hitstop si ton AudioManager le permet.
    }

    public update(dt: number): void {
        if (!this._isFrozen) {
            // Sécurité : on s'assure que les anims sont actives
            if (!this._scene.animationsEnabled)
                this._scene.animationsEnabled = true;
            return;
        }

        this._stopTimer -= dt;

        if (this._stopTimer <= 0) {
            this._isFrozen = false;
            this._scene.animationsEnabled = true;
        }
    }
}
