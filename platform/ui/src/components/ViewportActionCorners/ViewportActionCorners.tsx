import { useServices } from '@ohif/ui';
import { ViewportActionCornersComponentInfo } from '../../types/ViewportActionCornersTypes';

export enum ViewportActionCornersLocations {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}

export type ViewportActionCornersProps = {
  cornerComponents: Record<
    ViewportActionCornersLocations,
    Array<ViewportActionCornersComponentInfo>
  >;
};

/**
 * A component that renders various action items/components to each corner of a viewport.
 * The position of each corner's components is such that a single row of components are
 * rendered absolutely without intersecting the ViewportOverlay component.
 * Note that corner components are passed as an object mapping each corner location
 * to an array of components for that location. The components in each array are
 * rendered from left to right in the order that they appear in the array.
 */
function ViewportActionCorners({ cornerComponents }: ViewportActionCornersProps) {
  const { services } = useServices();
  if (!cornerComponents) {
    return null;
  }

  const Component = services.customizationService.getCustomization('ui.ViewportActionCorner');
  return Component({
    cornerComponents,
  });
}

export default ViewportActionCorners;
