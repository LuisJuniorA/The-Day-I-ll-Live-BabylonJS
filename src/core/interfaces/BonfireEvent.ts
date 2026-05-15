import { Observable } from "@babylonjs/core";

// BonfireEvent.ts
export interface StatUpgradeRequest {
    statId: string;
    costInPoints: number;
}

export interface BonfireData {
    stats: any;
    availablePoints: number;
    currency: number;
}

export const OnOpenBonfire = new Observable<void>();
export const OnRequestStatUpgrade = new Observable<StatUpgradeRequest>();
export const OnStatPointsChanged = new Observable<number>();
