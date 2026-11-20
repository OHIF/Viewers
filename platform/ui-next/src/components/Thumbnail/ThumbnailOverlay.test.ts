import React from 'react';
import { render } from '@testing-library/react';
import { TooltipProvider } from '../Tooltip';
import { Thumbnail } from './Thumbnail';

const renderThumbnail = (props = {}) =>
  render(
    React.createElement(
      TooltipProvider,
      null,
      React.createElement(Thumbnail, {
        displaySetInstanceUID: 'ds-1',
        imageSrc: 'data:image/png;base64,AAAA',
        description: 'Series one',
        modality: 'XA',
        isDraggable: false,
        ...props,
      })
    )
  );

describe('Thumbnail overlay', () => {
  it('draws the overlay over the image', () => {
    const { getByTestId } = renderThumbnail({
      overlay: React.createElement('span', { 'data-testid': 'badge' }, '2'),
    });
    const badge = getByTestId('badge');
    const layer = badge.closest('[data-cy="thumbnail-overlay"]');
    expect(layer).not.toBeNull();
    expect(layer.className).toContain('absolute');
    expect(layer.parentElement.querySelector('img')).not.toBeNull();
  });

  it('draws no overlay layer without one', () => {
    const { container } = renderThumbnail();
    expect(container.querySelector('[data-cy="thumbnail-overlay"]')).toBeNull();
  });
});
