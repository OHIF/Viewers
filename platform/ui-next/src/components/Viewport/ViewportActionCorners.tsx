import React, { useState } from 'react';
import classNames from 'classnames';
import { Button } from '../Button';
import Icons from '../Icons';
import { ViewportActionCornersProps } from '../../types/ViewportActionCornersTypes';
import { cn } from '../..';

/**
 * A small container that can render multiple "corner" items (like icons, status)
 * in each corner of the viewport: top-left, top-right, bottom-left, bottom-right.
 * Supports collapsing/expanding items when there are many.
 */
export enum ViewportActionCornersLocations {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}

const commonClasses = 'pointer-events-auto flex items-center';
const locationClasses = {
  [ViewportActionCornersLocations.topLeft]: classNames(
    commonClasses,
    'absolute top-[4px] left-[0px] pl-[4px]'
  ),
  [ViewportActionCornersLocations.topRight]: classNames(
    commonClasses,
    'absolute top-[4px] right-[16px] right-viewport-scrollbar'
  ),
  [ViewportActionCornersLocations.bottomLeft]: classNames(
    commonClasses,
    'absolute bottom-[4px] left-[0px] pl-[4px]'
  ),
  [ViewportActionCornersLocations.bottomRight]: classNames(
    commonClasses,
    'absolute bottom-[4px] right-[0px] right-viewport-scrollbar'
  ),
};

// Default number of visible items per corner before collapsing
const DEFAULT_VISIBLE_ITEMS = 2;

function ViewportActionCorners({
  cornerComponents,
  visibleItemsPerCorner = DEFAULT_VISIBLE_ITEMS,
  isActiveViewport,
}: ViewportActionCornersProps) {
  const [expandedCorners, setExpandedCorners] = useState<Record<string, boolean>>({});

  if (!cornerComponents) {
    return null;
  }

  const toggleCornerExpand = (location: string | number, e: React.MouseEvent) => {
    // Stop propagation to prevent interactions with underlying elements
    e.stopPropagation();
    e.preventDefault();

    setExpandedCorners(prev => ({
      ...prev,
      [location]: !prev[location],
    }));
  };

  return (
    <div
      className="pointer-events-none absolute h-full w-full select-none"
      onDoubleClick={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {Object.entries(cornerComponents).map(([location, locationArray]) => {
        const isExpanded = expandedCorners[location] || false;
        const hasMoreItems = locationArray.length > visibleItemsPerCorner;

        // For right-side corners, we want to show the more button first
        const isRightSide =
          Number(location) === ViewportActionCornersLocations.topRight ||
          Number(location) === ViewportActionCornersLocations.bottomRight;

        let itemsToShow;
        if (isExpanded) {
          itemsToShow = locationArray;
        } else {
          if (isRightSide) {
            itemsToShow = locationArray.slice(-visibleItemsPerCorner);
          } else {
            itemsToShow = locationArray.slice(0, visibleItemsPerCorner);
          }
        }

        return (
          <div
            key={location}
            className={locationClasses[location]}
          >
            {/* For right-side corners, show the toggle button (either chevron or X) on the left */}
            {isRightSide && hasMoreItems && (
              <div className="mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'text-muted-foreground',
                    isActiveViewport ? 'visible' : 'invisible group-hover/pane:visible'
                  )}
                  onClick={e => toggleCornerExpand(location, e)}
                >
                  {isExpanded ? (
                    <Icons.Close className="h-3 w-3" />
                  ) : (
                    <Icons.ChevronLeft className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}

            {/* Display the actual content items */}
            {itemsToShow.map(componentInfo => (
              <div key={componentInfo.id}>{componentInfo.component}</div>
            ))}

            {/* For left-side corners, show the toggle button (either chevron or X) on the right */}
            {!isRightSide && hasMoreItems && (
              <div className="ml-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'text-muted-foreground',
                    isActiveViewport ? 'visible' : 'invisible group-hover/pane:visible'
                  )}
                  onClick={e => toggleCornerExpand(location, e)}
                >
                  {isExpanded ? (
                    <Icons.Close className="h-3 w-3" />
                  ) : (
                    <Icons.ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { ViewportActionCorners };
