import React from 'react';
import { ViewportActionCorners, ViewportActionCornersLocations } from '@ohif/ui-next';
import { Toolbar } from '@ohif/extension-default/src/Toolbar/Toolbar';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCorners({ viewportId }: OHIFViewportActionCornersProps) {
  return (
    <ViewportActionCorners.Container>
      <ViewportActionCorners.TopLeft>
        <Toolbar buttonSection="viewportActionMenu.topLeft" />
      </ViewportActionCorners.TopLeft>
      <ViewportActionCorners.TopRight>
        <Toolbar buttonSection="viewportActionMenu.topRight" />
      </ViewportActionCorners.TopRight>
      <ViewportActionCorners.BottomLeft>
        <Toolbar buttonSection="viewportActionMenu.bottomLeft" />
      </ViewportActionCorners.BottomLeft>
      <ViewportActionCorners.BottomRight>
        <Toolbar buttonSection="viewportActionMenu.bottomRight" />
      </ViewportActionCorners.BottomRight>
    </ViewportActionCorners.Container>
  );
}

export default OHIFViewportActionCorners;
