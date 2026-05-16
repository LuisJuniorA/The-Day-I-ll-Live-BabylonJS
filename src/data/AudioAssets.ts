export const AUDIO_CONFIG = {
    SFX: {
        // SWING : Très faible d'après Python (8.71x et 5.44x), on booste significativement
        SWORD_SWING: {
            urls: [
                "./assets/audio/sfx/swing_0.mp3",
                "./assets/audio/sfx/swing_1.mp3",
            ],
            volume: 7.0,
        },
        // FOOTSTEP : Un peu fort (0.80x), on réduit légèrement
        FOOTSTEP: {
            urls: [
                "./assets/audio/sfx/footstep_0.ogg",
                "./assets/audio/sfx/footstep_1.ogg",
                "./assets/audio/sfx/footstep_2.ogg",
                "./assets/audio/sfx/footstep_3.ogg",
            ],
            volume: 0.2,
        },
        // HIT & CLICK : Similaires (0.78x)
        HIT: { url: "./assets/audio/sfx/hit.mp3", volume: 0.8 },
        UI_CLICK: { url: "./assets/audio/sfx/ui_click.ogg", volume: 0.4 },
        UI_REBIND_SUCCESS: {
            url: "./assets/audio/sfx/ui_click.ogg",
            volume: 0.4,
        },

        // MONSTER : Énorme (0.35x), on calme le jeu
        MONSTER_ROAR: {
            url: "./assets/audio/sfx/monster_roar.mp3",
            volume: 0.35,
        },
    },
    MUSIC: {
        BOSS: "./assets/audio/music/boss_theme.mp3",
        ENVIRONMENT: "./assets/audio/music/environment.mp3",
        DEATH_THEME: "",
    },
} as const;

export type SfxName = keyof typeof AUDIO_CONFIG.SFX;
export type MusicName = keyof typeof AUDIO_CONFIG.MUSIC;
