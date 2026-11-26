import React, { memo } from 'react';
import { ViewportActionCorners, IconPresentationProvider, ToolButton } from '@ohif/ui-next';
import { Toolbar } from '@ohif/extension-default/src/Toolbar/Toolbar';
import { ButtonLocation } from '@ohif/core/src/services/ToolBarService/ToolbarService';
import { useViewportHover } from '../hooks';
import FidelityIndicator from './FidelityIndicator';

export type OHIFViewportActionCornersProps = {
  viewportId: string;
};

function OHIFViewportActionCornersComponent({ viewportId }: OHIFViewportActionCornersProps) {
  // Use the viewport hover hook to track if viewport is hovered or active
  const { isHovered, isActive } = useViewportHover(viewportId);

  const shouldShowCorners = isHovered || isActive;

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
          {shouldShowCorners && (
            <Toolbar
              buttonSection="viewportActionMenu.topLeft"
              viewportId={viewportId}
              location={ButtonLocation.TopLeft}
            />
          )}
        </ViewportActionCorners.TopLeft>
        <ViewportActionCorners.TopMiddle>
          {shouldShowCorners && (
            <Toolbar
              buttonSection="viewportActionMenu.topMiddle"
              viewportId={viewportId}
              location={ButtonLocation.TopMiddle}
            />
          )}
        </ViewportActionCorners.TopMiddle>
        <ViewportActionCorners.TopRight>
          {shouldShowCorners && (
            <Toolbar
              buttonSection="viewportActionMenu.topRight"
              viewportId={viewportId}
              location={ButtonLocation.TopRight}
            />
          )}
          {/* A status, not a control: shows without hover or focus (VF-VIS-2, VF-VIS-3). */}
          <FidelityIndicator viewportId={viewportId} />
        </ViewportActionCorners.TopRight>
        <ViewportActionCorners.LeftMiddle>
          {shouldShowCorners && (
            <Toolbar
              buttonSection="viewportActionMenu.leftMiddle"
              viewportId={viewportId}
              location={ButtonLocation.LeftMiddle}
            />
          )}
        </ViewportActionCorners.LeftMiddle>
        <ViewportActionCorners.RightMiddle>
          {shouldShowCorners && (
            <Toolbar
              buttonSection="viewportActionMenu.rightMiddle"
              viewportId={viewportId}
              location={ButtonLocation.RightMiddle}
            />
          )}
        </ViewportActionCorners.RightMiddle>
        <ViewportActionCorners.BottomLeft>
          {shouldShowCorners && (
            <Toolbar
              buttonSection="viewportActionMenu.bottomLeft"
              viewportId={viewportId}
              location={ButtonLocation.BottomLeft}
            />
          )}
        </ViewportActionCorners.BottomLeft>
        <ViewportActionCorners.BottomMiddle>
          {shouldShowCorners && (
            <Toolbar
              buttonSection="viewportActionMenu.bottomMiddle"
              viewportId={viewportId}
              location={ButtonLocation.BottomMiddle}
            />
          )}
        </ViewportActionCorners.BottomMiddle>
        <ViewportActionCorners.BottomRight>
          {shouldShowCorners && (
            <Toolbar
              buttonSection="viewportActionMenu.bottomRight"
              viewportId={viewportId}
              location={ButtonLocation.BottomRight}
            />
          )}
        </ViewportActionCorners.BottomRight>
      </ViewportActionCorners.Container>
    </IconPresentationProvider>
  );
}

const OHIFViewportActionCorners = memo(OHIFViewportActionCornersComponent);

export default OHIFViewportActionCorners;
