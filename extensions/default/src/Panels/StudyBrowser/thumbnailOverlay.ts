import React from 'react';

/** Props given to the `studyBrowser.thumbnailOverlay` component. */
export type ThumbnailOverlayProps = {
  /** The display set the thumbnail shows. */
  displaySet: AppTypes.DisplaySet;
};

/**
 * Whether a `studyBrowser.thumbnailOverlay` customization value is a React
 * component (a function, or a `memo` / `forwardRef` object). Anything else,
 * including the unset default, draws no overlay.
 */
export function isOverlayComponent(
  value: unknown
): value is React.ComponentType<ThumbnailOverlayProps> {
  if (typeof value === 'function') {
    return true;
  }
  // memo / forwardRef components are objects with a `$$typeof` tag; a
  // rendered element (`<Badge />` instead of `Badge`) has one too but is not
  // a component type.
  return (
    typeof value === 'object' &&
    value !== null &&
    !React.isValidElement(value) &&
    typeof (value as { $$typeof?: unknown }).$$typeof === 'symbol'
  );
}

/**
 * The overlay element of one thumbnail: the `studyBrowser.thumbnailOverlay`
 * component given the display set, or undefined when none is customized.
 */
export function renderThumbnailOverlay(
  value: unknown,
  displaySet: AppTypes.DisplaySet
): React.ReactNode | undefined {
  if (!isOverlayComponent(value)) {
    return undefined;
  }
  return React.createElement(value, { displaySet });
}
