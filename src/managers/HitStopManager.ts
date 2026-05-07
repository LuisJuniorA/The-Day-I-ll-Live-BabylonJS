import { Scene } from "@babylonjs/core";
import {
    OnDamageConfirmed,
    OnEntityDamaged,
} from "../core/interfaces/CombatEvent";
import { Faction } from "../core/types/Faction";

export class HitStopManager {
    private _scene: Scene;
    private _isFrozen: boolean = false;
    private _stopTimer: number = 0;

    constructor(scene: Scene) {
        this._scene = scene;

        // 1. On garde l'écoute sur OnEntityDamaged pour quand le JOUEUR frappe
        // (car l'ennemi n'a peut-être pas d'i-frames, ou on veut le stop même si l'ennemi pare)
        OnEntityDamaged.add((event) => {
            // On ne trigger que si l'événement demande explicitement un hitstop
            if (event.hitStopDuration && event.hitStopDuration > 0) {
                // Optionnel: On peut quand même filtrer par faction ici
                if (
                    event.attackerFaction === Faction.PLAYER ||
                    event.targetId === "Player"
                ) {
                    this.trigger(event.hitStopDuration);
                }
            }
        });

        // 2. On écoute OnDamageConfirmed pour quand le JOUEUR subit
        OnDamageConfirmed.add((event) => {
            if (event.targetId === "Player") {
                this.trigger(0.15); // Hitstop fixe et marqué quand on est touché
            }
        });
    }

    public trigger(duration: number): void {
        if (this._isFrozen || duration <= 0) return;

        this._isFrozen = true;
        this._stopTimer = duration;
        this._scene.animationsEnabled = false;
    }

    public update(dt: number): void {
        if (!this._isFrozen) {
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
