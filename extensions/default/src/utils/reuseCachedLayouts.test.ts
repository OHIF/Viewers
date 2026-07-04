import ViewportGridService from '../../../../platform/core/src/services/ViewportGridService/ViewportGridService';
import reuseCachedLayouts from './reuseCachedLayouts';
import { useViewportGridStore } from '../stores/useViewportGridStore';
import { useDisplaySetSelectorStore } from '../stores/useDisplaySetSelectorStore';
import { useHangingProtocolStageIndexStore } from '../stores/useHangingProtocolStageIndexStore';

// uuidv4 relies on crypto.getRandomValues, which older jsdom builds omit.
if (typeof globalThis.crypto?.getRandomValues !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { webcrypto } = require('crypto');
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

const STORE_ID = 'study-1:test-protocol:0';

function makeViewportGridService() {
  return new ViewportGridService({ servicesManager: {} as never });
}

function makeHangingProtocolService({ rows, columns, viewportCount }) {
  const stage = {
    viewportStructure: { properties: { rows, columns } },
    viewports: new Array(viewportCount).fill({}),
  };
  return {
    getActiveProtocol: () => ({ protocol: { id: 'test-protocol', stages: [stage] } }),
    getState: () => ({ protocolId: 'test-protocol', stageIndex: 0, activeStudyUID: 'study-1' }),
  } as never;
}

function vp(viewportId: string, displaySetInstanceUIDs: string[] = []) {
  return {
    displaySetInstanceUIDs,
    viewportOptions: { viewportId },
    displaySetOptions: [],
  };
}

function setGrid(
  service: ViewportGridService,
  specs: Array<Record<string, unknown>>,
  opts: Record<string, unknown> = {}
) {
  return service.setLayout({
    numRows: (opts.numRows as number) ?? 1,
    numCols: (opts.numCols as number) ?? specs.length,
    layoutOptions: [],
    activeViewportId: opts.activeViewportId as string,
    isHangingProtocolLayout: (opts.isHangingProtocolLayout as boolean) ?? false,
    findOrCreateViewport: position => specs[position],
  });
}

describe('reuseCachedLayouts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useViewportGridStore.getState().clearViewportGridState();
    useDisplaySetSelectorStore.getState().clearDisplaySetSelectorMap();
    useHangingProtocolStageIndexStore.getState().clearHangingProtocolStageIndexMap();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('stores a deep grid snapshot for custom layouts, isolated from later grid mutations', () => {
    const viewportGridService = makeViewportGridService();
    // Stage declares a single 1x1 viewport, the grid shows 1x2: custom layout.
    const hangingProtocolService = makeHangingProtocolService({
      rows: 1,
      columns: 1,
      viewportCount: 1,
    });

    setGrid(viewportGridService, [vp('a', ['ds-1']), vp('b', ['ds-2'])], {
      activeViewportId: 'a',
    });

    reuseCachedLayouts(
      viewportGridService.getState(),
      hangingProtocolService,
      viewportGridService
    );

    const stored = useViewportGridStore.getState().viewportGridState[STORE_ID];
    expect(stored).toBeDefined();

    // Mutate the grid after the snapshot was stored.
    viewportGridService.setDisplaySetsForViewports([
      { viewportId: 'a', displaySetInstanceUIDs: ['ds-9'] },
    ]);
    viewportGridService.setActiveViewportId('b');

    // The stored snapshot is a deep copy, not an alias of the live state.
    const storedSnapshot = stored as { viewports: Record<string, { displaySetInstanceUIDs }> };
    expect(storedSnapshot.viewports['a'].displaySetInstanceUIDs).toEqual(['ds-1']);
    expect(viewportGridService.getState().viewports.get('a').displaySetInstanceUIDs).toEqual([
      'ds-9',
    ]);
  });

  it('round-trips the stored snapshot through viewportGridService.restore', () => {
    const viewportGridService = makeViewportGridService();
    const hangingProtocolService = makeHangingProtocolService({
      rows: 1,
      columns: 1,
      viewportCount: 1,
    });

    setGrid(viewportGridService, [vp('a', ['ds-1']), vp('b', ['ds-2'])], {
      activeViewportId: 'a',
    });

    reuseCachedLayouts(
      viewportGridService.getState(),
      hangingProtocolService,
      viewportGridService
    );

    // Mutate everything the snapshot covers: content, layout and active id.
    viewportGridService.setDisplaySetsForViewports([
      { viewportId: 'a', displaySetInstanceUIDs: ['ds-9'] },
    ]);
    setGrid(viewportGridService, [vp('c', ['ds-3'])], { activeViewportId: 'c' });

    const stored = useViewportGridStore.getState().viewportGridState[STORE_ID];
    viewportGridService.restore(stored as never);

    const state = viewportGridService.getState();
    expect(state.activeViewportId).toBe('a');
    expect(state.layout).toMatchObject({ numRows: 1, numCols: 2 });
    expect(state.viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-1']);
    expect(state.viewports.get('b')).toMatchObject({
      displaySetInstanceUIDs: ['ds-2'],
      x: 0.5,
      width: 0.5,
    });
    expect(state.viewports.has('c')).toBe(false);
  });

  it('does not store a snapshot when the grid matches the protocol stage', () => {
    const viewportGridService = makeViewportGridService();
    // Stage matches the grid exactly: 1x2 with two viewports.
    const hangingProtocolService = makeHangingProtocolService({
      rows: 1,
      columns: 2,
      viewportCount: 2,
    });

    setGrid(viewportGridService, [vp('a', ['ds-1']), vp('b', ['ds-2'])], {
      activeViewportId: 'a',
    });

    reuseCachedLayouts(
      viewportGridService.getState(),
      hangingProtocolService,
      viewportGridService
    );

    expect(useViewportGridStore.getState().viewportGridState[STORE_ID]).toBeUndefined();
  });
});
