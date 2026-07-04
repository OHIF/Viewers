import ViewportGridService from './ViewportGridService';
import { selectActiveViewportId, selectLayout } from './gridSelectors';

// uuidv4 relies on crypto.getRandomValues, which older jsdom builds omit.
if (typeof globalThis.crypto?.getRandomValues !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { webcrypto } = require('crypto');
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

function makeService() {
  return new ViewportGridService({ servicesManager: {} as never });
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
  specs: Array<Record<string, unknown> | undefined>,
  opts: Record<string, unknown> = {}
) {
  return service.setLayout({
    numRows: (opts.numRows as number) ?? 1,
    numCols: (opts.numCols as number) ?? specs.length,
    layoutOptions: (opts.layoutOptions as []) ?? [],
    activeViewportId: opts.activeViewportId as string,
    isHangingProtocolLayout: (opts.isHangingProtocolLayout as boolean) ?? false,
    findOrCreateViewport: position => specs[position],
  });
}

describe('ViewportGridService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('getState', () => {
    it('reflects setDisplaySetsForViewports synchronously, before and after the await', async () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1'])]);

      const promise = service.setDisplaySetsForViewports([
        { viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] },
      ]);

      // Synchronously current, without flushing the deferred events.
      expect(service.getState().viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-2']);

      await promise;
      expect(service.getState().viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-2']);
      expect(service.getDisplaySetsUIDsForViewport('a')).toEqual(['ds-2']);
    });

    it('reflects setLayout synchronously and assembles the legacy shape', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])], { activeViewportId: 'a' });

      const state = service.getState();
      expect(state.activeViewportId).toBe('a');
      expect(state.layout).toEqual({ numRows: 1, numCols: 2, layoutType: 'grid' });
      expect(state.viewports.get('b')).toMatchObject({
        viewportId: 'b',
        x: 0.5,
        y: 0,
        width: 0.5,
        height: 1,
        isReady: false,
      });
      expect(service.getNumViewportPanes()).toBe(2);
      expect(service.getActiveViewportId()).toBe('a');
    });

    it('getViewportState returns the legacy entry and getViewportComposition the store entry', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1'])]);

      const legacy = service.getViewportState('a');
      expect(legacy).toMatchObject({ viewportId: 'a', isReady: false, x: 0, width: 1 });
      expect(legacy).not.toHaveProperty('compositionRevision');

      const composition = service.getViewportComposition('a');
      expect(composition).toMatchObject({ viewportId: 'a', compositionRevision: 1 });
      expect(composition).not.toHaveProperty('isReady');
    });
  });

  describe('event ordering', () => {
    it('defers LAYOUT_CHANGED and GRID_STATE_CHANGED and fires them in that order', () => {
      const service = makeService();
      const received: Array<{ event: string; payload }> = [];
      service.subscribe(ViewportGridService.EVENTS.LAYOUT_CHANGED, payload =>
        received.push({ event: 'layout', payload })
      );
      service.subscribe(ViewportGridService.EVENTS.GRID_STATE_CHANGED, payload =>
        received.push({ event: 'grid', payload })
      );

      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);

      // Deferred: nothing before the macrotask runs.
      expect(received).toEqual([]);

      jest.runAllTimers();

      expect(received.map(r => r.event)).toEqual(['layout', 'grid']);
      expect(received[0].payload).toEqual({ numCols: 2, numRows: 1 });
      expect(received[1].payload.state.viewports.size).toBe(2);
      expect(received[1].payload.removedViewportIds).toEqual(['default']);
    });

    it('defers GRID_STATE_CHANGED for setDisplaySetsForViewports with updated and removed viewports', async () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      jest.runAllTimers();

      const received = [];
      service.subscribe(ViewportGridService.EVENTS.GRID_STATE_CHANGED, payload =>
        received.push(payload)
      );

      await service.setDisplaySetsForViewports([
        { viewportId: 'a', displaySetInstanceUIDs: ['ds-3'] },
        { viewportId: 'b', displaySetInstanceUIDs: [] },
      ]);
      expect(received).toEqual([]);

      jest.runAllTimers();

      expect(received).toHaveLength(1);
      const [payload] = received;
      expect(payload.viewports.map(v => v.viewportId)).toEqual(['a', 'b']);
      // The cleared viewport is reported as removed even though it still exists.
      expect(payload.removedViewportIds).toEqual(['b']);
      expect(payload.state.viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-3']);
    });

    it('defers ACTIVE_VIEWPORT_ID_CHANGED and early-returns for the unchanged id', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])], { activeViewportId: 'a' });
      jest.runAllTimers();

      const received = [];
      service.subscribe(ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED, payload =>
        received.push(payload)
      );

      service.setActiveViewportId('a');
      jest.runAllTimers();
      expect(received).toEqual([]);

      service.setActiveViewportId('b');
      expect(service.getActiveViewportId()).toBe('b');
      expect(received).toEqual([]);
      jest.runAllTimers();
      expect(received).toEqual([{ viewportId: 'b' }]);
    });
  });

  describe('VIEWPORTS_READY', () => {
    it('auto-publishes, deferred, when the last content viewport mounts', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);

      service.setViewportIsReady('a', true);
      expect(service.getGridViewportsReady()).toBe(false);
      jest.runAllTimers();
      expect(readyListener).not.toHaveBeenCalled();

      service.setViewportIsReady('b', true);
      expect(service.getGridViewportsReady()).toBe(true);
      // Deferred, matching the other grid events.
      expect(readyListener).not.toHaveBeenCalled();

      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);
    });

    it('publishes exactly once per layoutRevision even when readiness re-flips', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1'])]);
      service.setViewportIsReady('a', true);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);

      // allMounted flips false and back true within the same layoutRevision.
      service.setViewportIsReady('a', false);
      service.setViewportIsReady('a', true);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);
    });

    it('a relayout that carries the runtime forward publishes for the new revision', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1'])]);
      service.setViewportIsReady('a', true);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);

      // Content-identical relayout: the composition and runtime are carried,
      // so allMounted is already true inside the applyLayout transaction and
      // never transitions for the new layoutRevision.
      setGrid(service, [vp('a', ['ds-1'])]);
      expect(service.getGridViewportsReady()).toBe(true);

      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(2);
    });

    it('manual publishViewportsReady after the auto publish is a no-op', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1'])]);
      service.setViewportIsReady('a', true);

      // Manual call while the auto publish is still deferred: same revision,
      // already marked, so it cannot double-fire.
      service.publishViewportsReady();
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);

      service.publishViewportsReady();
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);
    });

    it('manual publishViewportsReady before allMounted broadcasts but does not suppress the auto publish', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);

      // Unconditional with respect to readiness and synchronous, matching the
      // old manual semantics; a premature call does not consume the
      // revision's publish slot.
      service.publishViewportsReady();
      expect(readyListener).toHaveBeenCalledTimes(1);
      service.publishViewportsReady();
      expect(readyListener).toHaveBeenCalledTimes(2);

      // The genuine all-mounted transition still auto-publishes.
      service.setViewportIsReady('a', true);
      service.setViewportIsReady('b', true);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(3);

      // Once the revision is published, further manual calls are no-ops.
      service.publishViewportsReady();
      expect(readyListener).toHaveBeenCalledTimes(3);
    });

    it('an aborted deferred publish leaves the slot free for the genuine mount (restore then remount)', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      service.setViewportIsReady('a', true);
      service.setViewportIsReady('b', true);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);

      const snap = service.snapshot();
      setGrid(service, [vp('a', ['ds-1'])]);
      service.setViewportIsReady('a', true);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(2);

      // Toggle-back: restore() reinstates the snapshot's mounted runtime, so
      // allMounted is already true inside the restore transaction and a
      // deferred publish is scheduled for the new layoutRevision...
      service.restore(snap);
      expect(service.getGridViewportsReady()).toBe(true);
      // ...but a remounting viewport's mount-start invalidation lands before
      // the timer runs, so the deferred publish must abort without consuming
      // the revision's publish slot.
      service.setViewportIsReady('b', false);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(2);

      // The genuine all-mounted transition for the restored layout publishes.
      service.setViewportIsReady('b', true);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(3);
    });

    it('a dip that recovers before the deferred publish runs still publishes exactly once', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1'])]);
      service.setViewportIsReady('a', true);
      // The selector fires again for the recovery within the same revision;
      // the pending timer must not be double-scheduled.
      service.setViewportIsReady('a', false);
      service.setViewportIsReady('a', true);

      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);
    });

    it('does not publish a deferred ready for a superseded layoutRevision', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1'])]);
      service.setViewportIsReady('a', true);

      // Before the deferred publish runs, a relayout supersedes the mounted
      // revision with one whose viewports are not all mounted.
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      jest.runAllTimers();
      expect(readyListener).not.toHaveBeenCalled();

      // The new revision publishes when it genuinely mounts.
      service.setViewportIsReady('a', true);
      service.setViewportIsReady('b', true);
      jest.runAllTimers();
      expect(readyListener).toHaveBeenCalledTimes(1);
    });

    it('never publishes while a content viewport stays unmounted', () => {
      const service = makeService();
      const readyListener = jest.fn();
      service.subscribe(ViewportGridService.EVENTS.VIEWPORTS_READY, readyListener);

      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      service.setViewportIsReady('a', true);

      jest.runAllTimers();
      expect(readyListener).not.toHaveBeenCalled();
    });

    it('setViewportIsReady(false) detaches readiness and it can be re-reported', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1'])]);

      service.setViewportIsReady('a', true);
      expect(service.getGridViewportsReady()).toBe(true);

      service.setViewportIsReady('a', false);
      expect(service.getGridViewportsReady()).toBe(false);
      expect(service.getViewportState('a').isReady).toBe(false);

      service.setViewportIsReady('a', true);
      expect(service.getGridViewportsReady()).toBe(true);
      expect(service.getViewportState('a').isReady).toBe(true);
    });
  });

  describe('isReady preservation across compatibility flows', () => {
    // Regression: the HP restoreProtocol flow calls set() with a snapshot
    // whose entries carry isReady true; reused viewportIds keep their enabled
    // elements, so nothing re-reports mounted after the restore.
    it('set preserves isReady from a legacy-shaped snapshot', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      service.setViewportIsReady('a', true);
      service.setViewportIsReady('b', true);

      const snapshotState = service.getState();
      expect(snapshotState.viewports.get('a').isReady).toBe(true);

      setGrid(service, [vp('c', ['ds-3'])]);
      expect(service.getGridViewportsReady()).toBe(false);

      service.set({ ...snapshotState });

      expect(service.getViewportState('a').isReady).toBe(true);
      expect(service.getViewportState('b').isReady).toBe(true);
      expect(service.getGridViewportsReady()).toBe(true);
    });

    // Regression: a display set swap on a reused element (drag and drop, the
    // 3D overlay background path) emits no new ELEMENT_ENABLED; the old
    // SET_DISPLAYSETS reducer never touched isReady.
    it('setDisplaySetsForViewports preserves isReady on the updated viewport', async () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      service.setViewportIsReady('a', true);
      service.setViewportIsReady('b', true);
      expect(service.getGridViewportsReady()).toBe(true);

      await service.setDisplaySetsForViewports([
        { viewportId: 'a', displaySetInstanceUIDs: ['ds-3'] },
      ]);

      expect(service.getViewportState('a').isReady).toBe(true);
      expect(service.getGridViewportsReady()).toBe(true);
    });

    it('a setDisplaySetsForViewports landing mid-mount does not block overall readiness', async () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);

      // First element enables, then a display set update lands before the
      // second element enables (eg auto hydration on load).
      service.setViewportIsReady('a', true);
      await service.setDisplaySetsForViewports([
        { viewportId: 'a', displaySetInstanceUIDs: ['ds-3'] },
      ]);

      service.setViewportIsReady('b', true);
      expect(service.getGridViewportsReady()).toBe(true);
    });
  });

  describe('select', () => {
    it('fires listeners for the selected slice only', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])], { activeViewportId: 'a' });

      const layoutListener = jest.fn();
      const activeListener = jest.fn();
      const unsubscribeLayout = service.select(selectLayout, layoutListener);
      service.select(selectActiveViewportId, activeListener);

      service.setActiveViewportId('b');
      expect(activeListener).toHaveBeenCalledTimes(1);
      expect(activeListener).toHaveBeenLastCalledWith('b', 'a');
      expect(layoutListener).not.toHaveBeenCalled();

      service.setViewportIsReady('b', true);
      expect(layoutListener).not.toHaveBeenCalled();
      expect(activeListener).toHaveBeenCalledTimes(1);

      setGrid(service, [vp('a', ['ds-1'])]);
      expect(layoutListener).toHaveBeenCalledTimes(1);

      unsubscribeLayout();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      expect(layoutListener).toHaveBeenCalledTimes(1);
    });

    it('supports equality and fireImmediately options', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1'])]);

      const listener = jest.fn();
      service.select(state => state.viewports.get('a')?.displaySetInstanceUIDs, listener, {
        equality: (x, y) => JSON.stringify(x) === JSON.stringify(y),
        fireImmediately: true,
      });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(['ds-1'], ['ds-1']);

      // Composition changes, but the selected value is equal under the
      // provided equality: no notification.
      service.setDisplaySetsForViewports([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-1'] }]);
      expect(listener).toHaveBeenCalledTimes(1);

      service.setDisplaySetsForViewports([{ viewportId: 'a', displaySetInstanceUIDs: ['ds-2'] }]);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('a throwing listener does not abort the writing transaction or sibling listeners', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])], { activeViewportId: 'a' });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const seen: Array<string | null> = [];
      service.select(selectActiveViewportId, () => {
        throw new Error('consumer boom');
      });
      service.select(selectActiveViewportId, activeViewportId => seen.push(activeViewportId));

      expect(() => service.setActiveViewportId('b')).not.toThrow();
      expect(service.getActiveViewportId()).toBe('b');
      expect(seen).toEqual(['b']);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('deprecated and compatibility surface', () => {
    it('setServiceImplementation is a warn-once no-op', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const service = makeService();

      service.setServiceImplementation({ getState: () => ({}) });
      service.setServiceImplementation({ setLayout: () => undefined });

      expect(warn).toHaveBeenCalledTimes(1);

      // The store keeps answering reads after the no-op injection.
      setGrid(service, [vp('a', ['ds-1'])]);
      expect(service.getState().viewports.has('a')).toBe(true);
    });

    it('isReferenceViewable matches the historical injected stub', () => {
      const service = makeService();
      expect(service.isReferenceViewable('a', {}, {})).toBe(false);
    });

    it('set replaces state from a legacy-shaped snapshot and defers GRID_STATE_CHANGED', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1']), vp('b', ['ds-2'])]);
      jest.runAllTimers();

      // A legacy snapshot, the shape reuseCachedLayouts stores.
      const snapshotState = service.getState();

      setGrid(service, [vp('c', ['ds-3'])]);
      jest.runAllTimers();

      const received = [];
      service.subscribe(ViewportGridService.EVENTS.GRID_STATE_CHANGED, payload =>
        received.push(payload)
      );

      service.set({ ...snapshotState });

      const state = service.getState();
      expect([...state.viewports.keys()]).toEqual(['a', 'b']);
      expect(state.layout).toEqual({ numRows: 1, numCols: 2, layoutType: 'grid' });
      expect(state.viewports.get('b')).toMatchObject({ x: 0.5, width: 0.5, isReady: false });

      expect(received).toEqual([]);
      jest.runAllTimers();
      expect(received).toHaveLength(1);
      expect(received[0].removedViewportIds).toEqual(['c']);
    });

    it('reset and onModeExit restore the default state without events', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1'])]);
      jest.runAllTimers();

      const received = [];
      Object.values(ViewportGridService.EVENTS).forEach(event =>
        service.subscribe(event, payload => received.push({ event, payload }))
      );

      service.reset();
      jest.runAllTimers();

      expect(received).toEqual([]);
      expect(service.getState().viewports.has('a')).toBe(false);
      expect(service.getState().viewports.has('default')).toBe(true);

      setGrid(service, [vp('a', ['ds-1'])]);
      jest.runAllTimers();
      received.length = 0;

      service.onModeExit();
      jest.runAllTimers();
      expect(received).toEqual([]);
      expect(service.getState().viewports.has('default')).toBe(true);
    });
  });

  describe('store passthroughs', () => {
    it('reportPhase, beginWork and endWork drive readiness through the service', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1'])]);

      const revision = service.getViewportComposition('a').compositionRevision;
      service.reportPhase('a', 'rendered', revision);
      expect(service.getViewportState('a').isReady).toBe(true);
      expect(service.getStore().getState().derived.allSettled).toBe(true);

      service.beginWork('a', 'streaming');
      expect(service.getStore().getState().derived.allSettled).toBe(false);
      service.endWork('a', 'streaming');
      expect(service.getStore().getState().derived.allSettled).toBe(true);
    });

    it('bumpComposition invalidates readiness and stale phase reports stay inert', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1'])]);
      const revision = service.getViewportComposition('a').compositionRevision;
      service.reportPhase('a', 'mounted', revision);
      expect(service.getViewportState('a').isReady).toBe(true);

      service.bumpComposition('a', 'segmentation-hydrated');
      expect(service.getViewportState('a').isReady).toBe(false);

      service.reportPhase('a', 'rendered', revision);
      expect(service.getViewportState('a').isReady).toBe(false);
    });

    it('snapshot and restore round-trip through the service', () => {
      const service = makeService();
      setGrid(service, [vp('a', ['ds-1'])], { activeViewportId: 'a' });
      const snap = service.snapshot();

      setGrid(service, [vp('b', ['ds-2'])], { activeViewportId: 'b' });
      expect(service.getState().viewports.has('a')).toBe(false);

      service.restore(snap);
      expect(service.getState().activeViewportId).toBe('a');
      expect(service.getState().viewports.get('a').displaySetInstanceUIDs).toEqual(['ds-1']);
    });
  });
});
