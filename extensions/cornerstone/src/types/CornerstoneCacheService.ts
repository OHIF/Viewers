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
  // The legacy stack/volume data-shape decision (STACK vs ORTHOGRAPHIC/VOLUME_3D),
  // preserved even when `viewportType` is a native Generic type (PLANAR_NEXT) that
  // collapses both. Consumers that must distinguish stack from volume content
  // (data re-build on invalidation, orientation markers) read this instead of
  // `viewportType`, which is ambiguous on the native path. See migration plan §4.7.
  dataShapeType?: Enums.ViewportType;
  data: StackData[];
};

type VolumeViewportData = {
  viewportType: Enums.ViewportType;
  /** See StackViewportData.dataShapeType. */
  dataShapeType?: Enums.ViewportType;
  data: VolumeData[];
};

export type { StackViewportData, VolumeViewportData, StackData, VolumeData };
