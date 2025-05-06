import React from 'react';
import {
  useViewportActionCorners,
  ViewportActionCorners,
  ViewportActionCornersLocations,
} from '@ohif/ui-next';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCorners({ viewportId }: OHIFViewportActionCornersProps) {
  const [state] = useViewportActionCorners();

  if (!state.components[viewportId]) {
    return null;
  }

  const components = state.components[viewportId];

  const renderCorner = (location: ViewportActionCornersLocations, CornerComponent) => {
    const cornerComponents = components[location];
    if (!cornerComponents?.length) {
      return null;
    }

    return (
      <CornerComponent>
        {cornerComponents.map(componentInfo => (
          <div key={componentInfo.id}>{componentInfo.component}</div>
        ))}
      </CornerComponent>
    );
  };

  return (
    <ViewportActionCorners.Container>
      {renderCorner(ViewportActionCornersLocations.topLeft, ViewportActionCorners.TopLeft)}
      {renderCorner(ViewportActionCornersLocations.topRight, ViewportActionCorners.TopRight)}
      {renderCorner(ViewportActionCornersLocations.bottomLeft, ViewportActionCorners.BottomLeft)}
      {renderCorner(ViewportActionCornersLocations.bottomRight, ViewportActionCorners.BottomRight)}
    </ViewportActionCorners.Container>
  );
}

export default OHIFViewportActionCorners;
