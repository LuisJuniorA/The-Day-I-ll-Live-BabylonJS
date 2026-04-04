import { AnimationGroup, Ray, Scene, Vector3 } from "@babylonjs/core";
import { Entity } from "./Entity";
import type { CharacterStats } from "../types/CharacterStats";
import { OnEntityDamaged } from "../interfaces/CombatEvent";
import type { FactionType } from "../types/Faction";

export abstract class Character extends Entity {
    public stats: CharacterStats;
    public velocity: Vector3 = Vector3.Zero();
    public isDead: boolean = false;
    public isGrounded: boolean = false;
    public animations: Map<string, AnimationGroup> = new Map();
    public faction: FactionType;

    private _isPriorityAnimActive: boolean = false;

    public onDeath?: () => void;

    constructor(
        name: string,
        scene: Scene,
        stats: CharacterStats,
        faction: FactionType,
    ) {
        super(name, scene);
        this.stats = { ...stats };
        this.faction = faction;

        OnEntityDamaged.add((event) => {
            if (event.targetId !== this.id) return;
            if (event.attackerFaction === this.faction) return;
            this.takeDamage(event.amount);
        });
    }

    public takeDamage(amount: number): void {
        if (this.isDead) return;
        this.stats.hp -= amount;
        if (this.stats.hp <= 0) this.die();
    }

    public checkGrounded(): void {
        // Raycast à partir du pivot logique
        const rayOrigin = this.transform.position.clone();
        rayOrigin.y -= 0.9;
        const ray = new Ray(rayOrigin, new Vector3(0, -1, 0), 0.3); // Rayon légèrement plus long (0.3)

        const pick = this._scene.pickWithRay(ray, (m) => {
            // CONDITION : Le mesh doit avoir les collisions ET faire partie de l'environnement (Mask 1)
            return m.checkCollisions && m.collisionGroup === 1;
        });

        this.isGrounded = !!(pick && pick.hit);
        if (this.isGrounded && this.velocity.y < 0) {
            this.velocity.y = 0;
        }
    }

    protected die(): void {
        if (this.isDead) return;
        this.isDead = true;
        this.stats.hp = 0;
        this.velocity.setAll(0);
        if (this.onDeath) this.onDeath();
    }

    public move(velocity: Vector3, dt: number): void {
        if (this.isDead || !this.mesh) return;

        const finalVelocity = velocity.clone();

        if (this.isGrounded && finalVelocity.y < 0) {
            finalVelocity.y = -0.01;
        }

        const springStrength = 2.0;
        finalVelocity.z += -this.transform.position.z * springStrength;

        const frameMove = finalVelocity.scale(dt);
        this.mesh.moveWithCollisions(frameMove);

        this.transform.position.addInPlace(this.mesh.position);
        this.mesh.position.setAll(0);

        const zLimit = 1.0;
        if (this.transform.position.z > zLimit)
            this.transform.position.z = zLimit;
        if (this.transform.position.z < -zLimit)
            this.transform.position.z = -zLimit;

        this._handleSpriteFlip();
    }

    private _handleSpriteFlip(): void {
        if (!this.mesh) return;
        if (this.velocity.x > 0.1) {
            this.transform.rotation.y = 0;
        } else if (this.velocity.x < -0.1) {
            this.transform.rotation.y = Math.PI;
        }
    }

    public playAnim(
        name: string,
        loop: boolean = true,
        isPriority: boolean = false,
    ): void {
        if (this._isPriorityAnimActive && loop) return;

        const search = name.toLowerCase();
        const entry = Array.from(this.animations.entries()).find(([key]) =>
            key.toLowerCase().includes(search),
        );

        if (!entry) return;

        const targetAnim = entry[1];

        if (targetAnim.isPlaying && loop) return;

        // --- LOGIQUE DE TRANSITION ---
        this.animations.forEach((a) => {
            if (a !== targetAnim && a.isPlaying) {
                a.stop();
            }
        });

        if (isPriority) {
            this._isPriorityAnimActive = true;
            targetAnim.onAnimationEndObservable.addOnce(() => {
                this._isPriorityAnimActive = false;
            });
        }

        // Lance l'animation : grâce à enableBlending = true,
        // elle va "shifter" doucement depuis la pose actuelle.
        targetAnim.play(loop);
    }
}
