import {
    Scene,
    Vector3,
    MeshBuilder,
    PointLight,
    AbstractMesh,
    ParticleSystem,
    Texture,
    Color3,
    Color4,
    TransformNode,
    Scalar,
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
    AttackDirection,
    OnExperienceGained,
    OnHealthChanged,
    OnItemPickedUp,
    OnRequestWeaponEquip,
    OnSpellChanged,
    OnStatusApplied,
    OnWeaponChanged,
} from "../core/interfaces/CombatEvent";
import { Faction } from "../core/types/Faction";
import { Weapon } from "../core/abstracts/Weapon";
import { WeaponSlot } from "../core/types/WeaponTypes";
import { InventoryManager } from "../managers/InventoryManager";
import { ExperienceManager } from "../managers/ExperienceManager";
import {
    ItemType,
    type EffectType,
    type ItemEffect,
    type LootDrop,
} from "../core/types/Items";
import { StatusType } from "../core/types/StatusEffects";
import type { Spell } from "../core/interfaces/Spell";
import type { ShopItem } from "../core/interfaces/ShopEvents";
import {
    OnInventoryUpdated,
    OnItemDropped,
    OnOpenInventory,
    OnRequestConsumableUse,
} from "../core/interfaces/InventoryEvent";
import { WEAPONS_DB } from "../data/WeaponsDb";
import { ModifierMode } from "../core/types/WeaponStats";
import { OnCurrencyChanged } from "../core/interfaces/CurrencyEvent";
import { OnLootReceived } from "../core/interfaces/LootEvents";
import { ItemData } from "../data/ItemData";
import { ALL_ITEMS } from "../data/ItemDb";

export class Player extends Character {
    public readonly input: InputHandler;
    public readonly movementFSM: FSM<Player>;
    public readonly attackFSM: FSM<Player>;
    public readonly buffer: InputBufferManager = new InputBufferManager();
    public queuedAttackDirection: AttackDirection = AttackDirection.SIDE;

    public readonly exp = new ExperienceManager();
    public readonly inventory = new InventoryManager();

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

    public currency: number = 5000; // Tes "Fragments"

    private _currentStatus: StatusType = StatusType.NONE;
    private _statusTimer: number = 0;
    private _activeModifiers: Map<string, number> = new Map();

