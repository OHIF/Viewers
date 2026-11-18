import React from 'react';
import { isOverlayComponent, renderThumbnailOverlay } from './thumbnailOverlay';

describe('isOverlayComponent', () => {
  it('accepts function, memo and forwardRef components', () => {
    const Badge = () => null;
    expect(isOverlayComponent(Badge)).toBe(true);
    expect(isOverlayComponent(React.memo(Badge))).toBe(true);
    expect(isOverlayComponent(React.forwardRef(() => null))).toBe(true);
  });

  it('rejects the unset default and other values', () => {
    expect(isOverlayComponent(undefined)).toBe(false);
    expect(isOverlayComponent(null)).toBe(false);
    expect(isOverlayComponent({ id: 'not-a-component' })).toBe(false);
    expect(isOverlayComponent('Badge')).toBe(false);
  });

  it('renders the component with the display set, or nothing when unset', () => {
    const Badge = ({ displaySet }) => displaySet.SeriesNumber;
    const displaySet = { SeriesNumber: 4 } as never;
    const element = renderThumbnailOverlay(Badge, displaySet) as React.ReactElement;
    expect(element.type).toBe(Badge);
    expect(element.props).toEqual({ displaySet });
    expect(renderThumbnailOverlay(undefined, displaySet)).toBeUndefined();
  });
});
