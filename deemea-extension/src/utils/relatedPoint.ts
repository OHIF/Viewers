export interface Point {
    id: number;
    x: number;
    y: number;
    xOrigin: number;
    yOrigin: number;
    name: string;
    lastModificationDate: Date;
    lastModificationUserId?: string;
}

export interface ImagingData {
    id: number;
    isActive: boolean;
    measureName: string;
    isFiltrable: boolean;
    custom: boolean;
    numberOfPoints: number;
    laterality: string;
    unit: string;
    bodyPart: string;
    view: string;
    color: string;
}

export interface RelatedPoint {
    points: Point[];
    imagingData: ImagingData;
    forceHide: boolean
    hide: boolean | null;
    locked: boolean;
    measurementId: number;
}