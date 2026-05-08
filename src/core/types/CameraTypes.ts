export interface CameraBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export const CAM_CONFIG = {
    DISTANCE_Z: -18,
    OFFSET_Y: 1.5,
    BIAS_X: 5, // Augmenté (4 -> 6) pour plus d'impact
    BIAS_Y_SIGHT: 4, // Augmenté (5 -> 6)
    LERP_X: 0.08, // Un poil plus lent pour que le Bias "tire" la vue
    LERP_Y_UP: 0.08,
    LERP_Y_DOWN: 0.25,
    VIEW_HALF_W: 10,
    VIEW_HALF_H: 6,
};
