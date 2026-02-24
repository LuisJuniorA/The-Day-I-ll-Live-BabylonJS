import { TransformNode } from "@babylonjs/core";
import { Observable } from "@babylonjs/core";

export interface Interactable {
    readonly transform: TransformNode; interactionRange: number;
    setProximityState(isNear: boolean): void;
    onInteract(): void;
}

export interface InteractionEvent {
    interactable: Interactable | null;
    isNear: boolean;
}

export const OnInteractionAvailable = new Observable<InteractionEvent>();

export function isInteractableEntity(entity: any): entity is Interactable {
    return "setProximityState" in entity && "interactionRange" in entity;
}