import { Observable } from "@babylonjs/core";
import type { Targeting } from "./Targeting";

export interface Interactable extends Targeting {
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

export interface DialogueRequest {
    speakerName: string;
    text: string;
    portraitUrl?: string;
    onComplete: () => boolean;
}

export const OnDialogueRequest = new Observable<DialogueRequest>();
