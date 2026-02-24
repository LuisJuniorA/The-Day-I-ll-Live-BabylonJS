export class InputBufferManager {
    private _buffers: Map<string, number> = new Map();
    private readonly _defaultDuration: number = 0.2; // 200ms par défaut

    /** Enregistre une intention d'action */
    public trigger(action: string, duration: number = this._defaultDuration): void {
        this._buffers.set(action, duration);
    }

    /** Vérifie si une action est encore dans le buffer */
    public isActive(action: string): boolean {
        const time = this._buffers.get(action) || 0;
        return time > 0;
    }

    /** Consomme l'action (pour éviter qu'elle ne se déclenche deux fois) */
    public consume(action: string): void {
        this._buffers.set(action, 0);
    }

    /** À appeler dans le update du Player */
    public update(dt: number): void {
        for (const [action, time] of this._buffers.entries()) {
            if (time > 0) {
                this._buffers.set(action, time - dt);
            }
        }
    }
}