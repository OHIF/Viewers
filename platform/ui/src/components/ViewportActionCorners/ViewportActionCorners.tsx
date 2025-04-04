import classNames from 'classnames';
import React from 'react';
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

const commonClasses = 'pointer-events-auto flex items-center gap-1';
const classes = {
  [ViewportActionCornersLocations.topLeft]: classNames(
    commonClasses,
    'absolute top-[4px] left-[0px] pl-[4px]'
  ),
  [ViewportActionCornersLocations.topRight]: classNames(
    commonClasses,
    'absolute top-[4px] right-[4px] right-viewport-scrollbar'
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

/**
 * A component that renders various action items/components to each corner of a viewport.
 * The position of each corner's components is such that a single row of components are
 * rendered absolutely without intersecting the ViewportOverlay component.
 * Note that corner components are passed as an object mapping each corner location
 * to an array of components for that location. The components in each array are
 * rendered from left to right in the order that they appear in the array.
 */
function ViewportActionCorners({ cornerComponents }: ViewportActionCornersProps) {
  if (!cornerComponents) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute h-full w-full select-none"
      onDoubleClick={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {Object.entries(cornerComponents).map(([location, locationComponents]) => {
        return (
          <div
            key={location}
            className={classNames(classes[location])}
          >
            {locationComponents.map(componentInfo => {
              return <div key={componentInfo.id}>{componentInfo.component}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default ViewportActionCorners;
