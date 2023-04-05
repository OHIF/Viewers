/** Store presentation data for either stack viewports or volume viewports */
import { Types } from '@cornerstonejs/core';
import { Types as UITypes } from '@ohif/ui';

/**
 * Has information on the presentation of the viewport.
 */
export interface Presentation extends Types.StackViewportProperties {
  presentationIds: UITypes.PresentationIds;
  viewportType: string;
  initialImageIndex: number;
  camera: Types.ICamera;
  properties: Types.StackViewportProperties | Types.VolumeViewportProperties;
  zoom?: number;
  pan?: [number, number];
}

export type Presentations = {
  positionPresentation?: Presentation;
  lutPresentation?: Presentation;
};

export default Presentation;
