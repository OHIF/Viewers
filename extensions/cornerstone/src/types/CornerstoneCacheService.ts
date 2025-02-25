import { Enums, Types } from '@cornerstonejs/core';

type StackData = {
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
  // A composite stack is one created from other display sets - kind of like
  // madeInClient, but specific to indicating that the imageIds can come from
  // different series or even studies.
  isCompositeStack?: boolean;
  imageIds: string[];
  frameRate?: number;
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
  data: StackData[];
};

type VolumeViewportData = {
  viewportType: Enums.ViewportType;
  data: VolumeData[];
};

export type { StackViewportData, VolumeViewportData, StackData, VolumeData };
