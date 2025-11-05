import { Types } from '@ohif/core';

export type HangingProtocolParams = {
    protocolId?: string;
    stageIndex?: number;
    activeStudyUID?: string;
    StudyInstanceUID?: string;
    stageId?: string;
    reset?: boolean;
};

export interface NavigateHistory {
    to: string;
    options?: {
        replace?: boolean;
    };
}

export type UpdateViewportDisplaySetParams = {
    direction: number;
    excludeNonImageModalities?: boolean;
};

export interface PromptResult {
    action: number;
    value: string;
    dataSourceName: string;
}
