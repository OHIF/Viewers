import {
  Enums,
  Types,
} from '@cornerstonejs/core';


type StackData = {
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
  imageIds: string[];
  frameRate?: number;
  isClip?: boolean;
  initialImageIndex?: number | string | null;
};

type VolumeData = {
  studyInstanceUID: string;
  displaySetInstanceUID: string;
  volume?: Types.IVolume;
  imageIds?: string[];
};

 type StackViewportData = {
  viewportType: Enums.ViewportType;
  data: StackData;
};

 type VolumeViewportData = {
  viewportType: Enums.ViewportType;
  data: VolumeData[];
};

export type {
  StackViewportData,
  VolumeViewportData,
  StackData,
  VolumeData,
};
