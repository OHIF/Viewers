/** Store presentation data for either stack viewports or volume viewports */
import { Types } from '@cornerstonejs/core';

export interface BasePresentation {
  id: string;
  properties: Record<string, unknown>;
  initialImageIndex?: number;
  camera: Types.ICamera;
}

export interface StackPresentation extends BasePresentation {
  viewportType: 'stack';
}

export interface VolumePresentation extends BasePresentation {
  viewportType: 'volume';
}

// Currently it seems like the entire presentation state can be shared between
// Stack and Volume, but is setup to allow differences
export type Presentation = StackPresentation | VolumePresentation;

export default Presentation;
