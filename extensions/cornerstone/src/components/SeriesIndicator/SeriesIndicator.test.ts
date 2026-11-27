import React from 'react';
import { act, render } from '@testing-library/react';

const mockEvents = {
  DISPLAY_SETS_ADDED: 'added',
  DISPLAY_SETS_CHANGED: 'changed',
  DISPLAY_SETS_REMOVED: 'removed',
  DISPLAY_SET_ORDER_CHANGED: 'order',
};
const mockListeners: Record<string, Array<() => void>> = {};
let mockDisplaySets = [];
const mockDisplaySetService = {
  EVENTS: mockEvents,
  getDisplaySets: jest.fn(() => [...mockDisplaySets]),
  subscribe: (event: string, callback: () => void) => {
    (mockListeners[event] = mockListeners[event] || []).push(callback);
    return { unsubscribe: jest.fn() };
  },
};

jest.mock('@ohif/core', () => ({
  useSystem: () => ({
    servicesManager: { services: { displaySetService: mockDisplaySetService } },
  }),
}));
jest.mock('@ohif/ui-next', () => ({
  useViewportGrid: () => [
    {
      activeViewportId: 'vp',
      viewports: new Map([['vp', { displaySetInstanceUIDs: ['b'] }]]),
    },
  ],
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

// eslint-disable-next-line import/first
import SeriesIndicator from './SeriesIndicator';

const series = (uid: string, seriesNumber: number) => ({
  displaySetInstanceUID: uid,
  StudyInstanceUID: 'study-1',
  SeriesNumber: seriesNumber,
  Modality: 'CT',
  numImageFrames: 1,
});

describe('SeriesIndicator', () => {
  it('shows the position and updates when display sets arrive or are reordered', () => {
    mockDisplaySets = [series('a', 1), series('b', 2)];
    const { container } = render(React.createElement(SeriesIndicator, { viewportId: 'vp' }));
    expect(container.textContent).toBe('Series2/2 · #2');

    act(() => {
      mockDisplaySets = [series('a', 1), series('b', 2), series('c', 3)];
      mockListeners.added.forEach(callback => callback());
    });
    expect(container.textContent).toBe('Series2/3 · #2');

    act(() => {
      mockDisplaySets = [series('c', 3), series('b', 2), series('a', 1)];
      mockListeners.order.forEach(callback => callback());
    });
    expect(container.textContent).toBe('Series2/3 · #2');

    act(() => {
      mockDisplaySets = [series('b', 2), series('a', 1)];
      mockListeners.removed.forEach(callback => callback());
    });
    expect(container.textContent).toBe('Series1/2 · #2');
  });
});