    private _currentSlots: Record<WeaponSlot, string | null> = {
        [WeaponSlot.DAGGER]: null,
        [WeaponSlot.SWORD]: null,
        [WeaponSlot.GREATSWORD]: null,
    };
    private _activeSpell: Spell | null = null;

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
            "Player",
        );
        this.setupPlayerDebug();

        this._initPlayer(startPosition);
        this.input = new InputHandler(scene);
        this.movementFSM = new FSM<Player>(this);
        this.attackFSM = new FSM<Player>(this);

        this._initObservers();
        this.inventory.addItem(ALL_ITEMS["health_potion"], 1);
        this.movementFSM.transitionTo(new PlayerMoveState());
        this.attackFSM.transitionTo(new PlayerCombatIdleState());
    }

    public grantXp(amount: number): void {
        const leveledUp = this.exp.addXp(amount);

        if (leveledUp) {
            this._onLevelUp();
        }

        // Optionnel : Notifier l'UI pour la barre d'XP
        // OnXpChanged.notifyObservers({ current: this.exp.currentXp, next: this.exp.xpToNextLevel });
    }

    private _onLevelUp(): void {
        // Boost des stats (Hollow Knight style : on pourrait augmenter les dégâts ou la vie max)
        this.stats.maxHp += 10;
        this.stats.hp = this.stats.maxHp; // Soins complets au level up
        this.stats.damage += 2;

        console.log(`Bravo ! Niveau ${this.exp.level} atteint.`);

        // Update UI
        OnHealthChanged.notifyObservers({
            currentHp: this.stats.hp,
            maxHp: this.effectiveMaxHp,
            entityId: "Player",
        });
    }

    /**
     * Méthode principale pour consommer un objet.
     * Appelle-la depuis ton UI d'inventaire.
     */
    public consumeItem(itemId: string): void {
        if (this.inventory.getItemAmount(itemId) == 0) return;
        const item = ItemData[itemId];
        if (!item || item.type !== ItemType.CONSUMABLE || !item.effects) return;

        console.log(
            `%c [ITEM] Utilisation de : ${item.name}`,
            "color: #4cd137; font-weight: bold;",
        );

        // 1. Appliquer chaque effet défini dans l'item
        item.effects.forEach((effect) => this._applyEffect(effect));

        // 2. Retirer l'item de l'inventaire
        this.inventory.removeItem(itemId, 1);
        OnInventoryUpdated.notifyObservers();
    }

    /**
     * Oriente l'effet vers la bonne logique (Soin vs Buff)
     */
    private _applyEffect(effect: ItemEffect): void {
        switch (effect.type) {
            case "heal":
                this.heal(effect.value);
                break;
            case "speed":
                this._applyTemporaryBuff(
                    "speed",
                    effect.value,
                    effect.duration ?? 0,
                );
                break;
            case "damage":
                this._applyTemporaryBuff(
                    "damage",
                    effect.value,
                    effect.duration ?? 0,
                );
                break;
        }
    }

    /**
     * Soigne le joueur et notifie l'UI
     */
    public heal(amount: number): void {
        if (this.isDead) return;

        const previousHp = this.stats.hp;
        this.stats.hp = Math.min(this.stats.hp + amount, this.effectiveMaxHp);

        console.log(
            `%c [HEAL] +${this.stats.hp - previousHp} HP`,
            "color: #ff4757",
        );

        OnHealthChanged.notifyObservers({
            currentHp: this.stats.hp,
            maxHp: this.effectiveMaxHp,
            entityId: "Player",
        });
    }

    /**
     * Gère les bonus temporaires (Speed, Damage, etc.)
     * Utilise un modificateur temporaire sur les stats
     */
    private _applyTemporaryBuff(
        statType: EffectType,
        value: number,
        duration: number,
    ): void {
        if (duration <= 0) return;

        // On applique le buff (ex: on ajoute directement à la stat de base)
        if (statType === "speed") this.stats.speed += value;
        if (statType === "damage") this.stats.damage += value;

        console.log(
            `%c [BUFF] ${statType.toUpperCase()} +${value} pendant ${duration}s`,
            "color: #eccc68",
        );

        // On programme la fin du buff
        setTimeout(() => {
            if (statType === "speed") this.stats.speed -= value;
            if (statType === "damage") this.stats.damage -= value;

            console.log(
                `%c [BUFF] Fin de l'effet ${statType}`,
                "color: #70a1ff",
            );
        }, duration * 1000);
    }

    public pickUp(loot: LootDrop): void {
        // 1. Détection de la monnaie (via ID ou Type)
        if (loot.item.id === "fragment" || loot.item.type === "currency") {
            this.currency += loot.amount;
            console.log(
                `%c +${loot.amount} Fragments collectés ! (Total: ${this.currency})`,
                "color: #FFD700; font-weight: bold;",
            );

            // Notifier le HUD si tu as une méthode updateCurrency
            OnCurrencyChanged.notifyObservers({
                currentAmount: this.currency,
                delta: loot.amount,
            });
            return;
        }

        // 2. Logique normale pour les autres items
        const success = this.inventory.addItem(loot.item, loot.amount);
        if (success) {
            // Déclenche l'event de notification
            OnLootReceived.notifyObservers({
                item: loot.item,
                amount: loot.amount,
            });
        } else {
            console.warn("Inventaire plein !");
        }
    }

    public learnSpell(spell: Spell): void {
        this._activeSpell = spell;
        console.log(`Nouveau sort débloqué : ${spell.name}`);
        OnSpellChanged.notifyObservers(spell);
    }

    public get hasSpell(): boolean {
        return this._activeSpell !== null;
    }

    public get activeSpell(): Spell | null {
        return this._activeSpell;
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
        ps.particleTexture = new Texture("./textures/flare.png", this._scene);
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
        ps.color1 = new Color4(1, 1, 0.2, 1.0);
        ps.color2 = new Color4(1, 0.2, 0, 1.0);
        ps.colorDead = new Color4(0.2, 0, 0, 0.0);
        ps.minInitialRotation = -Math.PI;
        ps.maxInitialRotation = Math.PI;
        ps.minAngularSpeed = -0.5;
        ps.maxAngularSpeed = 0.5;
        ps.minLifeTime = 0.5;
        ps.maxLifeTime = 1;
        ps.emitRate = 100;
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
        this._pointLight.diffuse = new Color3(1, 0.98, 0.9);
        this._pointLight.intensity = 0.7;
        this._pointLight.range = 30;

        // 5. Socket pour l'arme (Remplace le Skeleton lourd)
        this._weaponSocket = new TransformNode("RightHandSocket", this._scene);
        this._weaponSocket.parent = this.mesh;
        this._weaponSocket.position.set(0.5, 0, 0);
    }

    public update(dt: number): void {
        if (this.isDead) return;

        this._updateStatus(dt);

        this._timeCounter += dt;
        this._updateIFrames(dt);

        if (this._currentStatus === StatusType.STUN) {
            //this.applyPhysics(dt); // On garde la gravité pour ne pas flotter en l'air
            return;
        }

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
                // On copie la position du joueur manuellement
                this._pointLight.position.x = this.transform.position.x;
                this._pointLight.position.y = this.transform.position.y + 0.5;
                this._pointLight.position.z = -10; // Toujours fixe vers la caméra
                this._pointLight.includedOnlyMeshes = [];
            }
        }

        // 5. Caméra et Contrainte 2D
        this.transform.position.z = 0;
        this.velocity.z = 0;
    }

    /**
     * Override du move pour injecter les modificateurs d'équipement
     */

    public override move(inputVector: Vector3, dt: number): void {
        if (this.isDead || !this.mesh) return;

        // 1. On calcule la vitesse cible (Stat de base + Equipement)
        const moveX = inputVector.x; // L'input brut (-1, 0, 1)
        const bonus = this.getSpeedBonus();
        const maxSpeed = this.stats.speed * bonus;
        const targetVelocityX = moveX * maxSpeed;

        // 2. Lissage (Lerp) : On met à jour la vélocité horizontale du joueur
        // On utilise 0.2 pour un feeling nerveux, baisse à 0.1 pour du "savonneux"
        this.velocity.x = Scalar.Lerp(this.velocity.x, targetVelocityX, 0.2);

        // 3. Sécurité d'arrêt (Évite de glisser à l'infini)
        if (Math.abs(moveX) < 0.1 && Math.abs(this.velocity.x) < 0.1) {
            this.velocity.x = 0;
        }

        // 4. Orientation (Flip du sprite/mesh)
        if (Math.abs(this.velocity.x) > 0.1) {
            this.faceDirection(this.velocity.x);
        }

        // 5. On prépare le vecteur final pour le parent
        // On prend le X qu'on vient de lisser et le Y de la gravité géré dans update()
        const finalMoveVector = new Vector3(
            this.velocity.x,
            this.velocity.y,
            0,
        );

        // 6. On appelle la physique du Character (Parent)
        // C'est lui qui fera le .scale(dt) et le moveWithCollisions
        super.move(finalMoveVector, dt);
    }

    public tryPurchase(item: ShopItem): boolean {
        if (this.currency < item.price) return false;

        const success = this.inventory.addItem(item, 1);
        if (success) {
            this.currency -= item.price;
            return true;
        }
        return false;
    }

    public getSpeedBonus(): number {
        // On commence à 100% de la vitesse
        let multiplier = 1.0;

        // 1. Bonus des Armes (Passifs et Actifs)
        for (const slot in this.weaponSlots) {
            const weaponId = this.weaponSlots[slot as WeaponSlot];
            if (weaponId) {
                const weaponData = WEAPONS_DB[weaponId];
                if (
                    weaponData?.modifiers?.speedBoost?.mode ===
                    ModifierMode.PASSIVE
                ) {
                    // Si ton arme donne +0.2 (20%), on l'ajoute
                    multiplier += weaponData.modifiers.speedBoost.value;
                }
            }
        }

        if (
            this.currentWeapon?.data?.modifiers?.speedBoost?.mode ===
            ModifierMode.ACTIVE
        ) {
            multiplier += this.currentWeapon.data.modifiers.speedBoost.value;
        }

        // 2. Bonus des Potions (via le dictionnaire)
        // Ici, getModifier("speed") retournera par exemple 0.3 pour une potion +30%
        multiplier += this.getModifier("speed");

        // On retourne le multiplicateur final
        return multiplier;
    }

    public addCurrency(amount: number): void {
        this.currency += amount;
    }

    public canAfford(price: number): boolean {
        return this.currency >= price;
    }

    private _initObservers(): void {
        OnInteractionAvailable.add((event) => {
            if (event.isNear) this._targetInteractable = event.interactable;
            else if (this._targetInteractable === event.interactable)
                this._targetInteractable = null;
        });
        OnRequestConsumableUse.add((event) => {
            // On vérifie que c'est bien ce joueur qui est concerné
            if (event.character.id === this.id) {
                this.consumeItem(event.itemId);
            }
        });

        // Écoute l'événement de jet d'objet depuis l'UI
        OnItemDropped.add((event) => {
            // On vérifie si l'item est possédé
            const currentAmount = this.inventory.getItemAmount(event.itemId);

            if (currentAmount > 0) {
                const amountToRemove =
                    this.inventory.getItemAmount(event.itemId) ?? 1;

                // 1. Suppression logique
                this.inventory.removeItem(event.itemId, amountToRemove);

                console.log(
                    `%c [DROP] ${event.itemId} jeté (${amountToRemove} unité(s))`,
                    "color: #ffa502",
                );

                // 2. Notification de rafraîchissement pour l'UI
                OnInventoryUpdated.notifyObservers();
            }
        });

        OnWeaponChanged.add((event) => {
            this.currentWeapon = event.weapon;
            (event as any).allSlots = { ...this._currentSlots };
        });

        OnStatusApplied.add((event) => {
            if (event.targetId === "Player") {
                this.applyStatus(event.effectType, event.duration);

                // Optionnel : Jouer l'animation visuelle demandée par l'ennemi
                if (event.visualAnim) {
                    console.log(
                        `Le joueur joue l'animation : ${event.visualAnim}`,
                    );
                    // Ici, appelle ton système d'animation si tu en as un pour l'âme
                }
            }
        });

        OnExperienceGained.add((event) => {
            if (event.targetId === "Player") {
                this.grantXp(event.amount);
            }
        });

        // Liaison Inventaire : Quand le LootManager notifie un ramassage d'objet
        OnItemPickedUp.add((event) => {
            if (event.targetId === "Player") {
                // On utilise la structure LootDrop attendue par ta méthode pickUp
                this.pickUp({
                    item: event.item,
                    amount: event.amount,
                });
            }
        });
    }

    public applyStatus(type: StatusType, duration: number): void {
        this._currentStatus = type;
        this._statusTimer = duration;

        if (type === StatusType.STUN) {
            // On stoppe net la vélocité horizontale
            this.velocity.x = 0;
            console.log("ÉTALÉ ! Le joueur est étourdi.");
        }
    }

    private _updateStatus(dt: number): void {
        if (this._statusTimer > 0) {
            this._statusTimer -= dt;
            if (this._statusTimer <= 0) {
                this._currentStatus = StatusType.NONE;
                console.log("Le joueur n'est plus étourdi.");
            }
        }
    }

    public updateInput(dt: number): void {
        this.input.update();
        this.buffer.update(dt);
        if (this.input.isJumping) this.buffer.trigger("jump");
        if (this.input.isCasting) {
            this.buffer.trigger("spell");
        }
        if (this.input.isAttacking) {
            if (this.input.vertical > 0)
                this.queuedAttackDirection = AttackDirection.UP;
            else if (this.input.vertical < 0)
                this.queuedAttackDirection = AttackDirection.DOWN;
            else this.queuedAttackDirection = AttackDirection.SIDE;
            this.buffer.trigger("attack");
        }
        if (this.input.isSwitchingWeapon) {
            this.switchWeapon();
            this.input.isSwitchingWeapon = false;
        }
        if (this.input.isInteracting && this._targetInteractable) {
            this._targetInteractable.onInteract();
            this.input.isInteracting = false;
        }

        if (this.input.isInventoryPressed) {
            // On récupère les items formatés pour la vue
            const items = this.inventory.getAllItems().map((slot) => ({
                id: slot.item.id,
                quantity: slot.amount,
                type: slot.item.type,
                metadata: slot.item,
            }));

            OnOpenInventory.notifyObservers({
                playerId: this.id,
                items: items,
            });

            // Reset du flag pour éviter les doubles déclenchements
            this.input.isInventoryPressed = false;
        }
    }

    // --- Gestion des Armes & Combat ---
    // À remplacer dans Player.ts
    public takeDamage(
        amount: number,
        originPos?: Vector3,
        attackerId?: string,
    ): void {
        console.log("????");
        if (this._invulnerabilityTimer > 0 || this.isDead) return;

        // Appelle Character.takeDamage (qui gère désormais les PV + le vecteur de recul)
        super.takeDamage(amount, originPos, attackerId);

        this._invulnerabilityTimer = this.I_FRAME_DURATION;

        OnHealthChanged.notifyObservers({
            currentHp: this.stats.hp,
            maxHp: this.effectiveMaxHp,
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
        // 1. On met à jour le dictionnaire logique
        this._currentSlots[slot] = weaponId;

        // 2. On vérifie si c'est l'arme qu'on a actuellement dans la main
        if (this.currentWeapon?.weaponSlot === slot) {
            if (weaponId) {
                // On remplace par une autre arme
                this.requestVisualWeapon(weaponId);
            } else {
                // CAS CRITIQUE : On déséquipe l'arme active.

                // A. ON ENVOIE L'ORDRE DE CACHE AVANT DE PERDRE LA RÉFÉRENCE
                // On envoie "" ou null pour que le WeaponManager appelle deactivateWeapon()
                this.requestVisualWeapon("");

                // B. SEULEMENT APRÈS, ON VIDE LA RÉFÉRENCE
                this.currentWeapon = null;
            }
        }

        // 3. Update UI et stats
        OnHealthChanged.notifyObservers({
            currentHp: this.stats.hp,
            maxHp: this.effectiveMaxHp,
            entityId: "Player",
        });
    }

    public switchWeapon(): void {
        const equippedSlots = Object.values(WeaponSlot).filter((slotKey) => {
            const id = this._currentSlots[slotKey];
            return id !== null && id !== "";
        });

        // FIX : Si on n'a plus rien, on doit vider la main !
        if (equippedSlots.length === 0) {
            this.currentWeapon = null;
            // On envoie un ID vide pour dire au Manager de tout désactiver
            this.requestVisualWeapon("");
            return;
        }

        // 2. On trouve où se situe l'arme actuelle dans cette liste
        // Si aucune arme n'est en main, on commence à -1 pour finir à 0
        const currentIndex = equippedSlots.findIndex(
            (slotKey) => this._currentSlots[slotKey] === this.currentWeapon?.id,
        );

        // 3. Calcul de l'index suivant (boucle circulaire)
        const nextListIndex = (currentIndex + 1) % equippedSlots.length;
        const nextSlotKey = equippedSlots[nextListIndex];
        const nextId = this._currentSlots[nextSlotKey];

        // 4. On équipe
        if (nextId && this.currentWeapon?.id !== nextId) {
            console.log(
                `Switching from index ${currentIndex} to ${nextListIndex} (Slot: ${nextSlotKey})`,
            );
            this.requestVisualWeapon(nextId);
        }
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

    /**
     * Affiche l'état complet du joueur (Stats, Physique, FSM, Inventaire)
     */
    public setupPlayerDebug(): void {
        // @ts-ignore
        if (import.meta.env.DEV) {
            window.addEventListener("keydown", (ev) => {
                // Raccourci : Ctrl + Shift + Alt + P
                if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === "P") {
                    console.log(
                        "%c --- PLAYER STATUS REPORT --- ",
                        "background: #2f3542; color: #7bed9f; font-weight: bold; font-size: 14px;",
                    );

                    // 1. État de Santé & XP
                    const hpPercent = (
                        (this.stats.hp / this.stats.maxHp) *
                        100
                    ).toFixed(0);
                    const xpPercent = (
                        (this.exp.currentXp / this.exp.xpToNextLevel) *
                        100
                    ).toFixed(0);

                    console.log(
                        `%c[STATS] HP: ${this.stats.hp}/${this.stats.maxHp} (${hpPercent}%) | LVL: ${this.exp.level} (XP: ${xpPercent}%)`,
                        "color: #7bed9f; font-weight: bold;",
                    );

                    // 2. Physique & Position
                    console.log(
                        `%c[PHYSICS] Pos: ${this.transform.position.x.toFixed(2)}, ${this.transform.position.y.toFixed(2)} | Vel: ${this.velocity.x.toFixed(2)}, ${this.velocity.y.toFixed(2)} | Grounded: ${this.isGrounded ? "YES" : "NO"} | Coyote: ${this.coyoteTimeCounter.toFixed(2)}s`,
                        "color: #70a1ff",
                    );

                    // 3. FSM (Machines à états)
                    // Note: On accède à currentState via 'any' si la propriété est privée dans ta FSM
                    const moveState =
                        (this.movementFSM as any)._currentState?.constructor
                            .name ?? "None";
                    const attackState =
                        (this.attackFSM as any)._currentState?.constructor
                            .name ?? "None";

                    console.log(
                        `%c[STATES] Movement: ${moveState} | Combat: ${attackState} | I-Frames: ${this._invulnerabilityTimer.toFixed(2)}s`,
                        "color: #eccc68",
                    );

                    // 4. Combat & Inventaire
                    const weaponName = this.currentWeapon
                        ? this.currentWeapon.name
                        : "None";
                    const inventoryCount = this.inventory.content.length; // Utilise ton getter 'content'

                    console.table(this.inventory.content);

                    console.log(
                        `%c[EQUIP] Weapon: ${weaponName} | Interactable: ${this._targetInteractable ? "Yes" : "No"} | Inv Items: ${inventoryCount}`,
                        "color: #ffa502",
                    );

                    // 5. Slots d'armes
                    console.table(this._currentSlots);

                    console.log(
                        "%c --------------------------- ",
                        "color: #7bed9f;",
                    );
                }
            });
        }
    }

    /**
     * Calcule le Max HP total (Base + Modificateurs passifs des armes équipées)
     */
    public get effectiveMaxHp(): number {
        let totalMaxHp = this.stats.maxHp;

        for (const slot in this.weaponSlots) {
            const weaponId = this.weaponSlots[slot as WeaponSlot];
            if (weaponId) {
                const weaponData = WEAPONS_DB[weaponId];
                if (
                    weaponData?.modifiers?.healthBoost?.mode ===
                    ModifierMode.PASSIVE
                ) {
                    totalMaxHp += weaponData.modifiers.healthBoost.value;
                }
            }
        }

        if (
            this.currentWeapon?.data?.modifiers?.healthBoost?.mode ===
            ModifierMode.ACTIVE
        ) {
            totalMaxHp += this.currentWeapon.data.modifiers.healthBoost.value;
        }

        return totalMaxHp;
    }

    public getModifier(key: string): number {
        return this._activeModifiers.get(key) ?? 0;
    }
}
