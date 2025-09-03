import { Url } from 'url';

export type ServerConfigs = {
  PACS_type: 'cloud' | 'local';
  name: string;
  wadoUriRoot: string;
  qidoRoot: string;
  wadoRoot: string;
  qidoSupportsIncludeField: boolean;
  imageRendering: string;
  thumbnailRendering: string;
  enableStudyLazyLoad: boolean;
  requestOptions: {
    auth: string;
    requestFromBrowser: boolean;
  };
};
//** Type for Annotation Data  */
export type MetaData = {
  toolName: string;
  viewPlaneNormal: [];
  viewUp: [];
  FrameOfReferenceUID: string;
  referencedImageId: string;
  cameraFocalPoint: [];
  sliceIndex: number;
};

export type StatsArray = {
  name: string;
  label: string;
  value: number;
  unit: unknown;
};

export type Data = {
  label: string;
  handles: {
    points: number[][];
    textBox: {
      hasMoved: boolean;
      worldPosition: number[];
      worldBoundingBox: {
        topLeft: number[];
        topRight: number[];
        bottomLeft: number[];
        bottomRight: number[];
      };
    };
    activeHandleIndex: unknown;
  };
  cachedStats: {
    [key: string]: {
      Modality: string;
      area: number;
      mean: number;
      stdDev: number;
      max: number;
      statsArray: StatsArray[];
      areaUnit: string;
      //in serialized annotation data pointsInShape property will be eliminated
      pointsInShape?: [];
      modalityUnit: string;
    };
  };
};
export type AnnotationData = {
  invalidated: boolean;
  highlighted: boolean;
  metadata: MetaData;
  data: Data;
  annotationUID: string;
  isLocked: boolean;
  isVisible: boolean;
};

export type TextBox = {
  hasMoved: true;
  worldPosition: number[];
  worldBoundingBox: {
    topLeft: number[];
    topRight: number[];
    bottomLeft: number[];
    bottomRight: number[];
  };
};

export type Groups = {
  id: number;
  url: Url;
  name: string;
};

export type UserInfo = {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  groupConfig: ServerConfigs[];
  email: string;
};

//** Type for Annotation Measurement Data  */

export type Measurement = {
  uid: string;
  SOPInstanceUID: string;
  FrameOfReferenceUID: string;
  points: number[][];
  textBox: TextBox;
  metadata: MetaData;
  referenceSeriesUID: string;
  referenceStudyUID: string;
  referencedImageId: string;
  frameNumber: number;
  toolName: string;
  displaySetInstanceUID: string;
  label: string;
  displayText: [];
  data: {
    [key: string]: {
      Modality: string;
      area: number;
      mean: number;
      stdDev: number;
      max: number;
      statsArray: StatsArray[];
      areaUnit: string;
      modalityUnit: string;
    };
  };
  type: string;
  source: {
    uid: string;
    name: string;
    version: string;
  };
  modifiedTimestamp: number;
  selected: boolean;
};

export type Study = {
  [key: string]: {
    Value: string[];
    vr: string;
  };
};
export type Studies = Study[];
