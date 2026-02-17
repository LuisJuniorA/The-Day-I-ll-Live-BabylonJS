import {
    Scene,
    Vector3,
    MeshBuilder,
    Mesh,
    UniversalCamera,
    KeyboardEventTypes,
    Scalar,
    Ray
} from "@babylonjs/core";

export class Player {
    private readonly _scene: Scene;
    private readonly _mesh: Mesh;
    private readonly _camera: UniversalCamera;

    private readonly _inputMap: Record<string, boolean> = {};

    // Paramètres physiques
    private readonly _speed: number = 0.2;
    private readonly _gravity: number = -0.015;
    private readonly _jumpForce: number = 0.35;

    // États
    private _velocity: Vector3;
    private _isGrounded: boolean = false;

    constructor(scene: Scene, startPosition: Vector3) {
        this._scene = scene;
        this._velocity = Vector3.Zero();

        // 1. Corps du joueur
        this._mesh = MeshBuilder.CreateCapsule("player", { height: 2, radius: 0.5 }, this._scene);
        this._mesh.position = startPosition;
        this._mesh.checkCollisions = true;

        // Configuration de l'ellipsoïde pour les collisions (très important pour le saut)
        this._mesh.ellipsoid = new Vector3(0.45, 0.9, 0.45);

        // 2. Caméra de profil (Side-scroller)
        // On la place sur l'axe Z à -15, elle regarde vers Z=0
        this._camera = new UniversalCamera("playerCamera", new Vector3(startPosition.x, startPosition.y, -15), this._scene);
        this._camera.setTarget(new Vector3(startPosition.x, startPosition.y, 0));

        this._setupInputs();
    }

    private _setupInputs(): void {
        this._scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                this._inputMap[kbInfo.event.key.toLowerCase()] = true;
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
                this._inputMap[kbInfo.event.key.toLowerCase()] = false;
            }
        });
    }

    public update(): void {
        this._applyMovements();
        this._updateCamera();
    }

    private _applyMovements(): void {
        // --- Mouvement Horizontal (X uniquement) ---
        let moveX = 0;
        if (this._inputMap["q"] || this._inputMap["arrowleft"]) moveX = -1;
        if (this._inputMap["d"] || this._inputMap["arrowright"]) moveX = 1;

        // On lisse le mouvement horizontal
        const targetVelocityX = moveX * this._speed;
        this._velocity.x = Scalar.Lerp(this._velocity.x, targetVelocityX, 0.2);

        // --- Mouvement Vertical (Gravité et Saut) ---

        // Raycast simple vers le bas pour détecter le sol
        this._checkGrounded();

        if (this._isGrounded) {
            this._velocity.y = 0;
            // Saut (Espace ou Flèche Haut)
            if (this._inputMap[" "] || this._inputMap["arrowup"] || this._inputMap["z"]) {
                this._velocity.y = this._jumpForce;
                this._isGrounded = false;
            }
        } else {
            // Application de la gravité
            this._velocity.y += this._gravity;
        }

        // --- Application Finale ---
        // On force Z à 0 pour rester sur le plan 2D
        this._velocity.z = 0;
        this._mesh.position.z = 0;

        this._mesh.moveWithCollisions(this._velocity);
    }

    private _checkGrounded(): void {
        // Le pivot est au centre, donc les pieds sont 1 unité plus bas
        const rayOrigin = this._mesh.position.clone();
        rayOrigin.y -= 0.9; // On part d'un peu au dessus des pieds (1.0 - 0.1)

        const rayDirection = new Vector3(0, -1, 0);
        const rayLength = 0.2; // Il doit descendre de 0.1 pour atteindre les pieds + 0.1 pour toucher le sol

        const ray = new Ray(rayOrigin, rayDirection, rayLength);

        const pick = this._scene.pickWithRay(ray, (mesh) => {
            return mesh.checkCollisions && mesh !== this._mesh;
        });

        this._isGrounded = (pick !== null && pick.hit);

        // Si on touche le sol, on annule la vélocité de chute
        if (this._isGrounded && this._velocity.y < 0) {
            this._velocity.y = 0;
        }
    }

    private _updateCamera(): void {
        // La caméra suit uniquement en X et Y, reste fixe en Z
        const targetPos = new Vector3(this._mesh.position.x, this._mesh.position.y + 2, -15);
        this._camera.position = Vector3.Lerp(this._camera.position, targetPos, 0.1);
        this._camera.setTarget(new Vector3(this._mesh.position.x, this._mesh.position.y + 2, 0));
    }

    public get position(): Vector3 {
        return this._mesh.position;
    }
}