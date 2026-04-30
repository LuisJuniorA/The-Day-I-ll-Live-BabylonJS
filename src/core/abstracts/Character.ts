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
            if (event.attackerId === this.id) return;
            if (event.attackerFaction === this.faction) return;
            this.takeDamage(event.amount);
        });
    }

    public takeDamage(amount: number): void {
        if (this.isDead) return;
        this.stats.hp -= amount;
        console.log(this.stats.hp);
        if (this.stats.hp <= 0) this.die();
    }

    public checkGrounded(): void {
        const rayLength = 0.8; // On augmente un peu
        const bodyRadius = 0.25; // On réduit un peu l'écartement pour être plus précis sur les bords

        const positions = [
            new Vector3(0, 0, 0),
            new Vector3(bodyRadius, 0, 0),
            new Vector3(-bodyRadius, 0, 0),
            new Vector3(0, 0, bodyRadius),
            new Vector3(0, 0, -bodyRadius),
        ];

        let hasHit = false;
        const halfHeight = this.mesh!.ellipsoid.y;
        for (const posOffset of positions) {
            // Comme ça, le rayon "descend" vers le sol.
            const feetOffset = -(halfHeight * 0.9);

            const origin = this.transform.position
                .add(posOffset)
                .add(new Vector3(0, feetOffset, 0));

            const ray = new Ray(origin, new Vector3(0, -1, 0), rayLength);

            // Debug : décommente la ligne suivante pour voir les rayons en jeu si besoin
            // RayHelper.CreateAndShow(ray, this._scene, Color3.Red());

            const pick = this._scene.pickWithRay(ray, (m) => {
                return m.checkCollisions && m.collisionGroup === 1;
            });

            if (pick && pick.hit) {
                hasHit = true;
                break;
            }
        }

        this.isGrounded = hasHit;

        if (this.isGrounded) {
            // Si on touche le sol, on stoppe net la chute
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
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
