import type { State } from "../interfaces/State";

export abstract class BaseState<T> implements State<T> {
    public abstract readonly name: string;
    protected timeInState: number = 0;

    public onEnter(owner: T): void {
        this.timeInState = 0;
        console.log(`[FSM] Enter: ${this.name}`);
        this.handleEnter(owner);
    }

    public onUpdate(owner: T, dt: number): void {
        this.timeInState += dt;
        this.handleUpdate(owner, dt);
    }

    public onExit(owner: T): void {
        console.log(`[FSM] Exit: ${this.name}`);
        this.handleExit(owner);
    }

    protected handleEnter(_owner: T): void { }
    protected abstract handleUpdate(owner: T, dt: number): void;
    protected handleExit(_owner: T): void { }
}