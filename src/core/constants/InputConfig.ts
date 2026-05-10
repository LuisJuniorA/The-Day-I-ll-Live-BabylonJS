export type PlayerAction =
    | "left"
    | "right"
    | "up"
    | "down"
    | "jump"
    | "attack"
    | "cast" // <--- Ajouté
    | "inventory"
    | "interact"
    | "switch";

export class InputConfig {
    public static AZERTY: Record<PlayerAction, string[]> = {
        left: ["q", "arrowleft"],
        right: ["d", "arrowright"],
        up: ["z", "arrowup"],
        down: ["s", "arrowdown"],
        jump: [" "],
        attack: ["k"],
        cast: ["i"],
        inventory: ["e"],
        interact: ["f"],
        switch: ["r"],
    };

    public static QWERTY: Record<PlayerAction, string[]> = {
        left: ["a", "arrowleft"],
        right: ["d", "arrowright"],
        up: ["w", "arrowup"],
        down: ["s", "arrowdown"],
        jump: [" "],
        attack: ["k"],
        cast: ["i"],
        inventory: ["e"],
        interact: ["f"],
        switch: ["r"],
    };

    // La configuration active
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

    public static getKeyLabel(action: PlayerAction): string {
        const keys = this.current[action];
        if (!keys || keys.length === 0) return "?";
        return keys[0].toUpperCase();
    }

    public static setKey(action: PlayerAction, key: string): void {
        // On remplace la touche principale, on peut garder les flèches en bonus
        const isArrow = key.includes("arrow");
        this.current[action] = isArrow ? [key] : [key, "arrow" + action];
        this.save();
    }
}
