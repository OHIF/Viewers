import type { Types } from '@cornerstonejs/core';

/**
 * Represents a position presentation in a viewport.
 */
export type PositionPresentation = {
  id: string;
  viewportType: string;
  initialImageIndex: number;
  viewUp: Types.Point3;
  viewPlaneNormal: Types.Point3;
  zoom?: number;
  pan?: Types.Point2;
};

/**
 * Represents a LUT presentation in a stack viewport.
 */
export interface LutPresentation extends Types.StackViewportProperties {
  id: string;
  viewportType: string;
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
