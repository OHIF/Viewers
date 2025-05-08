import React from 'react';
import { ViewportActionCorners, ViewportActionCornersLocations } from '@ohif/ui-next';
import { Toolbar } from '@ohif/extension-default/src/Toolbar/Toolbar';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCorners({ viewportId }: OHIFViewportActionCornersProps) {
  // const [state] = useViewportActionCorners();

  // if (!state.viewports[viewportId]) {
  //   return null;
  // }

  // const components = state.viewports[viewportId];
  // const { toolbarButtons } = useToolbar({ buttonSection: 'viewportActionMenu.topLeft' });

  const renderCorner = (location: ViewportActionCornersLocations, CornerComponent) => {
    // const cornerComponents = components[location];
    if (!cornerComponents?.length) {
      return null;
    }

    return (
      <CornerComponent>
        {cornerComponents
          .filter(componentInfo => componentInfo.isVisible !== false)
          .map(componentInfo => (
            <div
              key={componentInfo.id}
              className={
                componentInfo.isLocked === true ? 'pointer-events-none opacity-50' : undefined
              }
            >
              {componentInfo.component}
            </div>
          ))}
      </CornerComponent>
    );
  };

  return (
    <ViewportActionCorners.Container>
      <ViewportActionCorners.TopLeft>
        <Toolbar buttonSection="viewportActionMenu.topLeft" />
      </ViewportActionCorners.TopLeft>
      {/* {renderCorner(ViewportActionCornersLocations.topRight, ViewportActionCorners.TopRight)}
      {renderCorner(ViewportActionCornersLocations.bottomLeft, ViewportActionCorners.BottomLeft)}
      {renderCorner(ViewportActionCornersLocations.bottomRight, ViewportActionCorners.BottomRight)} */}
    </ViewportActionCorners.Container>
  );
}

export default OHIFViewportActionCorners;
