import { compareMountIntent, createViewportMountController } from './viewportMountController';
import type { ViewportMountIntent } from './viewportMountController';

const VIEWPORT_ID = 'viewport-1';

// Identity matters for the comparator's dataSource clause: reuse one object.
const DATA_SOURCE = { name: 'test-data-source' };

function makeDisplaySets(): AppTypes.DisplaySet[] {
  return [
    {
      displaySetInstanceUID: 'ds-1',
      images: [{ imageId: 'imageId:a' }, { imageId: 'imageId:b' }],
    },
  ] as unknown as AppTypes.DisplaySet[];
}

function makeIntent(overrides: Partial<ViewportMountIntent> = {}): ViewportMountIntent {
  return {
    displaySets: makeDisplaySets(),
    viewportOptions: {
      viewportId: VIEWPORT_ID,
      viewportType: 'stack',
      orientation: 'axial',
      toolGroupId: 'default',
    },
    displaySetOptions: [{}],
    dataSource: DATA_SOURCE,
    initialImageIndex: 0,
    compositionRevision: 1,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

function makeHarness({
  createViewportDataImpl,
}: {
  createViewportDataImpl?: (...args: unknown[]) => Promise<unknown>;
} = {}) {
  const invalidationHandlers: Array<(evt: unknown) => void | Promise<void>> = [];
  const unsubscribe = jest.fn();

  const displaySetService = {
    EVENTS: {
      DISPLAY_SET_SERIES_METADATA_INVALIDATED:
        'event::displaySetService:displaySetSeriesMetadataInvalidated',
    },
    subscribe: jest.fn((_eventName: string, handler: (evt: unknown) => void) => {
      invalidationHandlers.push(handler);
      return { unsubscribe };
    }),
  };

  const cornerstoneCacheService = {
    createViewportData: jest.fn(
      createViewportDataImpl ??
        (async (displaySets, viewportOptions) => ({ displaySets, viewportOptions }))
    ),
    invalidateViewportData: jest.fn(async () => ({ invalidated: true })),
  };

  const setViewportData = jest.fn();
  const updateViewport = jest.fn();
  const viewportGridService = { reportPhase: jest.fn() };
  const viewportInfos = new Map<
    string,
    { hasDisplaySet: (uid: string) => boolean; getViewportData: () => unknown }
  >();

  const controller = createViewportMountController({
    servicesManager: {
      services: { displaySetService, cornerstoneCacheService, viewportGridService },
    } as unknown as AppTypes.ServicesManager,
    setViewportData: setViewportData as never,
    updateViewport,
    getViewportInfo: viewportId => viewportInfos.get(viewportId) as never,
  });

  return {
    controller,
    displaySetService,
    cornerstoneCacheService,
    setViewportData,
    updateViewport,
    viewportGridService,
    viewportInfos,
    invalidationHandlers,
    unsubscribe,
    element: document.createElement('div') as HTMLDivElement,
  };
}

describe('compareMountIntent', () => {
  it('reports two structurally identical intents as equal', () => {
    expect(compareMountIntent(makeIntent(), makeIntent())).toBe(true);
  });

  // Parity with the old areEqual clauses: each one flips the comparator.
  it('is unequal when the displaySets length differs', () => {
    const next = makeIntent();
    next.displaySets = [
      ...next.displaySets,
      { displaySetInstanceUID: 'ds-2' } as unknown as AppTypes.DisplaySet,
    ];
    expect(compareMountIntent(makeIntent(), next)).toBe(false);
  });

  it('is unequal when a previous displaySet UID is missing from the next set', () => {
    const next = makeIntent();
    next.displaySets[0].displaySetInstanceUID = 'ds-other';
    expect(compareMountIntent(makeIntent(), next)).toBe(false);
  });

  it('is unequal when a matched displaySet has a different images length', () => {
    const next = makeIntent();
    next.displaySets[0].images = [{ imageId: 'imageId:a' }] as never;
    expect(compareMountIntent(makeIntent(), next)).toBe(false);
  });

  it('is unequal when a matched displaySet has a different imageId', () => {
    const next = makeIntent();
    next.displaySets[0].images = [
      { imageId: 'imageId:a' },
      { imageId: 'imageId:CHANGED' },
    ] as never;
    expect(compareMountIntent(makeIntent(), next)).toBe(false);
  });

  it('treats displaySets with no images arrays as equal (parity: optional chain)', () => {
    const prev = makeIntent();
    const next = makeIntent();
    delete (prev.displaySets[0] as { images?: unknown }).images;
    delete (next.displaySets[0] as { images?: unknown }).images;
    expect(compareMountIntent(prev, next)).toBe(true);
  });

  it('is unequal when viewportOptions.orientation differs', () => {
    const next = makeIntent();
    next.viewportOptions = { ...next.viewportOptions, orientation: 'sagittal' };
    expect(compareMountIntent(makeIntent(), next)).toBe(false);
  });

  it('is unequal when viewportOptions.toolGroupId differs', () => {
    const next = makeIntent();
    next.viewportOptions = { ...next.viewportOptions, toolGroupId: 'SEGToolGroup-viewport-1' };
    expect(compareMountIntent(makeIntent(), next)).toBe(false);
  });

  it('is unequal when the next viewportType is truthy and differs', () => {
    const next = makeIntent();
    next.viewportOptions = { ...next.viewportOptions, viewportType: 'volume' };
    expect(compareMountIntent(makeIntent(), next)).toBe(false);
  });

  it('ignores a falsy next viewportType (parity with areEqual)', () => {
    const next = makeIntent();
    next.viewportOptions = { ...next.viewportOptions, viewportType: undefined };
    expect(compareMountIntent(makeIntent(), next)).toBe(true);
  });

  // The extension clauses beyond the old comparator.
  it('is unequal when the compositionRevision differs (replaces needsRerendering)', () => {
    expect(compareMountIntent(makeIntent(), makeIntent({ compositionRevision: 2 }))).toBe(false);
  });

  it('is unequal when the dataSource identity differs', () => {
    expect(compareMountIntent(makeIntent(), makeIntent({ dataSource: { name: 'other' } }))).toBe(
      false
    );
  });

  it('is unequal when initialImageIndex differs', () => {
    expect(compareMountIntent(makeIntent(), makeIntent({ initialImageIndex: 5 }))).toBe(false);
  });

  // Fields the old areEqual never looked at stay equal-by-definition.
  it('ignores changes to fields areEqual ignored (background, syncGroups, displaySetOptions, extra displaySet fields)', () => {
    const next = makeIntent();
    next.viewportOptions = {
      ...next.viewportOptions,
      background: [0, 0, 0],
      syncGroups: [{ type: 'cameraPosition' }],
    };
    next.displaySetOptions = [{ voi: { windowWidth: 400, windowCenter: 40 } }];
    (next.displaySets[0] as { SeriesDescription?: string }).SeriesDescription = 'changed';
    expect(compareMountIntent(makeIntent(), next)).toBe(true);
  });
});

describe('viewportMountController', () => {
  describe('mount reconciliation', () => {
    it('mounts a pending intent when the element attaches (intent-before-element)', async () => {
      const { controller, cornerstoneCacheService, setViewportData, element } = makeHarness();
      const intent = makeIntent();

      controller.setMountIntent(VIEWPORT_ID, intent);
      expect(cornerstoneCacheService.createViewportData).not.toHaveBeenCalled();

      controller.attachElement(VIEWPORT_ID, element);
      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(1);
      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledWith(
        intent.displaySets,
        expect.objectContaining({ viewportType: 'stack' }),
        DATA_SOURCE,
        0
      );

      await flush();
      expect(setViewportData).toHaveBeenCalledTimes(1);
      const [viewportId, , viewportOptions, displaySetOptions, presentations] =
        setViewportData.mock.calls[0];
      expect(viewportId).toBe(VIEWPORT_ID);
      expect(viewportOptions).toEqual(expect.objectContaining({ viewportType: 'stack' }));
      expect(displaySetOptions).toBe(intent.displaySetOptions);
      expect(presentations).toEqual({
        positionPresentation: null,
        lutPresentation: null,
        segmentationPresentation: null,
      });
    });

    it('mounts when the intent arrives after the element attaches', async () => {
      const { controller, setViewportData, element } = makeHarness();

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());

      await flush();
      expect(setViewportData).toHaveBeenCalledTimes(1);
    });

    it('no-ops on an equal republish (pipeline runs once)', async () => {
      const { controller, cornerstoneCacheService, setViewportData, element } = makeHarness();

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();

      // A structurally equal but referentially fresh intent, as every render
      // publishes one.
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();

      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(1);
      expect(setViewportData).toHaveBeenCalledTimes(1);
    });

    it('remounts when a changed intent is published', async () => {
      const { controller, cornerstoneCacheService, setViewportData, element } = makeHarness();

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();

      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 2 }));
      await flush();

      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(2);
      expect(setViewportData).toHaveBeenCalledTimes(2);
    });

    it('is idempotent under double attach + double publish (StrictMode)', async () => {
      const { controller, cornerstoneCacheService, setViewportData, element } = makeHarness();

      controller.attachElement(VIEWPORT_ID, element);
      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();

      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(1);
      expect(setViewportData).toHaveBeenCalledTimes(1);
    });

    it('binds exactly one mount across a StrictMode attach/detach/re-attach cycle', async () => {
      const { controller, cornerstoneCacheService, setViewportData, element } = makeHarness();

      // mount effects -> cleanup -> effects again, with a publish after each attach
      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      controller.detachElement(VIEWPORT_ID);
      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();

      // The first pipeline was cancelled by the detach; only the re-attach
      // pipeline binds data.
      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(2);
      expect(setViewportData).toHaveBeenCalledTimes(1);
    });
  });

  describe('supersession', () => {
    it('only the newest of two rapid intents binds; the older aborts post-await', async () => {
      const deferreds: Array<ReturnType<typeof deferred>> = [];
      const { controller, setViewportData, element } = makeHarness({
        createViewportDataImpl: () => {
          const d = deferred<unknown>();
          deferreds.push(d);
          return d.promise;
        },
      });

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 1 }));
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 2 }));
      expect(deferreds.length).toBe(2);

      deferreds[0].resolve({ id: 'first' });
      await flush();
      expect(setViewportData).not.toHaveBeenCalled();

      deferreds[1].resolve({ id: 'second' });
      await flush();
      expect(setViewportData).toHaveBeenCalledTimes(1);
      expect(setViewportData.mock.calls[0][1]).toEqual({ id: 'second' });
    });

    it('survives out-of-order resolution (older data arriving last never binds)', async () => {
      const deferreds: Array<ReturnType<typeof deferred>> = [];
      const { controller, setViewportData, element } = makeHarness({
        createViewportDataImpl: () => {
          const d = deferred<unknown>();
          deferreds.push(d);
          return d.promise;
        },
      });

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 1 }));
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 2 }));

      deferreds[1].resolve({ id: 'second' });
      await flush();
      deferreds[0].resolve({ id: 'first' });
      await flush();

      expect(setViewportData).toHaveBeenCalledTimes(1);
      expect(setViewportData.mock.calls[0][1]).toEqual({ id: 'second' });
    });
  });

  describe('detach', () => {
    it('cancels an in-flight mount and remounts once the intent is republished after re-attach', async () => {
      const deferreds: Array<ReturnType<typeof deferred>> = [];
      const { controller, cornerstoneCacheService, setViewportData, element } = makeHarness({
        createViewportDataImpl: () => {
          const d = deferred<unknown>();
          deferreds.push(d);
          return d.promise;
        },
      });

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      controller.detachElement(VIEWPORT_ID);

      deferreds[0].resolve({ id: 'stale' });
      await flush();
      expect(setViewportData).not.toHaveBeenCalled();

      // A re-attach with the same-commit republish (the component's no-deps
      // intent effect) must remount even though the intent did not change.
      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(2);

      deferreds[1].resolve({ id: 'fresh' });
      await flush();
      expect(setViewportData).toHaveBeenCalledTimes(1);
      expect(setViewportData.mock.calls[0][1]).toEqual({ id: 'fresh' });
    });

    it('prunes the retained intent: a bare re-attach mounts nothing until a fresh publish', async () => {
      const { controller, cornerstoneCacheService, setViewportData, element } = makeHarness();

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();
      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(1);

      controller.detachElement(VIEWPORT_ID);

      // A new component instance for the same viewportId attaches BEFORE its
      // first intent publish; the previous instance's stale intent must not
      // start a doomed mount here.
      controller.attachElement(VIEWPORT_ID, element);
      await flush();
      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(1);

      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();
      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(2);
      expect(setViewportData).toHaveBeenCalledTimes(2);
    });

    it('is a no-op for an unknown viewport', () => {
      const { controller } = makeHarness();
      expect(() => controller.detachElement('never-seen')).not.toThrow();
    });
  });

  describe('mount failure', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('reports the error phase and lets an EQUAL republish retry after a failed pipeline', async () => {
      let shouldFail = true;
      const { controller, cornerstoneCacheService, setViewportData, viewportGridService, element } =
        makeHarness({
          createViewportDataImpl: async () => {
            if (shouldFail) {
              throw new Error('createViewportData failed');
            }
            return { id: 'retried' };
          },
        });

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();

      expect(setViewportData).not.toHaveBeenCalled();
      expect(viewportGridService.reportPhase).toHaveBeenCalledWith(VIEWPORT_ID, 'error', 1);
      expect(warnSpy).toHaveBeenCalled();

      // The failed intent must not stay recorded as last-mounted: a
      // structurally EQUAL republish (any later render) retries the mount.
      shouldFail = false;
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      await flush();

      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(2);
      expect(setViewportData).toHaveBeenCalledTimes(1);
      expect(setViewportData.mock.calls[0][1]).toEqual({ id: 'retried' });
    });

    it('a failing SUPERSEDED mount neither reports an error nor poisons the current mount', async () => {
      const deferreds: Array<ReturnType<typeof deferred>> = [];
      const {
        controller,
        cornerstoneCacheService,
        setViewportData,
        viewportGridService,
        element,
      } = makeHarness({
        createViewportDataImpl: () => {
          const d = deferred<unknown>();
          deferreds.push(d);
          return d.promise;
        },
      });

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 1 }));
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 2 }));

      deferreds[1].resolve({ id: 'second' });
      await flush();
      expect(setViewportData).toHaveBeenCalledTimes(1);

      deferreds[0].reject(new Error('stale failure'));
      await flush();
      expect(viewportGridService.reportPhase).not.toHaveBeenCalled();

      // The current mount's marker is intact: an equal republish still no-ops.
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 2 }));
      await flush();
      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledTimes(2);
      expect(setViewportData).toHaveBeenCalledTimes(1);
    });
  });

  describe('viewportType handling', () => {
    it('applies the dynamic-volume override on a copy without mutating the intent viewportOptions', async () => {
      const { controller, cornerstoneCacheService, setViewportData, element } = makeHarness();
      const viewportOptions = { viewportId: VIEWPORT_ID };
      const displaySets = [
        {
          displaySetInstanceUID: 'ds-dyn',
          isDynamicVolume: true,
          isReconstructable: true,
        },
      ] as unknown as AppTypes.DisplaySet[];

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ displaySets, viewportOptions }));
      await flush();

      expect(cornerstoneCacheService.createViewportData).toHaveBeenCalledWith(
        displaySets,
        expect.objectContaining({ viewportType: 'volume' }),
        DATA_SOURCE,
        0
      );
      expect(setViewportData.mock.calls[0][2]).toEqual(
        expect.objectContaining({ viewportType: 'volume' })
      );
      // The published intent's options object (grid composition state) is untouched.
      expect(viewportOptions).toEqual({ viewportId: VIEWPORT_ID });
    });

    it('defaults a missing viewportType to stack on a copy', async () => {
      const { controller, setViewportData, element } = makeHarness();
      const viewportOptions = { viewportId: VIEWPORT_ID };

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ viewportOptions }));
      await flush();

      expect(setViewportData.mock.calls[0][2]).toEqual(
        expect.objectContaining({ viewportType: 'stack' })
      );
      expect(viewportOptions).toEqual({ viewportId: VIEWPORT_ID });
    });
  });

  describe('metadata invalidation fan-out', () => {
    function setupTwoViewports(harness: ReturnType<typeof makeHarness>) {
      const { controller, viewportInfos } = harness;
      viewportInfos.set(VIEWPORT_ID, {
        hasDisplaySet: uid => uid === 'ds-1',
        getViewportData: () => ({ tag: 'viewport-1-data' }),
      });
      viewportInfos.set('viewport-2', {
        hasDisplaySet: () => false,
        getViewportData: () => ({ tag: 'viewport-2-data' }),
      });
      controller.attachElement(VIEWPORT_ID, document.createElement('div') as HTMLDivElement);
      controller.attachElement('viewport-2', document.createElement('div') as HTMLDivElement);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      controller.setMountIntent('viewport-2', makeIntent());
    }

    it('subscribes exactly once for the whole controller', () => {
      const { displaySetService } = makeHarness();
      expect(displaySetService.subscribe).toHaveBeenCalledTimes(1);
      expect(displaySetService.subscribe).toHaveBeenCalledWith(
        displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
        expect.any(Function)
      );
    });

    it('re-mounts (keepCamera) only the attached viewports containing the invalidated UID', async () => {
      const harness = makeHarness();
      const {
        controller,
        cornerstoneCacheService,
        updateViewport,
        invalidationHandlers,
        displaySetService,
      } = harness;
      setupTwoViewports(harness);
      await flush();

      await invalidationHandlers[0]({ displaySetInstanceUID: 'ds-1', invalidateData: true });
      await flush();

      expect(cornerstoneCacheService.invalidateViewportData).toHaveBeenCalledTimes(1);
      expect(cornerstoneCacheService.invalidateViewportData).toHaveBeenCalledWith(
        { tag: 'viewport-1-data' },
        'ds-1',
        DATA_SOURCE,
        displaySetService
      );
      expect(updateViewport).toHaveBeenCalledTimes(1);
      expect(updateViewport).toHaveBeenCalledWith(VIEWPORT_ID, { invalidated: true }, true);
      expect(controller).toBeDefined();
    });

    it('does nothing when invalidateData is false', async () => {
      const harness = makeHarness();
      const { updateViewport, invalidationHandlers } = harness;
      setupTwoViewports(harness);
      await flush();

      await invalidationHandlers[0]({ displaySetInstanceUID: 'ds-1', invalidateData: false });
      expect(updateViewport).not.toHaveBeenCalled();
    });

    it('skips detached viewports', async () => {
      const harness = makeHarness();
      const { controller, updateViewport, invalidationHandlers } = harness;
      setupTwoViewports(harness);
      await flush();

      controller.detachElement(VIEWPORT_ID);
      await invalidationHandlers[0]({ displaySetInstanceUID: 'ds-1', invalidateData: true });
      await flush();

      expect(updateViewport).not.toHaveBeenCalled();
    });

    it('does not update a viewport that detaches DURING the invalidation await', async () => {
      const harness = makeHarness();
      const { controller, cornerstoneCacheService, updateViewport, invalidationHandlers } = harness;
      setupTwoViewports(harness);
      await flush();

      const d = deferred<unknown>();
      cornerstoneCacheService.invalidateViewportData.mockImplementation(() => d.promise);

      const handlerDone = invalidationHandlers[0]({
        displaySetInstanceUID: 'ds-1',
        invalidateData: true,
      });
      // The element goes away while invalidateViewportData is in flight; the
      // re-mount must be skipped (the next backend throws on a null viewport).
      controller.detachElement(VIEWPORT_ID);
      d.resolve({ invalidated: true });
      await handlerDone;

      expect(updateViewport).not.toHaveBeenCalled();
    });

    it('continues the fan-out when one viewport invalidation fails', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const harness = makeHarness();
      const {
        controller,
        cornerstoneCacheService,
        updateViewport,
        viewportInfos,
        invalidationHandlers,
      } = harness;

      // Both viewports show the invalidated display set; insertion order
      // fixes the fan-out order, so the failing one runs first.
      viewportInfos.set(VIEWPORT_ID, {
        hasDisplaySet: uid => uid === 'ds-1',
        getViewportData: () => ({ tag: 'viewport-1-data' }),
      });
      viewportInfos.set('viewport-2', {
        hasDisplaySet: uid => uid === 'ds-1',
        getViewportData: () => ({ tag: 'viewport-2-data' }),
      });
      controller.attachElement(VIEWPORT_ID, document.createElement('div') as HTMLDivElement);
      controller.attachElement('viewport-2', document.createElement('div') as HTMLDivElement);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());
      controller.setMountIntent('viewport-2', makeIntent());
      await flush();

      cornerstoneCacheService.invalidateViewportData
        .mockImplementationOnce(async () => {
          throw new Error('invalidate failed');
        })
        .mockImplementationOnce(async () => ({ invalidated: true }));

      await invalidationHandlers[0]({ displaySetInstanceUID: 'ds-1', invalidateData: true });

      expect(updateViewport).toHaveBeenCalledTimes(1);
      expect(updateViewport).toHaveBeenCalledWith('viewport-2', { invalidated: true }, true);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('destroy', () => {
    it('unsubscribes the invalidation listener and aborts pending mounts', async () => {
      const deferreds: Array<ReturnType<typeof deferred>> = [];
      const { controller, setViewportData, unsubscribe, element } = makeHarness({
        createViewportDataImpl: () => {
          const d = deferred<unknown>();
          deferreds.push(d);
          return d.promise;
        },
      });

      controller.attachElement(VIEWPORT_ID, element);
      controller.setMountIntent(VIEWPORT_ID, makeIntent());

      controller.destroy();
      expect(unsubscribe).toHaveBeenCalledTimes(1);

      deferreds[0].resolve({ id: 'late' });
      await flush();
      expect(setViewportData).not.toHaveBeenCalled();

      // Publishing after destroy never mounts.
      controller.setMountIntent(VIEWPORT_ID, makeIntent({ compositionRevision: 9 }));
      expect(deferreds.length).toBe(1);
    });
  });
});
