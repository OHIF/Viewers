import classNames from 'classnames';
import React, { ReactNode } from 'react';

export enum ViewportActionCornersLocations {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}

export type ViewportActionCornersProps = {
  cornerComponents: Record<ViewportActionCornersLocations, Array<ReactNode>>;
};

const commonClasses = 'pointer-events-auto flex items-center gap-1';
const classes = {
  [ViewportActionCornersLocations.topLeft]: classNames(commonClasses, 'absolute top-[4px]'),
  [ViewportActionCornersLocations.topRight]: classNames(
    commonClasses,
    'absolute top-[4px] right-viewport-scrollbar'
  ),
  [ViewportActionCornersLocations.bottomLeft]: classNames(commonClasses, 'absolute bottom-[4px]'),
  [ViewportActionCornersLocations.bottomRight]: classNames(
    commonClasses,
    'absolute bottom-[4px] right-viewport-scrollbar'
  ),
};

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
      {Object.entries(cornerComponents).map(([location, components]) => {
        return (
          <div
            key={location}
            className={classNames(classes[location])}
          >
            {components.map((comp, index) => {
              return <div key={index}>{comp}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default ViewportActionCorners;
