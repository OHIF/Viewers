import type { Types } from '@cornerstonejs/core';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

/**
 * Represents a position presentation in a viewport. This is basically
 * viewport specific camera position and zoom, and not the display set
 */
export type PositionPresentation = {
  viewportType: string;
  // The view reference has the basic information as to what image orientation/slice is shown
  viewReference: Types.ViewReference;
  // The position information has the zoom/pan and possibly other related information, but not LUT
  viewPresentation: Types.ViewPresentation;
  /**
   * Optionals
   */
  initialImageIndex?: number;
  // viewportId helps when hydrating SR or SEG - we can use it to filter
  // presentations to get the one prior to the current viewport and reuse it
  // for viewReference and viewPresentation
  viewportId?: string;
};

/**
 * Represents a LUT presentation in a viewport, and is really related
 * to displaySets and not the viewport itself. So that is why it can
 * be an object with volumeId keys, or a single object with the properties
 * itself
 */
export interface LutPresentation {
  viewportType: string;
  // either a single object with the properties itself or a map of properties with volumeId keys
  properties: Record<string, Types.ViewportProperties> | Types.ViewportProperties;
}

/**
 * Represents a LUT presentation in a viewport, and is really related
 * to displaySets and not the viewport itself. So that is why it can
 * be an object with volumeId keys, or a single object with the properties
 * itself
 *
 * each presentation has a segmentationId and a type and a value for
 * hydrated and config.
 *
 * The hydrated property can be a boolean or null. It's null if the segmentation
 * representation hasn't been created yet. It's true if the representation is
 * currently in the viewport. It's false if the representation was in the viewport
 * but has been removed.
 *
 * Config is the segmentation config, Todo: add stuff here
 */
export type SegmentationPresentationItem = {
  segmentationId: string;
  type: SegmentationRepresentations;
  hydrated: boolean | null;
  config?: unknown;
};

export type SegmentationPresentation = SegmentationPresentationItem[];

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
