import { Enums, eventTarget } from '@cornerstonejs/core';
import { createViewportRuntimeManager } from './viewportRuntime';
import type { ViewportRuntimeManager } from './viewportRuntime';

const VIEWPORT_ID = 'viewport-1';

/** Legacy stack viewport mock: routes through LegacyViewportAdapter. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStackViewport(overrides: Record<string, unknown> = {}): any {
  return {
    id: VIEWPORT_ID,
    type: Enums.ViewportType.STACK,
    getProperties: jest.fn().mockReturnValue({ voiRange: { lower: 0, upper: 100 } }),
    getCamera: jest.fn().mockReturnValue({ viewPlaneNormal: [0, 0, 1], focalPoint: [1, 2, 3] }),
    getActors: jest.fn().mockReturnValue([{ referencedId: 'imageId:abc' }]),
    getViewReference: jest.fn().mockReturnValue({ referencedImageId: 'imageId:abc' }),
    getCurrentImageIdIndex: jest.fn().mockReturnValue(1),
    getNumberOfSlices: jest.fn().mockReturnValue(3),
    ...overrides,
  };
}

function makeStackViewportData() {
  return {
    viewportType: Enums.ViewportType.STACK,
    data: [{ displaySetInstanceUID: 'ds-1', imageIds: ['imageId:a', 'imageId:b', 'imageId:c'] }],
  };
}

function makeVolumeViewportData({ loaded = false } = {}) {
  return {
    viewportType: Enums.ViewportType.ORTHOGRAPHIC,
    data: [
      {
        displaySetInstanceUID: 'ds-1',
        volumeId: 'vol-1',
        volume: { volumeId: 'vol-1', loadStatus: { loaded } },
      },
    ],
  };
}

function makeGridService({ compositionRevision = 7, phase = 'mounted' } = {}) {
  const composition = { viewportId: VIEWPORT_ID, compositionRevision };
  const runtimeEntry = { phase, forRevision: compositionRevision, pendingWork: 0 };
  return {
    getViewportComposition: jest.fn(() => composition),
    reportPhase: jest.fn(),
    beginWork: jest.fn(),
    endWork: jest.fn(),
    getStore: jest.fn(() => ({
      getState: () => ({
        runtime: new Map([[VIEWPORT_ID, runtimeEntry]]),
        viewports: new Map([[VIEWPORT_ID, composition]]),
      }),
    })),
  };
}

type Harness = {
  manager: ViewportRuntimeManager;
  element: HTMLDivElement;
  viewport: ReturnType<typeof makeStackViewport> | null;
  viewportData: Record<string, unknown> | undefined;
  gridService: ReturnType<typeof makeGridService> | null;
  addSpy: jest.SpyInstance;
  removeSpy: jest.SpyInstance;
};

// gridService: pass null (not undefined) to simulate a missing grid service;
// an explicit undefined argument would fall back to this default.
function makeHarness({
  viewport = makeStackViewport(),
  viewportData = makeStackViewportData() as Record<string, unknown> | undefined,
  gridService = makeGridService() as ReturnType<typeof makeGridService> | null,
} = {}): Harness {
  const element = document.createElement('div');
  const addSpy = jest.spyOn(element, 'addEventListener');
  const removeSpy = jest.spyOn(element, 'removeEventListener');

  const harness: Partial<Harness> = { element, viewport, viewportData, gridService, addSpy, removeSpy };

  const manager = createViewportRuntimeManager({
    servicesManager: {
      services: { viewportGridService: gridService },
    } as unknown as AppTypes.ServicesManager,
    getCornerstoneViewport: () => harness.viewport,
    getViewportInfo: () =>
      ({
        getElement: () => element,
        getViewportData: () => harness.viewportData,
      }) as never,
  });

  harness.manager = manager;
  return harness as Harness;
}

function dispatch(element: HTMLElement, eventName: string, detail: unknown = {}) {
  element.dispatchEvent(new CustomEvent(eventName, { detail }));
}

describe('viewportRuntime', () => {
  let rafQueue: FrameRequestCallback[];
  let rafSpy: jest.SpyInstance;
  let cafSpy: jest.SpyInstance;

  const flushRaf = () => {
    const queued = rafQueue;
    rafQueue = [];
    queued.forEach(callback => callback(0));
  };

  beforeEach(() => {
    rafQueue = [];
    rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        rafQueue.push(callback);
        return rafQueue.length;
      });
    cafSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  describe('bind / release listener lifecycle', () => {
    it('wires slice, VOI, colormap, camera and render listeners on bind', () => {
      const { manager, element, addSpy } = makeHarness();
      manager.bind(VIEWPORT_ID);

      const wired = addSpy.mock.calls.map(([eventName]) => eventName);
      expect(wired).toEqual(
        expect.arrayContaining([
          Enums.Events.STACK_NEW_IMAGE,
          Enums.Events.VOI_MODIFIED,
          Enums.Events.COLORMAP_MODIFIED,
          Enums.Events.CAMERA_MODIFIED,
          Enums.Events.IMAGE_RENDERED,
        ])
      );
      expect(element).toBeDefined();
    });

    it('removes every wired listener on release (no leaks)', () => {
      const { manager, addSpy, removeSpy } = makeHarness();
      manager.bind(VIEWPORT_ID);
      manager.release(VIEWPORT_ID);

      const added = addSpy.mock.calls.map(([eventName, handler]) => [eventName, handler]);
      const removed = removeSpy.mock.calls.map(([eventName, handler]) => [eventName, handler]);
      expect(removed).toEqual(expect.arrayContaining(added));
      expect(removed.length).toBe(added.length);
    });

    it('rebinding detaches the previous listeners before wiring new ones', () => {
      const { manager, element, addSpy, removeSpy } = makeHarness();
      manager.bind(VIEWPORT_ID);
      const firstBindCount = addSpy.mock.calls.length;

      manager.bind(VIEWPORT_ID);
      expect(removeSpy.mock.calls.length).toBe(firstBindCount);

      // Events keep bumping through the fresh listeners.
      const before = manager.get(VIEWPORT_ID).revision;
      dispatch(element, Enums.Events.VOI_MODIFIED);
      expect(manager.get(VIEWPORT_ID).revision).toBe(before + 1);
    });

    it('does not crash and still bumps when the grid service is missing', () => {
      const { manager, element } = makeHarness({ gridService: null });
      expect(() => manager.bind(VIEWPORT_ID)).not.toThrow();
      const before = manager.get(VIEWPORT_ID).revision;
      dispatch(element, Enums.Events.IMAGE_RENDERED);
      expect(manager.get(VIEWPORT_ID).revision).toBe(before + 1);
    });
  });

  describe('revision bumps', () => {
    it.each([
      Enums.Events.STACK_NEW_IMAGE,
      Enums.Events.VOI_MODIFIED,
      Enums.Events.COLORMAP_MODIFIED,
      Enums.Events.IMAGE_RENDERED,
    ])('bumps the revision on %s', eventName => {
      const { manager, element } = makeHarness();
      manager.bind(VIEWPORT_ID);
      const before = manager.get(VIEWPORT_ID).revision;

      dispatch(element, eventName);
      expect(manager.get(VIEWPORT_ID).revision).toBe(before + 1);
    });

    it('coalesces CAMERA_MODIFIED bursts into one rAF-driven bump', () => {
      const { manager, element } = makeHarness();
      manager.bind(VIEWPORT_ID);
      const before = manager.get(VIEWPORT_ID).revision;

      dispatch(element, Enums.Events.CAMERA_MODIFIED);
      dispatch(element, Enums.Events.CAMERA_MODIFIED);
      dispatch(element, Enums.Events.CAMERA_MODIFIED);

      expect(rafQueue.length).toBe(1);
      expect(manager.get(VIEWPORT_ID).revision).toBe(before);

      flushRaf();
      expect(manager.get(VIEWPORT_ID).revision).toBe(before + 1);

      // A new burst after the flush schedules a fresh frame.
      dispatch(element, Enums.Events.CAMERA_MODIFIED);
      expect(rafQueue.length).toBe(1);
    });

    it('cancels a pending camera frame on release', () => {
      const { manager, element } = makeHarness();
      manager.bind(VIEWPORT_ID);
      dispatch(element, Enums.Events.CAMERA_MODIFIED);

      manager.release(VIEWPORT_ID);
      expect(cafSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('snapshots', () => {
    it('returns the same snapshot object until the revision changes', () => {
      const { manager, element } = makeHarness();
      manager.bind(VIEWPORT_ID);

      const first = manager.get(VIEWPORT_ID);
      expect(manager.get(VIEWPORT_ID)).toBe(first);

      dispatch(element, Enums.Events.VOI_MODIFIED);
      const second = manager.get(VIEWPORT_ID);
      expect(second).not.toBe(first);
      expect(second.revision).toBe(first.revision + 1);
      expect(manager.get(VIEWPORT_ID)).toBe(second);
    });

    it('computes shape, display sets, slice position and phase read-through', () => {
      const { manager } = makeHarness();
      manager.bind(VIEWPORT_ID);

      const snapshot = manager.get(VIEWPORT_ID);
      expect(snapshot.shape).toBe('stack');
      expect(snapshot.displaySetInstanceUIDs).toEqual(['ds-1']);
      expect(snapshot.sliceIndex).toBe(1);
      // Stack slice count comes from the bound imageIds, as the scrollbar does.
      expect(snapshot.numSlices).toBe(3);
      expect(snapshot.viewReference).toEqual({ referencedImageId: 'imageId:abc' });
      expect(snapshot.viewState).toEqual({ viewPlaneNormal: [0, 0, 1], focalPoint: [1, 2, 3] });
      expect(snapshot.presentation).toEqual({ voiRange: { lower: 0, upper: 100 } });
      // Phase is read from the grid store's runtime entry.
      expect(snapshot.phase).toBe('mounted');
    });

    it('returns an inert detached snapshot when the cornerstone viewport is missing', () => {
      const harness = makeHarness();
      harness.manager.bind(VIEWPORT_ID);
      harness.viewport = null;
      harness.manager.release(VIEWPORT_ID);

      const snapshot = harness.manager.get(VIEWPORT_ID);
      expect(snapshot.phase).toBe('detached');
      expect(snapshot.shape).toBe('unknown');
      expect(snapshot.displaySetInstanceUIDs).toEqual([]);
      // Cached until the next bump.
      expect(harness.manager.get(VIEWPORT_ID)).toBe(snapshot);
    });

    it('falls back to local phase tracking when the grid store is unavailable', () => {
      const { manager, element } = makeHarness({ gridService: null });
      manager.bind(VIEWPORT_ID);
      expect(manager.get(VIEWPORT_ID).phase).toBe('mounted');

      dispatch(element, Enums.Events.IMAGE_RENDERED);
      expect(manager.get(VIEWPORT_ID).phase).toBe('rendered');
    });
  });

  describe('rendered phase reporting', () => {
    it('reports rendered exactly once per bind, with the bound composition revision', () => {
      const { manager, element, gridService } = makeHarness();
      manager.bind(VIEWPORT_ID);

      dispatch(element, Enums.Events.IMAGE_RENDERED);
      dispatch(element, Enums.Events.IMAGE_RENDERED);

      expect(gridService.reportPhase).toHaveBeenCalledTimes(1);
      expect(gridService.reportPhase).toHaveBeenCalledWith(VIEWPORT_ID, 'rendered', 7);
    });

    it('rebinding resets the first-render tracking', () => {
      const { manager, element, gridService } = makeHarness();
      manager.bind(VIEWPORT_ID);
      dispatch(element, Enums.Events.IMAGE_RENDERED);

      manager.bind(VIEWPORT_ID);
      dispatch(element, Enums.Events.IMAGE_RENDERED);

      expect(gridService.reportPhase).toHaveBeenCalledTimes(2);
    });
  });

  describe('volume work tokens', () => {
    it('holds a work token while bound volumes stream and ends it on completion', () => {
      const { manager, gridService } = makeHarness({
        viewportData: makeVolumeViewportData(),
      });
      manager.bind(VIEWPORT_ID);

      const token = `volume-stream:${VIEWPORT_ID}`;
      expect(gridService.beginWork).toHaveBeenCalledWith(VIEWPORT_ID, token);
      expect(gridService.endWork).not.toHaveBeenCalled();

      eventTarget.dispatchEvent(
        new CustomEvent(Enums.Events.IMAGE_VOLUME_LOADING_COMPLETED, {
          detail: { volumeId: 'vol-1' },
        })
      );
      expect(gridService.endWork).toHaveBeenCalledWith(VIEWPORT_ID, token);
    });

    it('ignores completions for volumes not bound to this viewport', () => {
      const { manager, gridService } = makeHarness({
        viewportData: makeVolumeViewportData(),
      });
      manager.bind(VIEWPORT_ID);

      eventTarget.dispatchEvent(
        new CustomEvent(Enums.Events.IMAGE_VOLUME_LOADING_COMPLETED, {
          detail: { volumeId: 'other-volume' },
        })
      );
      expect(gridService.endWork).not.toHaveBeenCalled();
      manager.destroy();
    });

    it('skips the token entirely when the volume is already loaded', () => {
      const { manager, gridService } = makeHarness({
        viewportData: makeVolumeViewportData({ loaded: true }),
      });
      manager.bind(VIEWPORT_ID);
      expect(gridService.beginWork).not.toHaveBeenCalled();
    });

    it('ends an open token when the viewport is released mid-stream', () => {
      const { manager, gridService } = makeHarness({
        viewportData: makeVolumeViewportData(),
      });
      manager.bind(VIEWPORT_ID);
      manager.release(VIEWPORT_ID);
      expect(gridService.endWork).toHaveBeenCalledWith(VIEWPORT_ID, `volume-stream:${VIEWPORT_ID}`);
    });

    it('does not hold tokens for stack content', () => {
      const { manager, gridService } = makeHarness();
      manager.bind(VIEWPORT_ID);
      expect(gridService.beginWork).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('notifies subscribers on every bump and stops after unsubscribe', () => {
      const { manager, element } = makeHarness();
      manager.bind(VIEWPORT_ID);

      const callback = jest.fn();
      const unsubscribe = manager.subscribe(VIEWPORT_ID, callback);

      dispatch(element, Enums.Events.VOI_MODIFIED);
      expect(callback).toHaveBeenCalledTimes(1);

      dispatch(element, Enums.Events.IMAGE_RENDERED);
      expect(callback).toHaveBeenCalledTimes(2);

      unsubscribe();
      dispatch(element, Enums.Events.VOI_MODIFIED);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('notifies on release so consumers re-read the inert snapshot', () => {
      const { manager } = makeHarness();
      manager.bind(VIEWPORT_ID);

      const callback = jest.fn();
      manager.subscribe(VIEWPORT_ID, callback);
      manager.release(VIEWPORT_ID);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('already-rendered detection at bind', () => {
    it('reports rendered immediately when the viewport has already rendered its content', () => {
      const { manager, element, gridService } = makeHarness({
        viewport: makeStackViewport({ viewportStatus: Enums.ViewportStatus.RENDERED }),
      });
      manager.bind(VIEWPORT_ID);

      expect(gridService.reportPhase).toHaveBeenCalledTimes(1);
      expect(gridService.reportPhase).toHaveBeenCalledWith(VIEWPORT_ID, 'rendered', 7);

      // A later render does not double-report; it only bumps.
      dispatch(element, Enums.Events.IMAGE_RENDERED);
      expect(gridService.reportPhase).toHaveBeenCalledTimes(1);
    });

    it('waits for IMAGE_RENDERED when the viewport has not rendered yet', () => {
      const { manager, element, gridService } = makeHarness({
        viewport: makeStackViewport({ viewportStatus: Enums.ViewportStatus.PRE_RENDER }),
      });
      manager.bind(VIEWPORT_ID);
      expect(gridService.reportPhase).not.toHaveBeenCalled();

      dispatch(element, Enums.Events.IMAGE_RENDERED);
      expect(gridService.reportPhase).toHaveBeenCalledWith(VIEWPORT_ID, 'rendered', 7);
    });
  });

  describe('grid-store runtime mirroring', () => {
    // A grid service whose select works like the real facade for a single
    // runtime-slice selector: listeners fire when triggerRuntimeChange runs.
    function makeSelectableGridService({ compositionRevision = 7 } = {}) {
      const composition = { viewportId: VIEWPORT_ID, compositionRevision };
      const runtimeEntry = {
        phase: 'mounted',
        forRevision: compositionRevision,
        pendingWork: 0,
      };
      const state = {
        runtime: new Map([[VIEWPORT_ID, runtimeEntry]]),
        viewports: new Map([[VIEWPORT_ID, composition]]),
      };
      const listeners = new Set<() => void>();
      const unsubscribes: jest.Mock[] = [];
      const gridService = {
        getViewportComposition: jest.fn(() => composition),
        reportPhase: jest.fn(),
        beginWork: jest.fn(),
        endWork: jest.fn(),
        getStore: jest.fn(() => ({ getState: () => state })),
        select: jest.fn((_selector, listener) => {
          listeners.add(listener);
          const unsubscribe = jest.fn(() => listeners.delete(listener));
          unsubscribes.push(unsubscribe);
          return unsubscribe;
        }),
      };
      const triggerRuntimeChange = (phase: string) => {
        // New entry object at the same revision, as the store produces.
        state.runtime.set(VIEWPORT_ID, { ...runtimeEntry, phase });
        listeners.forEach(listener => listener());
      };
      return { gridService, triggerRuntimeChange, unsubscribes };
    }

    it('bumps the revision and re-reads the phase on a store-only transition', () => {
      const { gridService, triggerRuntimeChange } = makeSelectableGridService();
      const { manager } = makeHarness({ gridService: gridService as never });
      manager.bind(VIEWPORT_ID);

      const callback = jest.fn();
      manager.subscribe(VIEWPORT_ID, callback);
      const before = manager.get(VIEWPORT_ID);
      expect(before.phase).toBe('mounted');

      // No element event fires: only the grid store changes (eg endWork
      // settling the viewport after volume streaming completes).
      triggerRuntimeChange('settled');

      expect(callback).toHaveBeenCalledTimes(1);
      const after = manager.get(VIEWPORT_ID);
      expect(after.revision).toBe(before.revision + 1);
      expect(after.phase).toBe('settled');
    });

    it('disposes the mirror subscription on release', () => {
      const { gridService, triggerRuntimeChange, unsubscribes } = makeSelectableGridService();
      const { manager } = makeHarness({ gridService: gridService as never });
      manager.bind(VIEWPORT_ID);
      expect(gridService.select).toHaveBeenCalledTimes(1);

      manager.release(VIEWPORT_ID);
      expect(unsubscribes[0]).toHaveBeenCalledTimes(1);

      const callback = jest.fn();
      manager.subscribe(VIEWPORT_ID, callback);
      triggerRuntimeChange('settled');
      expect(callback).not.toHaveBeenCalled();
    });

    it('replaces the mirror subscription on rebind', () => {
      const { gridService, unsubscribes } = makeSelectableGridService();
      const { manager } = makeHarness({ gridService: gridService as never });
      manager.bind(VIEWPORT_ID);
      manager.bind(VIEWPORT_ID);

      expect(gridService.select).toHaveBeenCalledTimes(2);
      expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
      expect(unsubscribes[1]).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('removes all listeners and clears subscribers', () => {
      const { manager, element, addSpy, removeSpy } = makeHarness();
      manager.bind(VIEWPORT_ID);

      const callback = jest.fn();
      manager.subscribe(VIEWPORT_ID, callback);

      manager.destroy();
      expect(removeSpy.mock.calls.length).toBe(addSpy.mock.calls.length);

      dispatch(element, Enums.Events.VOI_MODIFIED);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
