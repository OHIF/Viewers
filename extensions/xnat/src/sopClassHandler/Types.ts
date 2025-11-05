/**
 * Type definitions for SOP Class Handler
 * Extracted from getSopClassHandlerModule.tsx
 */

export interface XNATSeriesMetadata {
    [studyInstanceUID: string]: {
        PatientID?: string;
        PatientName?: string;
        StudyDate?: string;
        StudyTime?: string;
        StudyDescription?: string;
        series: Array<{
            SeriesInstanceUID: string;
            SeriesDescription?: string;
            SeriesNumber?: string;
            SeriesDate?: string;
            SeriesTime?: string;
            Modality?: string;
            StudyInstanceUID: string;
            PatientID?: string;
            PatientName?: string;
            StudyDate?: string;
            StudyTime?: string;
            StudyDescription?: string;
        }>;
    };
}

export interface ServicesAppContext {
    xnatSeriesMetadata?: XNATSeriesMetadata;
    [key: string]: any;
}

export interface ServicesManager {
    services: {
        AppContext?: ServicesAppContext;
        [key: string]: any;
    };
    getActiveDataSource: () => Array<any>;
}

export interface ExtensionManager {
    getModuleEntry: (moduleName: string) => any;
    getActiveDataSource: () => Array<any>;
    [key: string]: any;
}

export interface AppConfig {
    [key: string]: any;
}

export interface AppContextType {
    extensionManager?: ExtensionManager;
    appConfig?: AppConfig;
    servicesManager?: ServicesManager;
    [key: string]: any;
}

export interface DisplaySetInfo {
    isDynamicVolume: boolean;
    value: boolean;
    averageSpacingBetweenFrames: number | null;
    dynamicVolumeInfo: any;
}

export interface DisplaySetAttributes {
    SeriesDate?: string;
    SeriesTime?: string;
    SeriesInstanceUID?: string;
    StudyInstanceUID?: string;
    SeriesNumber?: number;
    SeriesDescription?: string;
    Modality?: string;
    PatientID?: string;
    PatientName?: string;
    StudyDate?: string;
    StudyTime?: string;
    StudyDescription?: string;
    volumeLoaderSchema?: string;
    displaySetInstanceUID?: string;
    FrameRate?: any;
    SOPClassUID?: string;
    isMultiFrame?: boolean;
    countIcon?: string;
    numImageFrames?: number;
    SOPClassHandlerId?: string;
    isReconstructable?: boolean;
    messages?: any;
    averageSpacingBetweenFrames?: number | null;
    isDynamicVolume?: boolean;
    dynamicVolumeInfo?: any;
    imageIds?: string[];
    getThumbnailSrc?: any;
    supportsWindowLevel?: boolean;
    FrameOfReferenceUID?: string;
    label?: string;
    sopClassUids?: string[];
    instanceNumber?: number;
    acquisitionDatetime?: string;
}
