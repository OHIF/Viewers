import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

/**
 * A small container that can render multiple "corner" items (like icons, status)
 * in each corner of the viewport: top-left, top-right, bottom-left, bottom-right.
 */
export enum ViewportActionCornersLocations {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}

const commonClasses = 'pointer-events-auto flex items-center gap-1';
const locationClasses = {
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

function ViewportActionCorners({ cornerComponents }) {
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
      {Object.entries(cornerComponents).map(([location, locationArray]) => (
        <div
          key={location}
          className={locationClasses[location]}
        >
          {locationArray.map(componentInfo => (
            <div key={componentInfo.id}>{componentInfo.component}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

ViewportActionCorners.propTypes = {
  cornerComponents: PropTypes.object.isRequired,
};

export { ViewportActionCorners };
