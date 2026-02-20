import type { State } from "../interfaces/State";

export abstract class BaseState<T> implements State<T> {
    public abstract readonly name: string;

    /** Temps écoulé depuis l'entrée dans cet état (en secondes) */
    protected timeInState: number = 0;

    /**
     * Logique de base à l'entrée
     * On utilise "public" pour l'interface, mais on peut appeler un hook interne
     */
    public onEnter(owner: T): void {
        this.timeInState = 0;
        console.log(`[State] Entering: ${this.name}`);
        this.handleEnter(owner);
    }

    /**
     * Logique de base à chaque frame
     */
    public onUpdate(owner: T, dt: number): void {
        this.timeInState += dt;
        this.handleUpdate(owner, dt);
    }

    /**
     * Logique de base à la sortie
     */
    public onExit(owner: T): void {
        console.log(`[State] Exiting: ${this.name}`);
        this.handleExit(owner);
    }

    /** Hooks à surcharger dans les classes filles */
    protected handleEnter(_owner: T): void { }
    protected abstract handleUpdate(owner: T, dt: number): void;
    protected handleExit(_owner: T): void { }
}