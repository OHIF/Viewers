import React, { memo } from 'react';
import { ViewportActionCorners, IconPresentationProvider, ToolButton } from '@ohif/ui-next';
import { Toolbar } from '@ohif/extension-default/src/Toolbar/Toolbar';
import { ButtonLocation } from '@ohif/core/src/services/ToolBarService/ToolbarService';
import { useViewportHover } from '../hooks';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCornersComponent({ viewportId }: OHIFViewportActionCornersProps) {
  // Use the viewport hover hook to track if viewport is hovered or active
  const { isHovered, isActive } = useViewportHover(viewportId);

  const shouldShowCorners = isHovered || isActive;

  if (!shouldShowCorners) {
    return null;
  }

  return (
    <IconPresentationProvider
      size="medium"
      IconContainer={ToolButton}
      containerProps={{
        size: 'tiny',
        className: 'font-normal text-primary hover:bg-primary/25',
      }}
    >
      <ViewportActionCorners.Container>
        <ViewportActionCorners.TopLeft>
          <Toolbar
            buttonSection="viewportActionMenu.topLeft"
            viewportId={viewportId}
            location={ButtonLocation.TopLeft}
          />
        </ViewportActionCorners.TopLeft>
        <ViewportActionCorners.TopMiddle>
          <Toolbar
            buttonSection="viewportActionMenu.topMiddle"
            viewportId={viewportId}
            location={ButtonLocation.TopMiddle}
          />
        </ViewportActionCorners.TopMiddle>
        <ViewportActionCorners.TopRight>
          <Toolbar
            buttonSection="viewportActionMenu.topRight"
            viewportId={viewportId}
            location={ButtonLocation.TopRight}
          />
        </ViewportActionCorners.TopRight>
        <ViewportActionCorners.LeftMiddle>
          <Toolbar
            buttonSection="viewportActionMenu.leftMiddle"
            viewportId={viewportId}
            location={ButtonLocation.LeftMiddle}
          />
        </ViewportActionCorners.LeftMiddle>
        <ViewportActionCorners.RightMiddle>
          <Toolbar
            buttonSection="viewportActionMenu.rightMiddle"
            viewportId={viewportId}
            location={ButtonLocation.RightMiddle}
          />
        </ViewportActionCorners.RightMiddle>
        <ViewportActionCorners.BottomLeft>
          <Toolbar
            buttonSection="viewportActionMenu.bottomLeft"
            viewportId={viewportId}
            location={ButtonLocation.BottomLeft}
          />
        </ViewportActionCorners.BottomLeft>
        <ViewportActionCorners.BottomMiddle>
          <Toolbar
            buttonSection="viewportActionMenu.bottomMiddle"
            viewportId={viewportId}
            location={ButtonLocation.BottomMiddle}
          />
        </ViewportActionCorners.BottomMiddle>
        <ViewportActionCorners.BottomRight>
          <Toolbar
            buttonSection="viewportActionMenu.bottomRight"
            viewportId={viewportId}
            location={ButtonLocation.BottomRight}
          />
        </ViewportActionCorners.BottomRight>
      </ViewportActionCorners.Container>
    </IconPresentationProvider>
  );
}

const OHIFViewportActionCorners = memo(OHIFViewportActionCornersComponent);

export default OHIFViewportActionCorners;
