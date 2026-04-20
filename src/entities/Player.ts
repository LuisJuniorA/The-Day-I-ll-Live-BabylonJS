import {
    Scene,
    Vector3,
    MeshBuilder,
    UniversalCamera,
    PointLight,
    AbstractMesh,
    ParticleSystem,
    Texture,
    Color3,
    Color4,
    TransformNode,
} from "@babylonjs/core";
import { Character } from "../core/abstracts/Character";
import { FSM } from "../core/engines/FSM";
import { InputHandler } from "../core/engines/InputHandler";
import { PlayerMoveState } from "../states/player/PlayerMoveState";
import { PlayerCombatIdleState } from "../states/player/PlayerCombatIdleState";
import { InputBufferManager } from "../managers/InputBufferManager";
import {
    OnInteractionAvailable,
    type Interactable,
} from "../core/interfaces/Interactable";
import { CollisionLayers } from "../core/constants/CollisionLayers";
import {
    OnHealthChanged,
    OnRequestWeaponEquip,
    OnWeaponChanged,
} from "../core/interfaces/CombatEvent";
import { Faction } from "../core/types/Faction";
import { Weapon } from "../core/abstracts/Weapon";
import { WeaponSlot } from "../core/types/WeaponTypes";

export class Player extends Character {
    private readonly _camera: UniversalCamera;
    public readonly input: InputHandler;
    public readonly movementFSM: FSM<Player>;
    public readonly attackFSM: FSM<Player>;
    public readonly buffer: InputBufferManager = new InputBufferManager();

    private _targetInteractable: Interactable | null = null;
    public currentWeapon: Weapon | null = null;
    private _invulnerabilityTimer: number = 0;
    private readonly I_FRAME_DURATION: number = 0.6;

    private _visualPivot: AbstractMesh | null = null;
    private _soulParticles: ParticleSystem | null = null;
    private _pointLight: PointLight | null = null;
    private _weaponSocket: TransformNode | null = null; // Remplacement du Skeleton

    private _timeCounter: number = 0;
    private readonly FLOAT_AMPLITUDE: number = 0.1;
    private readonly FLOAT_SPEED: number = 2.5;

    private _currentSlots: Record<WeaponSlot, string | null> = {
        [WeaponSlot.DAGGER]: null,
        [WeaponSlot.SWORD]: null,
        [WeaponSlot.GREATSWORD]: null,
    };
    private _nextSlotIndex: number = 0;

    public readonly speed: number = 12;
    public readonly gravity: number = -0.9;
    public readonly jumpForce: number = 21;
    public coyoteTimeCounter: number = 0;
    private readonly coyoteTimeDuration: number = 0.2;

    constructor(scene: Scene, startPosition: Vector3) {
        super(
            "Player",
            scene,
            { hp: 100, maxHp: 100, speed: 12, damage: 10 },
            Faction.PLAYER,
        );

        this._initPlayer(startPosition);

        this._camera = new UniversalCamera(
            "playerCamera",
            new Vector3(0, 0, -15),
            scene,
        );
        this._scene.activeCamera = this._camera;

        this.input = new InputHandler(scene);
        this.movementFSM = new FSM<Player>(this);
        this.attackFSM = new FSM<Player>(this);

        this._initObservers();

        this.movementFSM.transitionTo(new PlayerMoveState());
        this.attackFSM.transitionTo(new PlayerCombatIdleState());
    }

    private _initPlayer(startPosition: Vector3): void {
        this.transform.position.copyFrom(startPosition);

        // 1. Collider (Seul objet pickable du joueur)
        this.mesh = MeshBuilder.CreateCapsule(
            "player_collider",
            { height: 2, radius: 0.5 },
            this._scene,
        );
        this.mesh.parent = this.transform;
        this.mesh.position.setAll(0);
        this.mesh.checkCollisions = true;
        this.mesh.isPickable = true; // Important pour être touché par les ennemis
        this.mesh.visibility = 0;
        this.mesh.collisionMask = CollisionLayers.ENVIRONMENT;
        this.mesh.collisionGroup = CollisionLayers.PLAYER;
        this.mesh.ellipsoid = new Vector3(0.45, 0.9, 0.45);

        // 2. Pivot Visuel (L'âme) - OPTIMISÉ
        this._visualPivot = MeshBuilder.CreateBox(
            "visual_pivot",
            { size: 0.1 },
            this._scene,
        );
        this._visualPivot.parent = this.mesh;
        this._visualPivot.position.y = 0.5;
        this._visualPivot.isVisible = false;
        this._visualPivot.isPickable = false; // Ne pas gêner les raycasts

        // 3. Système d'Âme - OPTIMISÉ (Réduction du rate si besoin)
        const ps = new ParticleSystem("soulParticles", 300, this._scene);
        this._soulParticles = ps;
        ps.particleTexture = new Texture(
            "https://www.babylonjs-live.com/assets/flare.png",
            this._scene,
        );
        ps.emitter = this._visualPivot;
        ps.isLocal = true;
        ps.minSize = 1;
        ps.maxSize = 1;
        ps.minScaleX = 1.0;
        ps.maxScaleX = 1.0;
        ps.minScaleY = 1.0;
        ps.maxScaleY = 1.0;
        ps.minEmitBox = new Vector3(-0.01, -0.01, -0.01);
        ps.maxEmitBox = new Vector3(0.01, 0.01, 0.01);
        ps.color1 = new Color4(0, 1, 0, 1);
        ps.color2 = new Color4(0.1, 1, 0.1, 0.8);
        ps.minInitialRotation = -Math.PI;
        ps.maxInitialRotation = Math.PI;
        ps.minAngularSpeed = -0.5;
        ps.maxAngularSpeed = 0.5;
        ps.minLifeTime = 0.5;
        ps.maxLifeTime = 1;
        ps.emitRate = 150;
        ps.updateSpeed = 0.01;
        ps.blendMode = ParticleSystem.BLENDMODE_ADD;
        ps.start();
        ps.start();

        // 4. Lumière décalée
        this._pointLight = new PointLight(
            "player_light",
            new Vector3(0, 0.5, -4),
            this._scene,
        );
        this._pointLight.parent = this.transform;
        this._pointLight.diffuse = new Color3(1.0, 0.95, 0.4);
        this._pointLight.intensity = 0.7;
        this._pointLight.range = 15;

        // 5. Socket pour l'arme (Remplace le Skeleton lourd)
        this._weaponSocket = new TransformNode("RightHandSocket", this._scene);
        this._weaponSocket.parent = this.mesh;
        this._weaponSocket.position.set(0.5, 0, 0);
    }

