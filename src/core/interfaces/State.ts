export interface State<T> {
    /** Nom de l'état (utile pour le debug) */
    readonly name: string;

    /** Appelé une seule fois quand on entre dans l'état */
    onEnter(owner: T): void;

    /** Appelé à chaque frame (60fps) */
    onUpdate(owner: T, dt: number): void;

    /** Appelé juste avant de changer d'état */
    onExit(owner: T): void;
}
