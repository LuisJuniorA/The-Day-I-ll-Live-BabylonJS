import {
    UniversalCamera,
    Vector3,
    Scene,
    Scalar,
    PointLight,
    Color3,
} from "@babylonjs/core";
import { Player } from "../entities/Player";
import { type CameraBounds, CAM_CONFIG } from "../core/types/CameraTypes";

export class CameraManager {
    private _camera: UniversalCamera;
    private _player: Player;
    private _scene: Scene;
    private _light: PointLight;

    private _currentBiasX: number = 0;
    private _currentBiasY: number = 0;
    private _currentBounds: CameraBounds | null = null;

    constructor(scene: Scene, player: Player) {
        this._scene = scene;
        this._player = player;

        const startPos = new Vector3(
            player.transform.position.x,
            player.transform.position.y + CAM_CONFIG.OFFSET_Y,
            CAM_CONFIG.DISTANCE_Z,
        );

        this._camera = new UniversalCamera("playerCamera", startPos, scene);
        this._camera.setTarget(new Vector3(startPos.x, startPos.y, 0));
        scene.activeCamera = this._camera;

        // Configuration de la lampe torche (PointLight)
        // La PointLight éclaire tout autour d'elle, c'est idéal pour une torche
        this._light = new PointLight(
            "playerLight",
            Vector3.Zero(),
            this._scene,
        );

        // 1. Intensité très élevée pour compenser l'absence d'ambiance
        this._light.intensity = 30;
        // 2. Portée de la torche
        this._light.range = 50;
        // 3. Couleur un peu chaude pour faire "torche"
        this._light.diffuse = new Color3(1, 0.9, 0.7);

        this._scene.onBeforeRenderObservable.add(() => {
            this._updateLighting();
        });
    }

    private _updateLighting(): void {
        // La lampe est placée légèrement devant la caméra (sur l'axe Z)
        // pour éclairer le joueur et le sol devant lui
        const torchOffset = new Vector3(0, 0, 5);
        this._light.position = this._camera.position.add(torchOffset);
    }

    public update(_dt: number): void {
        if (!this._camera || !this._player) return;

        // ... (Ton code de lissage reste identique)
        let targetBiasX = 0;
        let targetBiasY = 0;

        if (Math.abs(this._player.input.horizontal) > 0.1) {
            targetBiasX =
                this._player.input.horizontal > 0
                    ? CAM_CONFIG.BIAS_X
                    : -CAM_CONFIG.BIAS_X;
        }

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

        this._currentBiasX = Scalar.Lerp(this._currentBiasX, targetBiasX, 0.15);
        this._currentBiasY = Scalar.Lerp(this._currentBiasY, targetBiasY, 0.15);

        let tx = this._player.transform.position.x + this._currentBiasX;
        let ty =
            this._player.transform.position.y +
            CAM_CONFIG.OFFSET_Y +
            this._currentBiasY;

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
