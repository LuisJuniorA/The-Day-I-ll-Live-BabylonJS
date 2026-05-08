import { UniversalCamera, Vector3, Scene, Scalar } from "@babylonjs/core";
import { Player } from "../entities/Player";
import { type CameraBounds, CAM_CONFIG } from "../core/types/CameraTypes";

export class CameraManager {
    private _camera: UniversalCamera;
    private _player: Player;

    private _currentBiasX: number = 0;
    private _currentBiasY: number = 0;
    private _currentBounds: CameraBounds | null = null;

    constructor(scene: Scene, player: Player) {
        this._player = player;

        const startPos = new Vector3(
            player.transform.position.x,
            player.transform.position.y + CAM_CONFIG.OFFSET_Y,
            CAM_CONFIG.DISTANCE_Z,
        );

        this._camera = new UniversalCamera("playerCamera", startPos, scene);
        this._camera.setTarget(new Vector3(startPos.x, startPos.y, 0));
        scene.activeCamera = this._camera;
    }

    public update(_dt: number): void {
        if (!this._camera || !this._player) return;

        // 1. GESTION DES BIAS
        let targetBiasX = 0;
        let targetBiasY = 0;

        // Bias Horizontal (On utilise la vélocité ou l'input pour plus de punch)
        if (Math.abs(this._player.input.horizontal) > 0.1) {
            targetBiasX =
                this._player.input.horizontal > 0
                    ? CAM_CONFIG.BIAS_X
                    : -CAM_CONFIG.BIAS_X;
        }

        // Bias Vertical
        if (
            this._player.isGrounded &&
            Math.abs(this._player.input.horizontal) < 0.2
        ) {
            if (this._player.input.vertical > 0.5) {
                targetBiasY = CAM_CONFIG.BIAS_Y_SIGHT;
                targetBiasX = 0;
            } else if (this._player.input.vertical < -0.5) {
                targetBiasY = -CAM_CONFIG.BIAS_Y_SIGHT;
                targetBiasX = 0;
            }
        }

        // --- LE SECRET EST ICI ---
        // On augmente la vitesse de lissage du Bias (0.15 au lieu de 0.05)
        // Le Bias doit être plus rapide que le Lerp de la caméra pour être visible.
        this._currentBiasX = Scalar.Lerp(this._currentBiasX, targetBiasX, 0.15);
        this._currentBiasY = Scalar.Lerp(this._currentBiasY, targetBiasY, 0.15);

        // 2. POSITION CIBLE
        let tx = this._player.transform.position.x + this._currentBiasX;
        let ty =
            this._player.transform.position.y +
            CAM_CONFIG.OFFSET_Y +
            this._currentBiasY;

        // 3. CONFINEMENT
        if (this._currentBounds) {
            tx = Scalar.Clamp(
                tx,
                this._currentBounds.minX + CAM_CONFIG.VIEW_HALF_W,
                this._currentBounds.maxX - CAM_CONFIG.VIEW_HALF_W,
            );
            ty = Scalar.Clamp(
                ty,
                this._currentBounds.minY + CAM_CONFIG.VIEW_HALF_H,
                this._currentBounds.maxY - CAM_CONFIG.VIEW_HALF_H,
            );
        }

        // 4. LISSAGE FINAL
        // lerpX un peu plus faible pour accentuer l'effet de "traînée" du décor
        this._camera.position.x = Scalar.Lerp(
            this._camera.position.x,
            tx,
            CAM_CONFIG.LERP_X,
        );

        const lerpY =
            this._player.velocity.y < -0.1
                ? CAM_CONFIG.LERP_Y_DOWN
                : CAM_CONFIG.LERP_Y_UP;
        this._camera.position.y = Scalar.Lerp(
            this._camera.position.y,
            ty,
            lerpY,
        );

        this._camera.position.z = CAM_CONFIG.DISTANCE_Z;

        this._camera.setTarget(
            new Vector3(this._camera.position.x, this._camera.position.y, 0),
        );
    }

    public setBounds(bounds: CameraBounds | null): void {
        this._currentBounds = bounds;
    }
}
