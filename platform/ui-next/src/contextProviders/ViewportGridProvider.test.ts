import { createElement } from 'react';
import { act, render } from '@testing-library/react';

jest.mock(
  '@ohif/core',
  () => ({
    utils: {
      uuidv4: () => '12345678-0000-0000-0000-000000000000',
    },
  }),
  { virtual: true }
);

import { ViewportGridProvider, useViewportGrid } from './ViewportGridProvider';

const createMockService = () => {
  let impl: Record<string, any> = {};
  return {
    setServiceImplementation(nextImpl: Record<string, any>) {
      impl = nextImpl;
    },
    getPresentationIds: () => ({}),
    setLayout: (layout: any) => impl.setLayout(layout),
    setActiveViewportId: (id: string) => impl.setActiveViewportId(id),
    setDisplaySetsForViewports: (props: any) => impl.setDisplaySetsForViewports(props),
    getState: () => impl.getState(),
  } as any;
};

const createEmptyViewport = (viewportId: string) => ({
  viewportId,
  displaySetInstanceUIDs: [],
  viewportOptions: { viewportId },
  displaySetSelectors: [],
  displaySetOptions: [{}],
});

const createPopulatedViewport = (viewportId: string, uid: string) => ({
  viewportId,
  displaySetInstanceUIDs: [uid],
  viewportOptions: { viewportId },
  displaySetSelectors: [],
  displaySetOptions: [{}],
});

describe('ViewportGridProvider', () => {
  it('keeps an activeViewportId when repeated setLayout calls leave all viewports empty', () => {
    const service = createMockService();
    let latestState: AppTypes.ViewportGrid.State;
    let latestApi: ReturnType<typeof useViewportGrid>[1];

    function Probe() {
      const [state, api] = useViewportGrid();
      latestState = state;
      latestApi = api;
      return null;
    }

    render(createElement(ViewportGridProvider, { service }, createElement(Probe)));

    const applyEmptyLayout = (viewportId: string) => {
      act(() => {
        latestApi.setLayout({
          numRows: 1,
          numCols: 1,
          layoutOptions: [{ x: 0, y: 0, width: 1, height: 1 }],
          findOrCreateViewport: () => createEmptyViewport(viewportId),
          isHangingProtocolLayout: true,
        });
      });
    };

    // Mirrors defaultRouteInit applying the hanging protocol twice on load
    applyEmptyLayout('empty-vp-1');
    expect(latestState.activeViewportId).toBe('empty-vp-1');

    applyEmptyLayout('empty-vp-2');
    expect(latestState.activeViewportId).toBe('empty-vp-2');
  });

  it('falls back to the first empty viewport when switching from populated viewports to an all-empty layout', () => {
    const service = createMockService();
    let latestState: AppTypes.ViewportGrid.State;
    let latestApi: ReturnType<typeof useViewportGrid>[1];

    function Probe() {
      const [state, api] = useViewportGrid();
      latestState = state;
      latestApi = api;
      return null;
    }

    render(createElement(ViewportGridProvider, { service }, createElement(Probe)));

    act(() => {
      latestApi.setLayout({
        numRows: 1,
        numCols: 1,
        layoutOptions: [{ x: 0, y: 0, width: 1, height: 1 }],
        findOrCreateViewport: () => createPopulatedViewport('filled-vp', 'ds-1'),
        isHangingProtocolLayout: true,
      });
    });
    expect(latestState.activeViewportId).toBe('filled-vp');

    act(() => {
      latestApi.setLayout({
        numRows: 1,
        numCols: 1,
        layoutOptions: [{ x: 0, y: 0, width: 1, height: 1 }],
        findOrCreateViewport: () => createEmptyViewport('empty-vp'),
        isHangingProtocolLayout: true,
      });
    });
    expect(latestState.activeViewportId).toBe('empty-vp');
  });

  it('returns null when the new layout creates no viewports', () => {
    const service = createMockService();
    let latestState: AppTypes.ViewportGrid.State;
    let latestApi: ReturnType<typeof useViewportGrid>[1];

    function Probe() {
      const [state, api] = useViewportGrid();
      latestState = state;
      latestApi = api;
      return null;
    }

    render(createElement(ViewportGridProvider, { service }, createElement(Probe)));

    act(() => {
      latestApi.setLayout({
        numRows: 0,
        numCols: 0,
        layoutOptions: [],
        findOrCreateViewport: () => null,
        isHangingProtocolLayout: true,
      });
    });
    expect(latestState.activeViewportId).toBeNull();
  });
});
