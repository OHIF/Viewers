import { createElement } from 'react';
import { render } from '@testing-library/react';

import { Thumbnail } from './Thumbnail';
import { TooltipProvider } from '../Tooltip';

// JSX needs a .tsx file, which the jest projects do not pick up, so the element
// is built directly - as the hook tests in @ohif/core do.  The thumbnail puts
// its description in a tooltip, which radix requires a provider for.
const renderThumbnail = (overrides = {}) =>
  render(
    createElement(
      TooltipProvider,
      null,
      createElement(Thumbnail, {
        displaySetInstanceUID: 'ds1',
        description: 'Report',
        seriesNumber: 5,
        numInstances: 3,
        modality: 'SR',
        isActive: false,
        isDraggable: false,
        onClick: () => {},
        onDoubleClick: () => {},
        ...overrides,
      })
    )
  );

// The label and value share the innermost element; an icon sits beside them, and
// contributes its own text in jsdom, so read past it.
const valueText = (element: Element | null | undefined) =>
  element?.querySelector(':scope > div > div')?.textContent;

const detailText = (container: HTMLElement, id: string) =>
  valueText(container.querySelector(`[data-cy="thumbnail-detail-${id}"]`));

const detailTexts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-cy^="thumbnail-detail-"]')).map(valueText);

describe('Thumbnail', () => {
  describe.each(['thumbnails', 'list'])('%s preset', viewPreset => {
    // The detail line has always read `S:<series number>` and the instance
    // count, and it still has to when no `details` are supplied - which is what
    // the `studyBrowser.thumbnailDetails` customization defaults to.
    it('shows the series number and the instance count by default', () => {
      const { container } = renderThumbnail({ viewPreset });

      expect(detailText(container, 'SeriesNumber')).toBe('S:5');
      expect(detailText(container, 'InstanceCount')).toBe('3');
    });

    it('shows the supplied details instead, in order', () => {
      const details = [
        { id: 'SeriesNumber', label: 'S:', value: '5' },
        { id: 'InstanceCount', value: '3', iconName: 'InfoSeries' },
        { id: 'InstanceDateTime', value: '19-Aug-2026 14:30', title: 'Created' },
      ];

      const { container } = renderThumbnail({ viewPreset, details });

      expect(detailTexts(container)).toEqual(['S:5', '3', '19-Aug-2026 14:30']);
    });

    it('leaves the detail line empty when there are no details', () => {
      const { container } = renderThumbnail({ viewPreset, details: [] });

      expect(detailTexts(container)).toEqual([]);
    });
  });
});
