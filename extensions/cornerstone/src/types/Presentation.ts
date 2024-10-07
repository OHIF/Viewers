import type { Types } from '@cornerstonejs/core';

/**
 * Represents a position presentation in a viewport. This is basically
 * viewport specific camera position and zoom, and not the display set
 */
export type PositionPresentation = {
  id: string;
  viewportType: string;
  // The view reference has the basic information as to what image orientation/slice is shown
  viewReference: Types.ViewReference;
  // The position information has the zoom/pan and possibly other related information, but not LUT
  position: Types.ViewPresentation;

  initialImageIndex?: number;
};

/**
 * Represents a LUT presentation in a viewport, and is really related
 * to displaySets and not the viewport itself. So that is why it can
 * be an object with volumeId keys, or a single object with the properties
 * itself
 */
export interface LutPresentation {
  id: string;
  viewportType: string;
  // either a single object with the properties itself or a map of properties with volumeId keys
  properties: Record<string, Types.ViewportProperties> | Types.ViewportProperties;
}

/**
 * Represents a LUT presentation in a viewport, and is really related
 * to displaySets and not the viewport itself. So that is why it can
 * be an object with volumeId keys, or a single object with the properties
 * itself
 */
export interface SegmentationPresentation {
  id: string;
  hydrated: boolean | null;
}

/**
 * Presentation can be a PositionPresentation or a LutPresentation.
 */
type Presentation = PositionPresentation | LutPresentation | SegmentationPresentation;

/**
 * Viewport presentations object that can contain a positionPresentation
 * and or a lutPresentation.
 */
export type Presentations = {
  positionPresentation?: PositionPresentation;
  lutPresentation?: LutPresentation;
  segmentationPresentation?: SegmentationPresentation;
};

export default Presentation;
