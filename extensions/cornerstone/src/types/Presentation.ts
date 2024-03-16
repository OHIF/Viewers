import type { Types } from '@cornerstonejs/core';

/**
 * Represents a position presentation in a viewport. This is basically
 * viewport specific camera position and zoom, and not the display set
 */
export type PositionPresentation = {
  id: string;
  viewportType: string;
  presentation: {
    initialImageIndex: number;
    viewUp: Types.Point3;
    viewPlaneNormal: Types.Point3;
    zoom?: number;
    pan?: Types.Point2;
  };
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
  presentation: Record<string, Types.ViewportProperties> | Types.ViewportProperties;
}

/**
 * Presentation can be a PositionPresentation or a LutPresentation.
 */
type Presentation = PositionPresentation | LutPresentation;

/**
 * Viewport presentations object that can contain a positionPresentation
 * and or a lutPresentation.
 */
export type Presentations = {
  positionPresentation?: PositionPresentation;
  lutPresentation?: LutPresentation;
};

export default Presentation;
