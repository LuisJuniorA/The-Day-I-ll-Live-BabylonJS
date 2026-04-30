export type PlayerAction =
    | "left"
    | "right"
    | "jump"
    | "attack"
    | "interact"
    | "switch";

export class InputConfig {
    public static AZERTY: Record<PlayerAction, string[]> = {
        left: ["q", "arrowleft"],
        right: ["d", "arrowright"],
        jump: [" "],
        attack: ["k"],
        interact: ["e"],
        switch: ["r"],
    };

    public static QWERTY: Record<PlayerAction, string[]> = {
        left: ["a", "arrowleft"],
        right: ["d", "arrowright"],
        jump: [" "],
        attack: ["k"],
        interact: ["e"],
        switch: ["r"],
    };

    // La configuration active (par défaut AZERTY)
    public static current: Record<PlayerAction, string[]> = {
        ...InputConfig.AZERTY,
    };

    public static load(): void {
        const saved = localStorage.getItem("player_input_config");
        if (saved) {
            this.current = JSON.parse(saved);
        }
    }

    public static save(): void {
        localStorage.setItem(
            "player_input_config",
            JSON.stringify(this.current),
        );
    }

    public static setKey(action: PlayerAction, key: string): void {
        // On remplace la touche principale, on peut garder les flèches en bonus
        const isArrow = key.includes("arrow");
        this.current[action] = isArrow ? [key] : [key, "arrow" + action];
        this.save();
    }
}
