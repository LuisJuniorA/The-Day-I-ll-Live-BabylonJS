import {
    Scene,
    Vector3,
    MeshBuilder,
    UniversalCamera,
    Ray,
} from "@babylonjs/core";
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
import { OnEntityDamaged } from "../core/interfaces/CombatEvent";
import { Faction } from "../core/types/Faction";

export class Player extends Character {
    private readonly _camera: UniversalCamera;
    public readonly input: InputHandler;
    public readonly movementFSM: FSM<Player>;
    public readonly attackFSM: FSM<Player>;
    private _targetInteractable: Interactable | null = null;

    // --- Paramètres de mouvement (Ajustés pour le calcul par seconde) ---
    public readonly speed: number = 12;
    public readonly gravity: number = -0.9;
    public readonly jumpForce: number = 21;

    // --- Coyote & Buffer ---
    public readonly buffer: InputBufferManager = new InputBufferManager();
    public coyoteTimeCounter: number = 0;
    private readonly coyoteTimeDuration: number = 0.2;

    constructor(scene: Scene, startPosition: Vector3) {
        // 1. Initialisation Character (Le transform de Entity est créé ici)
        super(
            "Player",
            scene,
            { hp: 100, maxHp: 100, speed: 12, damage: 10 },
            Faction.PLAYER,
        );

        // 2. Positionnement du pivot logique (TransformNode)
        this.transform.position.copyFrom(startPosition);

        // 3. Corps physique (ENFANT du transform)
        this.mesh = MeshBuilder.CreateCapsule(
            "player_collider",
            { height: 2, radius: 0.5 },
            scene,
        );
        this.mesh.parent = this.transform;
        this.mesh.position.setAll(0); // Centré sur le pivot
        this.mesh.checkCollisions = true;
        this.mesh.collisionMask = CollisionLayers.ENVIRONMENT;
        this.mesh.collisionGroup = CollisionLayers.PLAYER;
        this.mesh.ellipsoid = new Vector3(0.45, 0.9, 0.45);
        this.mesh.isVisible = true; // Mets à false quand tu as ton vrai modèle

        // 4. Caméra (Détachée pour le Lerp fluide)
        this._camera = new UniversalCamera(
            "playerCamera",
            new Vector3(startPosition.x, startPosition.y, -15),
            scene,
        );
        this._scene.activeCamera = this._camera;

        // 5. Systèmes
        this.input = new InputHandler(scene);
        this.movementFSM = new FSM<Player>(this);
        this.attackFSM = new FSM<Player>(this);

        // 6. Interaction Observer
        OnInteractionAvailable.add((event) => {
            if (event.isNear) {
                this._targetInteractable = event.interactable;
            } else if (this._targetInteractable === event.interactable) {
                this._targetInteractable = null;
            }
        });
        OnEntityDamaged.add((event) => {
            this.takeDamage(event.amount);
        });

        this.movementFSM.transitionTo(new PlayerMoveState());
    }

    public updateInput(dt: number) {
        this.input.update();
        this.buffer.update(dt);

        // Enregistrement des intentions dans le buffer
        if (this.input.isJumping) this.buffer.trigger("jump");
        if (this.input.isAttacking) this.buffer.trigger("attack");

        // Interaction immédiate
        if (this.input.isInteracting && this._targetInteractable) {
            this._targetInteractable.onInteract();
            this.input.isInteracting = false;
        }
    }

    public update(dt: number): void {
        if (this.isDead) return;
        this.updateInput(dt);
        // Mise à jour des moteurs

        // Physique et Sol
        this.checkGrounded();
        this.coyoteTimeCounter = this.isGrounded
            ? this.coyoteTimeDuration
            : this.coyoteTimeCounter - dt;

        // La FSM appellera owner.move(owner.velocity, dt)
        this.movementFSM.update(dt);

        // Rendu Caméra et Sécurité Z
        this._updateCamera();
        this.transform.position.z = 0;
        this.velocity.z = 0;
    }

    private _updateCamera(): void {
        // On suit le TRANSFORM (pivot logique), pas le mesh
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

    public getCamera(): UniversalCamera {
        return this._camera;
    }
}