    public update(dt: number): void {
        if (this.isDead) return;

        this._timeCounter += dt;
        this._updateIFrames(dt);
        this.updateInput(dt);
        this.checkGrounded();

        this.coyoteTimeCounter = this.isGrounded
            ? this.coyoteTimeDuration
            : this.coyoteTimeCounter - dt;

        this.movementFSM.update(dt);
        this.attackFSM.update(dt);

        // Animation de flottement et lumière (Simplifiée)
        if (this._visualPivot) {
            const oscillation =
                Math.sin(this._timeCounter * this.FLOAT_SPEED) *
                this.FLOAT_AMPLITUDE;
            this._visualPivot.position.y = 0.5 + oscillation;

            if (this._pointLight) {
                // On évite les calculs de rotation complexes chaque frame
                const isFacingLeft =
                    this.transform.rotation.y > 0.1 ||
                    this.transform.rotation.y < -0.1;
                this._pointLight.position.z = isFacingLeft ? 4 : -8;
            }
        }

        this._updateCamera();

        // Contrainte 2D stricte
        this.transform.position.z = 0;
        this.velocity.z = 0;
    }

    private _initObservers(): void {
        // Nettoyage automatique des anciens observers pour éviter le lag croissant
        OnInteractionAvailable.clear();
        OnInteractionAvailable.add((event) => {
            if (event.isNear) this._targetInteractable = event.interactable;
            else if (this._targetInteractable === event.interactable)
                this._targetInteractable = null;
        });

        OnWeaponChanged.add((event) => {
            this.currentWeapon = event.weapon;
        });
    }

    // --- Gestion des Armes ---
    public setWeaponSlot(slot: WeaponSlot, weaponId: string | null): void {
        this._currentSlots[slot] = weaponId;
        if (this.currentWeapon?.slot === slot) {
            if (weaponId) this.requestVisualWeapon(weaponId);
            else {
                this.currentWeapon?.mesh?.dispose();
                this.currentWeapon = null;
            }
        }
    }

    public switchWeapon(): void {
        const equippedSlots = Object.values(WeaponSlot).filter(
            (s) => this._currentSlots[s] !== null,
        );
        if (equippedSlots.length < 2) return;
        this._nextSlotIndex = (this._nextSlotIndex + 1) % equippedSlots.length;
        const nextId = this._currentSlots[equippedSlots[this._nextSlotIndex]];
        if (nextId) this.requestVisualWeapon(nextId);
    }

    private requestVisualWeapon(weaponId: string): void {
        OnRequestWeaponEquip.notifyObservers({ character: this, weaponId });
    }

    public updateInput(dt: number): void {
        this.input.update();
        this.buffer.update(dt);
        if (this.input.isJumping) this.buffer.trigger("jump");
        if (this.input.isAttacking) this.buffer.trigger("attack");
        if (this.input.isSwitchingWeapon) {
            this.switchWeapon();
            this.input.isSwitchingWeapon = false;
        }
        if (this.input.isInteracting && this._targetInteractable) {
            this._targetInteractable.onInteract();
            this.input.isInteracting = false;
        }
    }

    public takeDamage(amount: number): void {
        if (this._invulnerabilityTimer > 0 || this.isDead) return;
        super.takeDamage(amount);
        this._invulnerabilityTimer = this.I_FRAME_DURATION;

        if (this._pointLight) this._pointLight.intensity = 0.2;

        OnHealthChanged.notifyObservers({
            currentHp: this.stats.hp,
            maxHp: this.stats.maxHp,
            entityId: "Player",
        });
    }

    private _updateIFrames(dt: number): void {
        if (this._invulnerabilityTimer > 0) {
            this._invulnerabilityTimer -= dt;
            if (this._invulnerabilityTimer <= 0 && this._pointLight) {
                this._pointLight.intensity = 0.7;
            }
        }
    }

    private _updateCamera(): void {
        const targetPos = new Vector3(
            this.transform.position.x,
            this.transform.position.y + 2,
            -15,
        );
        // Interpolation douce
        this._camera.position.x +=
            (targetPos.x - this._camera.position.x) * 0.1;
        this._camera.position.y +=
            (targetPos.y - this._camera.position.y) * 0.1;
        this._camera.position.z = -15;

        this._camera.setTarget(
            new Vector3(
                this.transform.position.x,
                this.transform.position.y + 1,
                0,
            ),
        );
    }

    public dispose(): void {
        if (this._soulParticles) this._soulParticles.dispose();
        if (this._pointLight) this._pointLight.dispose();
        if (this._visualPivot) this._visualPivot.dispose();
        if (this._weaponSocket) this._weaponSocket.dispose();
        super.dispose();
    }
}
