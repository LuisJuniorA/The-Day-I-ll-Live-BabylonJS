import {
    Sound,
    Scene,
    Vector3,
    Scalar,
    CreateAudioEngineAsync,
    AudioBus,
    // Importe le type spécifique v8 si disponible, sinon garde IAudioEngine casté
} from "@babylonjs/core";
import "@babylonjs/core/Audio/audioSceneComponent";

import {
    AUDIO_CONFIG,
    type SfxName,
    type MusicName,
} from "../data/AudioAssets";

export class AudioManager {
    private static _instance: AudioManager;
    private _scene: Scene;

    private _sfxBus!: AudioBus;
    private _musicBus!: AudioBus;
    private _envBus!: AudioBus;

    private _audioEngine: any | null = null;
    private _sfxSounds: Map<string, Sound | Sound[]> = new Map();
    private _musicSounds: Map<string, Sound> = new Map();
    private _isInitialized: boolean = false;

    constructor(scene: Scene) {
        this._scene = scene;
        AudioManager._instance = this;

        console.log("[AudioManager] Initialisation via AudioEngineV2...");
        this._setupAudioV2();
    }

    private async _setupAudioV2(): Promise<void> {
        try {
            this._audioEngine = await CreateAudioEngineAsync();

            // Création des bus (Méthodes d'instance v8)
            this._sfxBus = await this._audioEngine.createBusAsync("sfxBus");
            this._musicBus = await this._audioEngine.createBusAsync("musicBus");
            this._envBus = await this._audioEngine.createBusAsync("envBus");

            this._sfxBus.volume = 1.0;
            this._musicBus.volume = 0.4;
            this._envBus.volume = 0.5;

            const unlock = async () => {
                if (this._audioEngine) {
                    await this._audioEngine.unlockAsync();

                    if (!this._isInitialized) {
                        this._isInitialized = true;
                        console.log(
                            "%c[AudioManager] ✅ AudioEngine V2 Opérationnel.",
                            "color: #4CAF50; font-weight: bold;",
                        );
                        await this._init();
                    }
                }
                ["click", "touchstart", "keydown"].forEach((e) =>
                    window.removeEventListener(e, unlock),
                );
            };

            ["click", "touchstart", "keydown"].forEach((e) =>
                window.addEventListener(e, unlock),
            );
        } catch (e) {
            console.error("[AudioManager] Erreur Setup V2:", e);
        }
    }

    public static getInstance(): AudioManager {
        if (!AudioManager._instance)
            throw new Error("AudioManager non initialisé.");
        return AudioManager._instance;
    }

    private _getValidUrl(url: string): string {
        let cleanUrl = url;
        if (cleanUrl.startsWith("./")) cleanUrl = cleanUrl.substring(1);
        if (!cleanUrl.startsWith("/")) cleanUrl = "./" + cleanUrl;
        return cleanUrl;
    }

    private async _init(): Promise<void> {
        if (!this._audioEngine) return;

        // Chargement des SFX
        for (const [key, config] of Object.entries(AUDIO_CONFIG.SFX)) {
            const casted = config as any;
            const urls = casted.urls || [casted.url];

            const sounds = await Promise.all(
                urls.map(async (u: string) => {
                    return await this._audioEngine.createSoundAsync(
                        key,
                        this._getValidUrl(u),
                        {
                            scene: this._scene,
                            outBus: this._sfxBus,
                            spatialEnabled: true,
                            volume: casted.volume ?? 1.0,
                        },
                    );
                }),
            );
            this._sfxSounds.set(key, sounds.length > 1 ? sounds : sounds[0]);
        }

        // Chargement des Musiques
        for (const [key, url] of Object.entries(AUDIO_CONFIG.MUSIC)) {
            const targetBus =
                key === "ENVIRONMENT" ? this._envBus : this._musicBus;
            const sound = await this._audioEngine.createSoundAsync(
                key,
                this._getValidUrl(url as string),
                {
                    scene: this._scene,
                    outBus: targetBus,
                    loop: true,
                    volume: 1.0,
                },
            );
            this._musicSounds.set(key, sound);
        }

        console.log(
            "%c[AudioManager] 🎊 Chargement Audio Terminé.",
            "color: #ff9800; font-weight: bold;",
        );
    }

    public playSfx(
        name: SfxName,
        pos?: Vector3,
        pitchRange: number = 0.15,
    ): void {
        const entry = this._sfxSounds.get(name);
        if (!entry) return;
        const sound = Array.isArray(entry)
            ? entry[Math.floor(Math.random() * entry.length)]
            : entry;

        if (sound) {
            // Mise à jour de la position spatiale (V2)
            if (pos && (sound as any).spatial) {
                (sound as any).spatial.position = pos;
            }

            // On utilise la méthode si la propriété directe est rejetée par TS
            const rate = Scalar.RandomRange(1 - pitchRange, 1 + pitchRange);
            if (typeof (sound as any).setPlaybackRate === "function") {
                sound.setPlaybackRate(rate);
            } else {
                (sound as any).playbackRate = rate;
            }

            if (sound.isPlaying) sound.stop();
            sound.play();
        }
    }

    public playMusic(name: MusicName): void {
        const music = this._musicSounds.get(name);
        if (music && !music.isPlaying) {
            music.play();
        }
    }
}
