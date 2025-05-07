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

  if (!state.viewports[viewportId]) {
    return null;
  }

  const components = state.viewports[viewportId];

  const renderCorner = (location: ViewportActionCornersLocations, CornerComponent) => {
    const cornerComponents = components[location];
    if (!cornerComponents?.length) {
      return null;
    }

    return (
      <CornerComponent>
        {cornerComponents.map(componentInfo => (
          <div
            key={componentInfo.id}
            className={componentInfo.disabled ? 'pointer-events-none opacity-50' : undefined}
          >
            {componentInfo.component}
          </div>
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
