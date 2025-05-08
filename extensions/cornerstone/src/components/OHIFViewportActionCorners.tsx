import React from 'react';
import { ViewportActionCorners } from '@ohif/ui-next';
import { Toolbar } from '@ohif/extension-default/src/Toolbar/Toolbar';
import { useViewportHover } from '../hooks';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCorners({ viewportId }: OHIFViewportActionCornersProps) {
  // Use the viewport hover hook to track if viewport is hovered or active
  const { isHovered, isActive } = useViewportHover(viewportId);

  const shouldShowCorners = isHovered || isActive;

  if (!shouldShowCorners) {
    return null;
  }

  return (
    <ViewportActionCorners.Container>
      <ViewportActionCorners.TopLeft>
        <Toolbar
          buttonSection="viewportActionMenu.topLeft"
          viewportId={viewportId}
        />
      </ViewportActionCorners.TopLeft>
      <ViewportActionCorners.TopRight>
        <Toolbar
          buttonSection="viewportActionMenu.topRight"
          viewportId={viewportId}
        />
      </ViewportActionCorners.TopRight>
      <ViewportActionCorners.BottomLeft>
        <Toolbar
          buttonSection="viewportActionMenu.bottomLeft"
          viewportId={viewportId}
        />
      </ViewportActionCorners.BottomLeft>
      <ViewportActionCorners.BottomRight>
        <Toolbar
          buttonSection="viewportActionMenu.bottomRight"
          viewportId={viewportId}
        />
      </ViewportActionCorners.BottomRight>
    </ViewportActionCorners.Container>
  );
}

export default OHIFViewportActionCorners;
