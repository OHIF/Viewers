import { assembleLegacyState, createViewportGridStore } from './gridStore';
import type { GetPresentationIds, ViewportGridStore } from './gridStore';
import {
  selectActiveViewportId,
  selectIsActive,
  selectLayout,
  selectStability,
  selectViewport,
  shallowEqual,
} from './gridSelectors';

// uuidv4 relies on crypto.getRandomValues, which older jsdom builds omit.
if (typeof globalThis.crypto?.getRandomValues !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { webcrypto } = require('crypto');
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

function makeStore(getPresentationIds?: jest.Mock) {
  const presentationIds = getPresentationIds ?? (jest.fn(() => ({})) as jest.Mock);
  const store = createViewportGridStore({
    getPresentationIds: presentationIds as unknown as GetPresentationIds,
  });
  return { store, getPresentationIds: presentationIds };
}

function vp(
  viewportId: string,
  displaySetInstanceUIDs: string[] = [],
  viewportOptions: Record<string, unknown> = {},
  extra: Record<string, unknown> = {}
) {
  return {
    displaySetInstanceUIDs,
    viewportOptions: { viewportId, ...viewportOptions },
    displaySetOptions: [],
    ...extra,
  };
}

function applyGrid(
  store: ViewportGridStore,
  specs: Array<Record<string, unknown> | undefined>,
  opts: Record<string, unknown> = {}
) {
  store.getState().applyLayout({
    numRows: (opts.numRows as number) ?? 1,
    numCols: (opts.numCols as number) ?? specs.length,
    layoutOptions: (opts.layoutOptions as []) ?? [],
    layoutType: opts.layoutType as string,
    activeViewportId: opts.activeViewportId as string,
    isHangingProtocolLayout: (opts.isHangingProtocolLayout as boolean) ?? false,
    findOrCreateViewport: position => specs[position] as ReturnType<never>,
  });
}

describe('gridStore', () => {
  describe('applyLayout', () => {
    it('mints viewport ids and stores fractional geometry in layout.panes, not on compositions', () => {
      const { store } = makeStore();

      applyGrid(store, [{}, {}]);

      const state = store.getState();
      expect(state.viewports.size).toBe(2);
      expect(state.layout.numRows).toBe(1);
      expect(state.layout.numCols).toBe(2);
      expect(state.layout.layoutType).toBe('grid');

      const [paneA, paneB] = state.layout.panes;
      expect(paneA).toMatchObject({ x: 0, y: 0, width: 0.5, height: 1, positionId: '0-0' });
      expect(paneB).toMatchObject({ x: 0.5, y: 0, width: 0.5, height: 1, positionId: '1-0' });

      for (const pane of state.layout.panes) {
        expect(pane.viewportId).toMatch(/^viewport-[0-9a-f]{8}$/);
        const composition = state.viewports.get(pane.viewportId);
        expect(composition).toBeDefined();
        expect(composition.viewportOptions.viewportId).toBe(pane.viewportId);
        // Geometry lives on the pane only.
        expect('x' in composition).toBe(false);
        expect('width' in composition).toBe(false);
      }
    });

    it('uses layoutOptions geometry and skips positions beyond layoutOptions.length', () => {
      const { store } = makeStore();
      const findOrCreateViewport = jest.fn(() => vp('a', ['ds-1']));

      store.getState().applyLayout({
        numRows: 1,
        numCols: 2,
        layoutOptions: [{ x: 0, y: 0, width: 1, height: 1, positionId: 'custom-pos' }],
        findOrCreateViewport,
      });

      expect(findOrCreateViewport).toHaveBeenCalledTimes(1);
      expect(findOrCreateViewport).toHaveBeenCalledWith(0, 'custom-pos', expect.any(Object));

      const state = store.getState();
      expect(state.viewports.size).toBe(1);
      expect(state.layout.panes).toEqual([
        { viewportId: 'a', positionId: 'custom-pos', x: 0, y: 0, width: 1, height: 1 },
      ]);
    });

    it('skips positions where findOrCreateViewport returns undefined', () => {
      const { store } = makeStore();

      applyGrid(store, [vp('a', ['ds-1']), undefined]);

      const state = store.getState();
      expect(state.viewports.size).toBe(1);
      expect(state.layout.panes).toHaveLength(1);
      expect(state.viewports.has('a')).toBe(true);
    });

    it('never mutates objects returned by findOrCreateViewport', () => {
      const { store } = makeStore();
      const frozen = Object.freeze({
        displaySetInstanceUIDs: Object.freeze(['ds-1']),
        viewportOptions: Object.freeze({ viewportId: 'a' }),
        displaySetOptions: Object.freeze([]),
      });

      expect(() => applyGrid(store, [frozen])).not.toThrow();

      expect(frozen).not.toHaveProperty('positionId');
      expect(frozen.viewportOptions).not.toHaveProperty('presentationIds');
      const composition = store.getState().viewports.get('a');
      expect(composition.viewportOptions).not.toBe(frozen.viewportOptions);
      expect(composition.displaySetInstanceUIDs).not.toBe(frozen.displaySetInstanceUIDs);
    });

    it('computes presentationIds only when not already set, with the candidate in the working map', () => {
      const getPresentationIds = jest.fn(({ viewport }) => ({ id: `${viewport.viewportId}-pid` }));
      const { store } = makeStore(getPresentationIds);

      applyGrid(store, [
        vp('a', ['ds-1']),
        vp('b', ['ds-2'], { presentationIds: { id: 'preset' } }),
      ]);

      expect(getPresentationIds).toHaveBeenCalledTimes(1);
      const [{ viewport, viewports }] = getPresentationIds.mock.calls[0];
      expect(viewport.viewportId).toBe('a');
      expect(viewports.get('a')).toBe(viewport);

      const state = store.getState();
      expect(state.viewports.get('a').viewportOptions.presentationIds).toEqual({ id: 'a-pid' });
      expect(state.viewports.get('b').viewportOptions.presentationIds).toEqual({ id: 'preset' });
    });

    it('bumps compositionRevision and resets the runtime entry when the composition changed', () => {
      const { store } = makeStore();

      applyGrid(store, [vp('a', ['ds-1'])]);
      const first = store.getState();
      expect(first.layout.layoutRevision).toBe(1);
      expect(first.viewports.get('a').compositionRevision).toBe(1);
      expect(first.runtime.get('a')).toEqual({ phase: 'detached', forRevision: 1, pendingWork: 0 });

      store.getState().reportPhase('a', 'rendered', 1);

      applyGrid(store, [vp('a', ['ds-2'])]);
      const second = store.getState();
      expect(second.layout.layoutRevision).toBe(2);
      expect(second.viewports.get('a').compositionRevision).toBe(2);
      expect(second.runtime.get('a')).toEqual({
        phase: 'detached',
        forRevision: 2,
        pendingWork: 0,
      });
    });

    it('keeps composition identity, revision and runtime across a content-identical relayout', () => {
      const { store } = makeStore();

      // A surviving viewport whose element is not remounted never re-reports
      // its phase; a plain layout change must not invalidate its runtime.
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'rendered', 1);
      const firstComposition = store.getState().viewports.get('a');
      const firstEntry = store.getState().runtime.get('a');
      expect(store.getState().derived.allRendered).toBe(true);
      const epochBefore = store.getState().derived.epoch;

      applyGrid(store, [vp('a', ['ds-1']), vp('b', [])]);

      const state = store.getState();
      expect(state.layout.layoutRevision).toBe(2);
      expect(state.viewports.get('a')).toBe(firstComposition);
      expect(state.viewports.get('a').compositionRevision).toBe(1);
      expect(state.runtime.get('a')).toBe(firstEntry);
      // The layout transaction still bumps the epoch, but stability holds.
      expect(state.derived.epoch).toBe(epochBefore + 1);
      expect(state.derived.allMounted).toBe(true);
      expect(state.derived.allRendered).toBe(true);
    });

    it('carries pending work tokens across a content-identical relayout', () => {
      const { store } = makeStore();

      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'rendered', 1);
      store.getState().beginWork('a', 'token-1');
      expect(store.getState().derived.allSettled).toBe(false);

      applyGrid(store, [vp('a', ['ds-1'])]);
      expect(store.getState().runtime.get('a').pendingWork).toBe(1);
      expect(store.getState().derived.allSettled).toBe(false);

      store.getState().endWork('a', 'token-1');
      expect(store.getState().derived.allSettled).toBe(true);
    });

    it('prunes runtime entries for viewports removed from the layout', () => {
      const { store } = makeStore();

      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      expect(store.getState().runtime.has('b')).toBe(true);

      applyGrid(store, [vp('a', ['ds-1'])]);
      expect(store.getState().runtime.has('b')).toBe(false);
      expect(store.getState().viewports.has('b')).toBe(false);
    });
  });

  describe('determineActiveViewportId', () => {
    it('respects an explicitly provided activeViewportId', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])], { activeViewportId: 'b' });
      expect(store.getState().activeViewportId).toBe('b');
    });

    it('falls back to the first viewport when there is no previous active viewport', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      expect(store.getState().activeViewportId).toBe('a');
    });

    it('ranks orientation match above shared displaySetInstanceUIDs', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'], { orientation: 'sagittal' })], {
        activeViewportId: 'a',
      });

      applyGrid(store, [
        vp('x', ['ds-1'], { orientation: 'axial' }),
        vp('y', ['ds-9'], { orientation: 'sagittal' }),
      ]);

      expect(store.getState().activeViewportId).toBe('y');
    });

    it('uses shared displaySetInstanceUIDs as the tiebreaker when orientations do not match', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'], { orientation: 'sagittal' })], {
        activeViewportId: 'a',
      });

      applyGrid(store, [
        vp('x', ['ds-9'], { orientation: 'axial' }),
        vp('z', ['ds-1'], { orientation: 'coronal' }),
      ]);

      expect(store.getState().activeViewportId).toBe('z');
    });

    it('returns null when no new viewport has content', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])], { activeViewportId: 'a' });

      applyGrid(store, [vp('x', [])]);

      expect(store.getState().activeViewportId).toBeNull();
    });
  });

  describe('setDisplaySets', () => {
    it('inherits previous displaySetOptions only in a hanging protocol layout', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'], {}, { displaySetOptions: [{ id: 'hp-option' }] })], {
        isHangingProtocolLayout: true,
      });

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);

      expect(store.getState().viewports.get('a').displaySetOptions).toEqual([{ id: 'hp-option' }]);
    });

    it('falls back to [{}] outside a hanging protocol layout', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'], {}, { displaySetOptions: [{ id: 'old-option' }] })]);

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);

      expect(store.getState().viewports.get('a').displaySetOptions).toEqual([{}]);
    });

    it('wipes viewportOptions on drag-drop (no update options, non-HP layout)', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'], { toolGroupId: 'default', viewportType: 'volume' })]);

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);

      const { viewportOptions } = store.getState().viewports.get('a');
      expect(viewportOptions.viewportId).toBe('a');
      expect(viewportOptions.toolGroupId).toBeUndefined();
      expect(viewportOptions.viewportType).toBeUndefined();
      // presentationIds are recomputed after the wipe.
      expect(Object.keys(viewportOptions).sort()).toEqual(['presentationIds', 'viewportId']);
    });

    it('merges update viewportOptions over the previous ones when provided', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'], { toolGroupId: 'default' })]);

      store.getState().setDisplaySets([
        {
          viewportId: 'a',
          displaySetInstanceUIDs: ['ds-2'],
          viewportOptions: { orientation: 'axial' },
        },
      ]);

      const { viewportOptions } = store.getState().viewports.get('a');
      expect(viewportOptions.toolGroupId).toBe('default');
      expect(viewportOptions.orientation).toBe('axial');
    });

    it('strips useOnce initialImageOptions without mutating the previous state', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().setDisplaySets([
        {
          viewportId: 'a',
          displaySetInstanceUIDs: ['ds-1'],
          viewportOptions: { initialImageOptions: { useOnce: true, index: 5 } },
        },
      ]);

      const previousComposition = store.getState().viewports.get('a');
      const previousOptions = previousComposition.viewportOptions;
      expect(previousOptions.initialImageOptions).toEqual({ useOnce: true, index: 5 });

      store
        .getState()
        .setDisplaySets([
          { viewportId: 'a', displaySetInstanceUIDs: ['ds-2'], viewportOptions: {} },
        ]);

      // The old state objects are untouched.
      expect(previousComposition.viewportOptions).toBe(previousOptions);
      expect(previousOptions.initialImageOptions).toEqual({ useOnce: true, index: 5 });
      // The new composition has the one-time options stripped.
      expect(store.getState().viewports.get('a').viewportOptions.initialImageOptions).toBeNull();
    });

    it('recomputes presentationIds with the candidate viewport and the working map', () => {
      // The working map is passed live, so capture what it held at call time.
      const seenAtCallTime: Array<{ candidate; mapEntry }> = [];
      const getPresentationIds = jest.fn(({ viewport, viewports }) => {
        seenAtCallTime.push({ candidate: viewport, mapEntry: viewports.get(viewport.viewportId) });
        return { id: `${viewport.viewportId}-pid` };
      });
      const { store } = makeStore(getPresentationIds);
      applyGrid(store, [vp('a', ['ds-1'])]);
      getPresentationIds.mockClear();
      seenAtCallTime.length = 0;

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);

      expect(getPresentationIds).toHaveBeenCalledTimes(1);
      const [{ candidate, mapEntry }] = seenAtCallTime;
      expect(candidate.viewportId).toBe('a');
      expect(candidate.displaySetInstanceUIDs).toEqual(['ds-2']);
      // Same ordering as the legacy reducer: the working map still held the
      // previous entry when presentation ids were computed.
      expect(mapEntry).not.toBe(candidate);
      expect(mapEntry.displaySetInstanceUIDs).toEqual(['ds-1']);
      expect(store.getState().viewports.get('a').viewportOptions.presentationIds).toEqual({
        id: 'a-pid',
      });
    });

    it('keeps identity of untouched map entries and bumps only touched revisions', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      const before = store.getState();
      const untouched = before.viewports.get('b');

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-3'] }]);

      const after = store.getState();
      expect(after.viewports.get('b')).toBe(untouched);
      expect(after.viewports.get('a').compositionRevision).toBe(2);
      expect(after.viewports.get('b').compositionRevision).toBe(1);
    });

    it('carries the runtime phase forward to the new revision (old reducer kept isReady)', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'rendered', 1);
      expect(store.getState().runtime.get('a').phase).toBe('rendered');

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);

      expect(store.getState().runtime.get('a')).toEqual({
        phase: 'rendered',
        forRevision: 2,
        pendingWork: 0,
      });
      expect(assembleLegacyState(store.getState()).viewports.get('a').isReady).toBe(true);
    });

    it('resets an error phase to detached instead of carrying it forward', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'error', 1);

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);

      expect(store.getState().runtime.get('a')).toEqual({
        phase: 'detached',
        forRevision: 2,
        pendingWork: 0,
      });

      // The fresh revision accepts reports again.
      store.getState().reportPhase('a', 'mounted', 2);
      expect(store.getState().runtime.get('a').phase).toBe('mounted');
    });

    it('throws when a viewportId is missing', () => {
      const { store } = makeStore();
      expect(() =>
        store.getState().setDisplaySets([{ viewportId: '', displaySetInstanceUIDs: ['ds-1'] }])
      ).toThrow('ViewportId is required to set display sets for viewport');
    });
  });

  describe('reportPhase', () => {
    it('is a no-op for unknown viewports and does not corrupt state', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      const before = store.getState();

      store.getState().reportPhase('unknown-viewport', 'mounted', 1);

      expect(store.getState()).toBe(before);
    });

    it('ignores stale forRevision reports', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);

      store.getState().reportPhase('a', 'rendered', 1);

      expect(store.getState().runtime.get('a')).toEqual({
        phase: 'detached',
        forRevision: 2,
        pendingWork: 0,
      });
    });

    it('only moves phases forward within a revision', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);

      store.getState().reportPhase('a', 'rendered', 1);
      store.getState().reportPhase('a', 'mounted', 1);

      expect(store.getState().runtime.get('a').phase).toBe('rendered');
    });

    it('allows error from any phase and treats it as terminal for the revision', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);

      store.getState().reportPhase('a', 'rendered', 1);
      store.getState().reportPhase('a', 'error', 1);
      expect(store.getState().runtime.get('a').phase).toBe('error');

      store.getState().reportPhase('a', 'settled', 1);
      expect(store.getState().runtime.get('a').phase).toBe('error');

      // A fresh revision resets the error.
      store.getState().bumpComposition('a');
      store.getState().reportPhase('a', 'mounted', 2);
      expect(store.getState().runtime.get('a')).toEqual({
        phase: 'mounted',
        forRevision: 2,
        pendingWork: 0,
      });
    });

    it('never bumps the epoch', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      const { epoch } = store.getState().derived;

      store.getState().reportPhase('a', 'mounted', 1);
      store.getState().reportPhase('a', 'rendered', 1);

      expect(store.getState().derived.epoch).toBe(epoch);
    });
  });

  describe('derived stability', () => {
    it('is false on every level when there are zero content viewports', () => {
      const { store } = makeStore();
      // Default seeded state has only the empty 'default' viewport.
      expect(store.getState().derived).toMatchObject({
        allMounted: false,
        allRendered: false,
        allSettled: false,
        pendingViewportIds: [],
      });

      applyGrid(store, [vp('a', [])]);
      expect(store.getState().derived).toMatchObject({
        allMounted: false,
        allRendered: false,
        allSettled: false,
      });
    });

    it('counts only content viewports', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('empty', [])]);

      store.getState().reportPhase('a', 'mounted', 1);
      expect(store.getState().derived.allMounted).toBe(true);
      expect(store.getState().derived.allRendered).toBe(false);
      expect(store.getState().derived.pendingViewportIds).toEqual(['a']);

      store.getState().reportPhase('a', 'rendered', 1);
      expect(store.getState().derived.allRendered).toBe(true);
      expect(store.getState().derived.allSettled).toBe(true);
      expect(store.getState().derived.pendingViewportIds).toEqual([]);
    });

    it('requires every content viewport to reach the phase for its current revision', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);

      store.getState().reportPhase('a', 'mounted', 1);
      expect(store.getState().derived.allMounted).toBe(false);

      store.getState().reportPhase('b', 'mounted', 1);
      expect(store.getState().derived.allMounted).toBe(true);

      // setDisplaySets carries readiness forward (the element is reused).
      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-3'] }]);
      expect(store.getState().derived.allMounted).toBe(true);

      // bumpComposition is the explicit invalidation path and drops stability.
      store.getState().bumpComposition('a');
      expect(store.getState().derived.allMounted).toBe(false);
      expect(store.getState().derived.pendingViewportIds).toEqual(['a', 'b']);
    });

    it('bumps the epoch on layout and composition transactions only', () => {
      const { store } = makeStore();
      const epoch0 = store.getState().derived.epoch;

      applyGrid(store, [vp('a', ['ds-1'])]);
      const epoch1 = store.getState().derived.epoch;
      expect(epoch1).toBe(epoch0 + 1);

      store.getState().reportPhase('a', 'mounted', 1);
      store.getState().beginWork('a', 'token-1');
      store.getState().endWork('a', 'token-1');
      expect(store.getState().derived.epoch).toBe(epoch1);

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);
      expect(store.getState().derived.epoch).toBe(epoch1 + 1);

      store.getState().bumpComposition('a');
      expect(store.getState().derived.epoch).toBe(epoch1 + 2);

      store.getState().setActiveViewport('a');
      expect(store.getState().derived.epoch).toBe(epoch1 + 2);
    });

    it('keeps pendingViewportIds identity stable while its contents are unchanged', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      const pending = store.getState().derived.pendingViewportIds;

      store.getState().reportPhase('a', 'mounted', 1);

      expect(store.getState().derived.pendingViewportIds).toBe(pending);
    });
  });

  describe('work tokens', () => {
    it('holds allSettled false while work is pending and counts each token once', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'rendered', 1);
      expect(store.getState().derived.allSettled).toBe(true);

      store.getState().beginWork('a', 'streaming');
      store.getState().beginWork('a', 'streaming');
      expect(store.getState().runtime.get('a').pendingWork).toBe(1);
      expect(store.getState().derived.allSettled).toBe(false);
      expect(store.getState().derived.pendingViewportIds).toEqual(['a']);

      store.getState().beginWork('a', 'hydration');
      expect(store.getState().runtime.get('a').pendingWork).toBe(2);

      store.getState().endWork('a', 'streaming');
      store.getState().endWork('a', 'streaming');
      expect(store.getState().runtime.get('a').pendingWork).toBe(1);

      store.getState().endWork('a', 'hydration');
      expect(store.getState().runtime.get('a').pendingWork).toBe(0);
      expect(store.getState().derived.allSettled).toBe(true);
    });

    it('ignores work for unknown viewports and clears tokens on composition changes', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);

      const before = store.getState();
      store.getState().beginWork('unknown-viewport', 'token');
      expect(store.getState()).toBe(before);

      store.getState().beginWork('a', 'streaming');
      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);
      expect(store.getState().runtime.get('a').pendingWork).toBe(0);

      // Ending the pre-change token is inert after the reset.
      store.getState().endWork('a', 'streaming');
      expect(store.getState().runtime.get('a').pendingWork).toBe(0);
    });
  });

  describe('detachRuntime', () => {
    it('resets the runtime entry to detached at the current revision without an epoch bump', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'rendered', 1);
      const { epoch } = store.getState().derived;

      store.getState().detachRuntime('a');

      expect(store.getState().runtime.get('a')).toEqual({
        phase: 'detached',
        forRevision: 1,
        pendingWork: 0,
      });
      expect(store.getState().derived.epoch).toBe(epoch);
      expect(store.getState().derived.allMounted).toBe(false);
    });

    it('clears work tokens so later beginWork does not resurrect stale counts', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'rendered', 1);
      store.getState().beginWork('a', 'stale-token');
      expect(store.getState().runtime.get('a').pendingWork).toBe(1);

      store.getState().detachRuntime('a');
      expect(store.getState().runtime.get('a').pendingWork).toBe(0);

      store.getState().reportPhase('a', 'rendered', 1);
      store.getState().beginWork('a', 'new-token');
      // One unit of work, not two: the pre-detach token is gone.
      expect(store.getState().runtime.get('a').pendingWork).toBe(1);

      store.getState().endWork('a', 'new-token');
      expect(store.getState().derived.allSettled).toBe(true);
    });

    it('is a no-op for unknown viewports and for already-detached entries', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);

      const before = store.getState();
      store.getState().detachRuntime('unknown-viewport');
      expect(store.getState()).toBe(before);

      store.getState().detachRuntime('a');
      expect(store.getState()).toBe(before);
    });
  });

  describe('bumpComposition', () => {
    it('bumps the revision and resets the runtime entry', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'rendered', 1);

      store.getState().bumpComposition('a', 'segmentation-hydrated');

      const state = store.getState();
      expect(state.viewports.get('a').compositionRevision).toBe(2);
      expect(state.runtime.get('a')).toEqual({ phase: 'detached', forRevision: 2, pendingWork: 0 });
    });

    it('is a no-op for unknown viewports', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      const before = store.getState();

      store.getState().bumpComposition('unknown-viewport');

      expect(store.getState()).toBe(before);
    });
  });

  describe('snapshot and restore', () => {
    it('produces deep-copied snapshots isolated from the live state', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'], { toolGroupId: 'default' })]);

      const snap = store.getState().snapshot();
      snap.viewports.a.displaySetInstanceUIDs.push('mutated');
      snap.viewports.a.viewportOptions.toolGroupId = 'mutated';
      snap.layout.panes[0].width = 999;

      const state = store.getState();
      expect(state.viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-1']);
      expect(state.viewports.get('a').viewportOptions.toolGroupId).toBe('default');
      expect(state.layout.panes[0].width).toBe(1);
    });

    it('restores a snapshot as one transaction, isolated from later snapshot mutations', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])], { activeViewportId: 'a' });
      const snap = store.getState().snapshot();
      const epochBefore = store.getState().derived.epoch;

      applyGrid(store, [vp('b', ['ds-2'])], { activeViewportId: 'b' });
      expect(store.getState().viewports.has('a')).toBe(false);

      store.getState().restore(snap);

      const restored = store.getState();
      expect(restored.activeViewportId).toBe('a');
      expect(restored.viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-1']);
      expect(restored.viewports.has('b')).toBe(false);
      expect(restored.derived.epoch).toBeGreaterThan(epochBefore);

      // Mutating the snapshot after restore cannot reach the store.
      snap.viewports.a.displaySetInstanceUIDs.push('mutated');
      expect(store.getState().viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-1']);
    });
  });

  describe('set, reset and setActiveViewport', () => {
    it('set performs a shallow merge and keeps untouched slices by identity', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      const viewportsBefore = store.getState().viewports;

      store.getState().set({ isHangingProtocolLayout: true });

      expect(store.getState().isHangingProtocolLayout).toBe(true);
      expect(store.getState().viewports).toBe(viewportsBefore);
    });

    it('set bumps the epoch only when the partial touches layout, viewports or runtime', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      const { epoch } = store.getState().derived;

      store.getState().set({ activeViewportId: 'b' });
      expect(store.getState().derived.epoch).toBe(epoch);

      store.getState().set({ isHangingProtocolLayout: true });
      expect(store.getState().derived.epoch).toBe(epoch);

      store.getState().set({ viewports: new Map(store.getState().viewports) });
      expect(store.getState().derived.epoch).toBe(epoch + 1);
    });

    it('reset returns a fresh deep default each time, including the seeded default viewport', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);

      store.getState().reset();
      const first = store.getState();
      store.getState().reset();
      const second = store.getState();

      // Fresh identities on every reset; no shared references.
      expect(second.viewports).not.toBe(first.viewports);
      expect(second.viewports.get('default')).not.toBe(first.viewports.get('default'));
      expect(second.layout.panes).not.toBe(first.layout.panes);

      const defaultViewport = second.viewports.get('default');
      expect(defaultViewport).toMatchObject({
        viewportId: 'default',
        displaySetInstanceUIDs: [],
        viewportOptions: { viewportId: 'default' },
        displaySetSelectors: [],
        displaySetOptions: [{}],
        viewportLabel: null,
      });
      // The legacy default pane geometry quirk: width/height are 100.
      expect(second.layout.panes[0]).toMatchObject({
        viewportId: 'default',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expect(second.activeViewportId).toBeNull();
      expect(second.isHangingProtocolLayout).toBe(false);
    });

    it('setActiveViewport updates the id without bumping the epoch', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      const { epoch } = store.getState().derived;

      store.getState().setActiveViewport('b');

      expect(store.getState().activeViewportId).toBe('b');
      expect(store.getState().derived.epoch).toBe(epoch);
    });
  });

  describe('assembleLegacyState', () => {
    it('builds the legacy shape with pane geometry merged back and isReady from runtime', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])], { activeViewportId: 'a' });

      const legacy = assembleLegacyState(store.getState());

      expect(legacy.layout).toEqual({ numRows: 1, numCols: 2, layoutType: 'grid' });
      expect(legacy.layout).not.toHaveProperty('panes');
      expect(legacy.layout).not.toHaveProperty('layoutRevision');
      expect(legacy.activeViewportId).toBe('a');
      expect(legacy.isHangingProtocolLayout).toBe(false);

      const legacyA = legacy.viewports.get('a');
      expect(legacyA).toMatchObject({
        viewportId: 'a',
        displaySetInstanceUIDs: ['ds-1'],
        positionId: '0-0',
        x: 0,
        y: 0,
        width: 0.5,
        height: 1,
        isReady: false,
        viewportLabel: null,
        displaySetSelectors: [],
      });
      expect(legacyA).not.toHaveProperty('compositionRevision');

      store.getState().reportPhase('a', 'mounted', 1);
      expect(assembleLegacyState(store.getState()).viewports.get('a').isReady).toBe(true);
    });

    it('marks isReady false when the runtime entry describes a stale revision', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);
      store.getState().reportPhase('a', 'mounted', 1);
      expect(assembleLegacyState(store.getState()).viewports.get('a').isReady).toBe(true);

      store.getState().bumpComposition('a');
      expect(assembleLegacyState(store.getState()).viewports.get('a').isReady).toBe(false);
    });

    it('returns the same object identity until the state actually changes', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);

      const legacy1 = assembleLegacyState(store.getState());
      const legacy2 = assembleLegacyState(store.getState());
      expect(legacy2).toBe(legacy1);

      store.getState().reportPhase('a', 'mounted', 1);
      const legacy3 = assembleLegacyState(store.getState());
      expect(legacy3).not.toBe(legacy1);

      store.getState().setActiveViewport('a');
      const legacy4 = assembleLegacyState(store.getState());
      expect(legacy4).not.toBe(legacy3);
      expect(legacy4.activeViewportId).toBe('a');
    });

    it('keeps entry and viewports Map identity across unrelated transactions', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])], { activeViewportId: 'a' });
      const legacy1 = assembleLegacyState(store.getState());

      // Active-viewport change: no entry changed, Map identity is kept.
      store.getState().setActiveViewport('b');
      const legacy2 = assembleLegacyState(store.getState());
      expect(legacy2.viewports).toBe(legacy1.viewports);

      // Runtime report: only the touched entry is rebuilt.
      store.getState().reportPhase('a', 'mounted', 1);
      const legacy3 = assembleLegacyState(store.getState());
      expect(legacy3.viewports).not.toBe(legacy2.viewports);
      expect(legacy3.viewports.get('a')).not.toBe(legacy2.viewports.get('a'));
      expect(legacy3.viewports.get('b')).toBe(legacy2.viewports.get('b'));
      expect(legacy3.viewports.get('a').isReady).toBe(true);
    });

    it('keeps untouched entry identity across setDisplaySets', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      const legacy1 = assembleLegacyState(store.getState());

      store.getState().setDisplaySets([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-3'] }]);
      const legacy2 = assembleLegacyState(store.getState());

      expect(legacy2.viewports.get('a')).not.toBe(legacy1.viewports.get('a'));
      expect(legacy2.viewports.get('b')).toBe(legacy1.viewports.get('b'));
      expect(legacy2.viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-3']);
    });
  });

  describe('selectors and subscriptions', () => {
    it('selectViewport and selectIsActive read the expected slices', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1']), vp('b', ['ds-2'])], { activeViewportId: 'a' });
      const state = store.getState();

      expect(selectViewport('a')(state)).toBe(state.viewports.get('a'));
      expect(selectViewport('missing')(state)).toBeUndefined();
      expect(selectIsActive('a')(state)).toBe(true);
      expect(selectIsActive('b')(state)).toBe(false);
      expect(selectActiveViewportId(state)).toBe('a');
      expect(selectLayout(state)).toBe(state.layout);
    });

    it('selectStability reflects derived state and stays shallow-equal between unrelated changes', () => {
      const { store } = makeStore();
      applyGrid(store, [vp('a', ['ds-1'])]);

      const before = selectStability('rendered')(store.getState());
      expect(before).toEqual({
        isStable: false,
        epoch: store.getState().derived.epoch,
        pending: ['a'],
      });

      store.getState().setActiveViewport('a');
      const after = selectStability('rendered')(store.getState());
      expect(shallowEqual(before, after)).toBe(true);

      store.getState().reportPhase('a', 'rendered', 1);
      const rendered = selectStability('rendered')(store.getState());
      expect(rendered.isStable).toBe(true);
      expect(rendered.pending).toEqual([]);
      expect(shallowEqual(before, rendered)).toBe(false);

      expect(selectStability('settled')(store.getState()).isStable).toBe(true);
      expect(selectStability('mounted')(store.getState()).isStable).toBe(true);
    });

    it('subscribeWithSelector notifies layout subscribers on layout transactions only', () => {
      const { store } = makeStore();
      const layoutListener = jest.fn();
      const activeListener = jest.fn();

      store.subscribe(selectLayout, layoutListener);
      store.subscribe(selectActiveViewportId, activeListener);

      applyGrid(store, [vp('a', ['ds-1'])]);
      expect(layoutListener).toHaveBeenCalledTimes(1);

      store.getState().reportPhase('a', 'mounted', 1);
      expect(layoutListener).toHaveBeenCalledTimes(1);

      store.getState().setActiveViewport('a');
      expect(layoutListener).toHaveBeenCalledTimes(1);
      expect(activeListener).toHaveBeenLastCalledWith('a', null);
    });
  });
});
