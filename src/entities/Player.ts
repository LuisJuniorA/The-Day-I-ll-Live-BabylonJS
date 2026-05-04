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
    private _weaponSocket: TransformNode | null = null;

    private _timeCounter: number = 0;
    private readonly FLOAT_AMPLITUDE: number = 0.1;
    private readonly FLOAT_SPEED: number = 2.5;

    // --- Configuration Caméra (Style Hollow Knight) ---
    private _camLookAhead: number = 0;
    private _camTargetLookAhead: number = 0;
    private readonly CAM_OFFSET_Y: number = 1.5;
    private readonly CAM_DISTANCE_Z: number = -18;
    private readonly LOOK_AHEAD_DISTANCE: number = 4;
    private readonly LERP_SMOOTHNESS: number = 0.1; // Suivi horizontal

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

        // Initialisation de la caméra
        this._camera = new UniversalCamera(
            "playerCamera",
            new Vector3(startPosition.x, startPosition.y, this.CAM_DISTANCE_Z),
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

        // 1. Détection du sol
        this.checkGrounded();

        // 2. LOGIQUE DE GRAVITÉ CENTRALISÉE
        if (this.isGrounded) {
            // Si on est au sol et qu'on ne saute pas, on maintient une petite pression vers le bas
            if (this.velocity.y <= 0) {
                this.velocity.y = -0.1;
            }
            this.coyoteTimeCounter = this.coyoteTimeDuration;
        } else {
            // Application de la gravité (accélération)
            // Le multiplicateur 60-80 ajuste le "poids" ressenti
            this.velocity.y += this.gravity * dt * 65;

            // Vitesse terminale pour éviter de traverser le décor
            if (this.velocity.y < -25) this.velocity.y = -25;

            this.coyoteTimeCounter -= dt;
        }

        // 3. Mise à jour des Machines à États
        this.movementFSM.update(dt);
        this.attackFSM.update(dt);

        // 4. Cosmétique (Flottement et Lumière)
        if (this._visualPivot) {
            const oscillation =
                Math.sin(this._timeCounter * this.FLOAT_SPEED) *
                this.FLOAT_AMPLITUDE;
            this._visualPivot.position.y = 0.5 + oscillation;

            if (this._pointLight) {
                const isFacingLeft =
                    this.transform.rotation.y > 0.1 ||
                    this.transform.rotation.y < -0.1;
                this._pointLight.position.z = isFacingLeft ? 4 : -8;
            }
        }

        // 5. Caméra et Contrainte 2D
        this._updateCamera(dt);
        this.transform.position.z = 0;
        this.velocity.z = 0;
    }

    private _updateCamera(_dt: number): void {
        if (!this._camera) return;

        // 1. DIRECTION BIAS (Look Ahead)
        // On anticipe la direction basée sur l'input horizontal
        if (this.input.horizontal > 0.1) {
            this._camTargetLookAhead = this.LOOK_AHEAD_DISTANCE;
        } else if (this.input.horizontal < -0.1) {
            this._camTargetLookAhead = -this.LOOK_AHEAD_DISTANCE;
        }

        // Si le joueur regarde vers le bas (immobile sur le sol)
        let verticalLookOffset = 0;
        if (this.isGrounded && Math.abs(this.input.horizontal) < 0.1) {
            if (this.input.vertical < -0.5) {
                // Regarder vers le bas
                verticalLookOffset = -4;
                this._camTargetLookAhead = 0;
            } else if (this.input.vertical > 0.5) {
                // Regarder vers le haut
                verticalLookOffset = 4;
                this._camTargetLookAhead = 0;
            }
        }

        // Lissage de l'anticipation
        this._camLookAhead +=
            (this._camTargetLookAhead - this._camLookAhead) * 0.05;

        // 2. DAMPING VERTICAL (Chute vs Saut)
        // La caméra suit plus vite quand on tombe pour ne pas perdre le joueur
        let verticalLeash = 0.06; // Damping normal (saut/montée)
        if (this.velocity.y < -0.1) {
            verticalLeash = 0.12; // Damping serré (chute)
        }

        // 3. CALCUL POSITION FINALE
        const targetX = this.transform.position.x + this._camLookAhead;
        const targetY =
            this.transform.position.y + this.CAM_OFFSET_Y + verticalLookOffset;

        // Interpolations
        this._camera.position.x +=
            (targetX - this._camera.position.x) * this.LERP_SMOOTHNESS;
        this._camera.position.y +=
            (targetY - this._camera.position.y) * verticalLeash;
        this._camera.position.z = this.CAM_DISTANCE_Z;

        // La caméra regarde un point fixe sur le plan 0 pour garder la perspective 2D
        this._camera.setTarget(
            new Vector3(this._camera.position.x, this._camera.position.y, 0),
        );
    }

    private _initObservers(): void {
        OnInteractionAvailable.clear();
        OnInteractionAvailable.add((event) => {
            if (event.isNear) this._targetInteractable = event.interactable;
            else if (this._targetInteractable === event.interactable)
                this._targetInteractable = null;
        });

        OnWeaponChanged.add((event) => {
            this.currentWeapon = event.weapon;
            (event as any).allSlots = { ...this._currentSlots };
        });
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

    // --- Gestion des Armes & Combat ---
    // À remplacer dans Player.ts
    public takeDamage(
        amount: number,
        originPos?: Vector3,
        attackerId?: string,
    ): void {
        if (this._invulnerabilityTimer > 0 || this.isDead) return;

        // Appelle Character.takeDamage (qui gère désormais les PV + le vecteur de recul)
        super.takeDamage(amount, originPos, attackerId);

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

    public dispose(): void {
        if (this._soulParticles) this._soulParticles.dispose();
        if (this._pointLight) this._pointLight.dispose();
        if (this._visualPivot) this._visualPivot.dispose();
        if (this._weaponSocket) this._weaponSocket.dispose();
        super.dispose();
    }

    public get weaponSlots(): Record<WeaponSlot, string | null> {
        return this._currentSlots;
    }
}
