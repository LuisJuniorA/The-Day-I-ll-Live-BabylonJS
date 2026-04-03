import { Scene, Vector3, MeshBuilder, UniversalCamera } from "@babylonjs/core";
import { Character } from "../core/abstracts/Character";
import { FSM } from "../core/engines/FSM";
import { InputHandler } from "../core/engines/InputHandler";
import { PlayerMoveState } from "../states/player/PlayerMoveState";
import { InputBufferManager } from "../managers/InputBufferManager";
import {
    OnInteractionAvailable,
    type Interactable,
} from "../core/interfaces/Interactable";
import { CollisionLayers } from "../core/constants/CollisionLayers";
import {
    OnEntityDamaged,
    OnHealthChanged,
} from "../core/interfaces/CombatEvent";
import { Faction } from "../core/types/Faction";

export class Player extends Character {
    private readonly _camera: UniversalCamera;
    public readonly input: InputHandler;
    public readonly movementFSM: FSM<Player>;
    public readonly attackFSM: FSM<Player>;
    private _targetInteractable: Interactable | null = null;

    // --- Stats & Combat ---
    private _invulnerabilityTimer: number = 0;
    private readonly I_FRAME_DURATION: number = 0.6; // Temps de repos après un coup

    // --- Paramètres de mouvement ---
    public readonly speed: number = 12;
    public readonly gravity: number = -0.9;
    public readonly jumpForce: number = 21;

    // --- Coyote & Buffer ---
    public readonly buffer: InputBufferManager = new InputBufferManager();
    public coyoteTimeCounter: number = 0;
    private readonly coyoteTimeDuration: number = 0.2;

    constructor(scene: Scene, startPosition: Vector3) {
        super(
            "Player",
            scene,
            { hp: 100, maxHp: 100, speed: 12, damage: 10 },
            Faction.PLAYER,
        );

        this.transform.position.copyFrom(startPosition);

        // Hitbox principale
        this.mesh = MeshBuilder.CreateCapsule(
            "player_collider",
            { height: 2, radius: 0.5 },
            scene,
        );
        this.mesh.parent = this.transform;
        this.mesh.position.setAll(0);
        this.mesh.checkCollisions = true;
        this.mesh.isPickable = false;
        this.mesh.collisionMask = CollisionLayers.ENVIRONMENT;
        this.mesh.collisionGroup = CollisionLayers.PLAYER;
        this.mesh.ellipsoid = new Vector3(0.45, 0.9, 0.45);

        // Caméra
        this._camera = new UniversalCamera(
            "playerCamera",
            new Vector3(startPosition.x, startPosition.y, -15),
            scene,
        );
        this._scene.activeCamera = this._camera;

        // Systèmes
        this.input = new InputHandler(scene);
        this.movementFSM = new FSM<Player>(this);
        this.attackFSM = new FSM<Player>(this);

        this._initObservers();
        this.movementFSM.transitionTo(new PlayerMoveState());
    }

    private _initObservers(): void {
        // Observer d'interaction
        OnInteractionAvailable.add((event) => {
            if (event.isNear) {
                this._targetInteractable = event.interactable;
            } else if (this._targetInteractable === event.interactable) {
                this._targetInteractable = null;
            }
        });

        // Observer de dégâts (Centralisé ici)
        OnEntityDamaged.add((event) => {
            if (event.targetId === "Player" || event.targetId === this.id) {
                this.takeDamage(event.amount);
            }
        });
    }

    /**
     * Surcharge de takeDamage pour inclure les I-Frames
     */
    public takeDamage(amount: number): void {
        if (this._invulnerabilityTimer > 0 || this.isDead) return;

        super.takeDamage(amount);

        // Active l'invulnérabilité
        this._invulnerabilityTimer = this.I_FRAME_DURATION;

        // Feedback visuel simple (clignotement alpha)
        if (this.mesh) this.mesh.visibility = 0.5;

        OnHealthChanged.notifyObservers({
            currentHp: this.stats.hp,
            maxHp: this.stats.maxHp,
            entityId: "Player",
        });
    }

    public updateInput(dt: number) {
        this.input.update();
        this.buffer.update(dt);

        if (this.input.isJumping) this.buffer.trigger("jump");
        if (this.input.isAttacking) this.buffer.trigger("attack");

        if (this.input.isInteracting && this._targetInteractable) {
            this._targetInteractable.onInteract();
            this.input.isInteracting = false;
        }
    }

    public update(dt: number): void {
        if (this.isDead) return;

        // Update du timer d'invulnérabilité
        if (this._invulnerabilityTimer > 0) {
            this._invulnerabilityTimer -= dt;
            if (this._invulnerabilityTimer <= 0 && this.mesh) {
                this.mesh.visibility = 1.0;
            }
        }

        this.updateInput(dt);
        this.checkGrounded();

        this.coyoteTimeCounter = this.isGrounded
            ? this.coyoteTimeDuration
            : this.coyoteTimeCounter - dt;

        this.movementFSM.update(dt);

        this._updateCamera();
        this.transform.position.z = 0;
        this.velocity.z = 0;
    }

    private _updateCamera(): void {
        const targetPos = new Vector3(
            this.transform.position.x,
            this.transform.position.y + 2,
            -15,
        );
        this._camera.position = Vector3.Lerp(
            this._camera.position,
            targetPos,
            0.1,
        );
        this._camera.setTarget(
            new Vector3(
                this.transform.position.x,
                this.transform.position.y + 2,
                0,
            ),
        );
    }

    public getCamera(): UniversalCamera {
        return this._camera;
    }
}
