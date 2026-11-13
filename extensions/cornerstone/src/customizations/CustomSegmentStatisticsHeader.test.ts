import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

const SEGMENTATION_MODIFIED = 'event::segmentation_modified';
const mockVisibility = new Map<string, boolean>();
const mockListeners = new Map<string, Set<(evt) => void>>();
const mockSegmentation = {
  segmentationId: 'seg-1',
  segments: {
    1: { segmentIndex: 1, cachedStats: { namedStats: {} } },
  },
};

const mockSegmentationService = {
  EVENTS: { SEGMENTATION_MODIFIED },
  getSegmentation: jest.fn(() => mockSegmentation),
  addOrUpdateSegmentation: jest.fn(),
  subscribe: jest.fn((event: string, callback: (evt) => void) => {
    if (!mockListeners.has(event)) {
      mockListeners.set(event, new Set());
    }
    mockListeners.get(event).add(callback);
    return { unsubscribe: () => mockListeners.get(event).delete(callback) };
  }),
};

const mockSystem = {
  servicesManager: { services: { segmentationService: mockSegmentationService } },
  commandsManager: { run: jest.fn() },
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('@ohif/core', () => ({
  useSystem: () => mockSystem,
  utils: { roundNumber: value => String(Math.round(value)) },
}));

jest.mock('@cornerstonejs/tools', () => ({
  annotation: {
    visibility: {
      isAnnotationVisible: uid => mockVisibility.get(uid) ?? true,
      setAnnotationVisibility: (uid, visible) => mockVisibility.set(uid, visible),
    },
  },
}));

jest.mock('@ohif/ui-next', () => {
  const ReactMock = require('react');
  const passThrough = ({ children }) => ReactMock.createElement(ReactMock.Fragment, null, children);
  return {
    Separator: () => null,
    Button: ({ dataCY, onClick, children }) =>
      ReactMock.createElement('button', { 'data-cy': dataCY, onClick }, children),
    Tooltip: passThrough,
    TooltipTrigger: passThrough,
    TooltipContent: () => null,
    Icons: {
      ToolBidirectionalSegment: () => null,
      JumpToSlice: () => null,
      Hide: () => ReactMock.createElement('span', { 'data-cy': 'icon-hide' }),
      Show: () => ReactMock.createElement('span', { 'data-cy': 'icon-show' }),
    },
  };
});

import { CustomSegmentStatisticsHeader } from './CustomSegmentStatisticsHeader';

function broadcast(segmentationId: string) {
  act(() => {
    mockListeners.get(SEGMENTATION_MODIFIED)?.forEach(callback => callback({ segmentationId }));
  });
}

function renderHeader() {
  return render(
    React.createElement(CustomSegmentStatisticsHeader, {
      segmentationId: 'seg-1',
      segmentIndex: 1,
    })
  );
}

describe('CustomSegmentStatisticsHeader', () => {
  beforeEach(() => {
    mockVisibility.clear();
    mockListeners.clear();
    mockSegmentation.segments[1].cachedStats = { namedStats: {} };
  });

  it('shows the bidirectional result once the segmentation is modified', () => {
    renderHeader();
    expect(screen.getByText('Compute Largest Bidirectional')).toBeTruthy();

    // What runSegmentBidirectional does: store the stats, then update the segmentation.
    mockSegmentation.segments[1].cachedStats = {
      namedStats: {
        bidirectional: {
          annotationUID: 'bidi-1',
          unit: 'mm',
          value: { maxMajor: 184, maxMinor: 107 },
        },
      },
    };
    broadcast('seg-1');

    expect(screen.queryByText('Compute Largest Bidirectional')).toBeNull();
    expect(screen.getByText('L: 184 mm')).toBeTruthy();
    expect(screen.getByText('W: 107 mm')).toBeTruthy();
  });

  it('ignores modifications of other segmentations', () => {
    renderHeader();
    mockSegmentation.segments[1].cachedStats = {
      namedStats: {
        bidirectional: { annotationUID: 'bidi-1', unit: 'mm', value: { maxMajor: 1, maxMinor: 1 } },
      },
    };
    broadcast('seg-2');

    expect(screen.getByText('Compute Largest Bidirectional')).toBeTruthy();
  });

  it('updates the eye icon when the visibility is toggled', () => {
    mockSegmentation.segments[1].cachedStats = {
      namedStats: {
        bidirectional: {
          annotationUID: 'bidi-1',
          unit: 'mm',
          value: { maxMajor: 184, maxMinor: 107 },
        },
      },
    };
    const { container } = renderHeader();
    expect(container.querySelector('[data-cy="icon-hide"]')).toBeTruthy();

    const toggle = container.querySelector('[data-cy="icon-hide"]').closest('button');
    fireEvent.click(toggle);

    expect(container.querySelector('[data-cy="icon-hide"]')).toBeNull();
    expect(container.querySelector('[data-cy="icon-show"]')).toBeTruthy();
  });
});
