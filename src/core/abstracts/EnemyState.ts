import { BaseState } from "./BaseState";
import { Enemy } from "../abstracts/Enemy";
import type { Behavior } from "../interfaces/Behaviors";

export abstract class EnemyState extends BaseState<Enemy> {
    protected _behaviors: Behavior[] = [];

    public addBehavior(behavior: Behavior): this {
        this._behaviors.push(behavior);
        return this;
    }

    public onUpdate(owner: Enemy, dt: number): void {
        this.timeInState += dt;

        for (const behavior of this._behaviors) {
            behavior.update(owner, dt);
        }

        this.handleUpdate(owner, dt);
    }
}
