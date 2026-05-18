export interface PauseConfig {
    segmentId: string;
    segmentName: string;
    duration: number;
}

export interface GlobalSettings {
    convoyName: string;
    departureDate: string;
    departureTime: string;
    speedPercentage: number;
    minSegmentDuration: number;
    maxSegmentDuration: number;
    pauseConfigs: PauseConfig[];
}

export const DEFAULT_PAUSE_DURATION = 30;
