import { Observable } from "@babylonjs/core";

export interface CurrencyEvent {
    currentAmount: number;
    delta: number; // Pour savoir si on a gagné ou perdu
}

export const OnCurrencyChanged = new Observable<CurrencyEvent>();
