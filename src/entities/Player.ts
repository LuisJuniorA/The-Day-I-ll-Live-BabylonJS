import { Scene, Vector3, MeshBuilder, UniversalCamera, Ray } from "@babylonjs/core";
import { Character } from "../core/abstracts/Character";
import { FSM } from "../core/engines/FSM";
import { InputHandler } from "../core/engines/InputHandler";
import { PlayerMoveState } from "../states/PlayerMoveState";
import { InputBufferManager } from "../managers/InputBufferManager";
import { OnInteractionAvailable, type Interactable } from "../core/interfaces/Interactable";

export class Player extends Character {
    private readonly _camera: UniversalCamera;
    public readonly input: InputHandler;
    public readonly movementFSM: FSM<Player>;
    public readonly attackFSM: FSM<Player>;
    private _targetInteractable: Interactable | null = null;

    // Physique partagée avec les états
    public velocity: Vector3 = Vector3.Zero();
    public isGrounded: boolean = false;

    // Tes paramètres originaux
    public readonly speed: number = 0.2;
    public readonly gravity: number = -0.015;
    public readonly jumpForce: number = 0.35;

    // --- Paramètres Coyote & Buffer ---
    public readonly buffer: InputBufferManager = new InputBufferManager();
    public coyoteTimeCounter: number = 0;
    private readonly coyoteTimeDuration: number = 0.2;

    public jumpBufferCounter: number = 0;
    public readonly jumpBufferDuration: number = 0.2; // 200ms

    constructor(scene: Scene, startPosition: Vector3) {
        // Initialisation Character (Nom, Scene, Stats)
        super("Player", scene, { hp: 100, maxHp: 100, speed: 0.2, level: 1 });

        // Interaction Observer
        OnInteractionAvailable.add((event) => {
            if (event.isNear) {
                this._targetInteractable = event.interactable;
            } else {
                // On ne reset que si c'était bien cet objet qui était enregistré
                if (this._targetInteractable === event.interactable) {
                    this._targetInteractable = null;
                }
            }
        });

        // 1. Corps (Capsule)
        this.mesh = MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, scene);
        this.mesh.position = startPosition;
        this.mesh.checkCollisions = true;
        this.mesh.ellipsoid = new Vector3(0.45, 0.9, 0.45);

        this.transform.dispose();
        this.transform = this.mesh;

        // 2. Caméra
        this._camera = new UniversalCamera("playerCamera", new Vector3(startPosition.x, startPosition.y, -15), scene);
        this._camera.setTarget(new Vector3(startPosition.x, startPosition.y, 0));

        // 3. Moteurs
        this.input = new InputHandler(scene);
        this.movementFSM = new FSM<Player>(this);
        this.attackFSM = new FSM<Player>(this);

        // 4. État initial
        this.movementFSM.transitionTo(new PlayerMoveState());

        this._scene.activeCamera = this._camera;
    }

    public update(dt: number): void {
        if (this.isDead) return;

        // Met à jour les inputs
        this.input.update();
        this.buffer.update(dt); // On fait défiler tous les buffers

        if (this.input.isJumping) this.buffer.trigger("jump");
        if (this.input.isAttacking) this.buffer.trigger("attack");
        if (this.input.isInteracting && this._targetInteractable) {
            this._targetInteractable.onInteract();

            // Optionnel : on reset l'input pour éviter les répétitions si pas de buffer
            this.input.isInteracting = false;
        }
        //if (this.input.isDashing) this.buffer.trigger("dash");

        // --- Gestion Coyote Time ---
        this.checkGrounded(); // On vérifie le sol avant pour timer le coyote
        this.coyoteTimeCounter = this.isGrounded ? this.coyoteTimeDuration : this.coyoteTimeCounter - dt;

        // Met à jour la FSM (c'est elle qui appelle la logique de mouvement)
        this.movementFSM.update(dt);

        // Met à jour la caméra
        this._updateCamera();

        // Sécurité Side-scroller (Plan Z constant)
        this.mesh!.position.z = 0;
        this.velocity.z = 0;
    }

    private _updateCamera(): void {
        const targetPos = new Vector3(this.mesh!.position.x, this.mesh!.position.y + 2, -15);
        this._camera.position = Vector3.Lerp(this._camera.position, targetPos, 0.1);
        this._camera.setTarget(new Vector3(this.mesh!.position.x, this.mesh!.position.y + 2, 0));
    }

    public checkGrounded(): void {
        const rayOrigin = this.mesh!.position.clone();
        rayOrigin.y -= 0.9;
        const ray = new Ray(rayOrigin, new Vector3(0, -1, 0), 0.2);
        const pick = this.mesh!.getScene().pickWithRay(ray, (m) => m.checkCollisions && m !== this.mesh);

        this.isGrounded = (pick !== null && pick.hit);
        if (this.isGrounded && this.velocity.y < 0) this.velocity.y = 0;
    }

    public get position(): Vector3 {
        return this.mesh ? this.mesh.position : Vector3.Zero();
    }
}