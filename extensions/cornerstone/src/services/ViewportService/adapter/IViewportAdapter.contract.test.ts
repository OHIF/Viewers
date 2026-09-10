import { Enums, cache } from '@cornerstonejs/core';
import {
  getViewportAdapter,
  isNextViewport,
  isVolumeRenderingViewport,
} from './getViewportAdapter';
import { LegacyViewportAdapter, LEGACY_OPACITY_GAMMA } from './LegacyViewportAdapter';
import { NextViewportAdapter } from './NextViewportAdapter';

/**
 * Contract tests for IViewportAdapter: every behavioral guarantee the UI layer
 * relies on is asserted against BOTH lane implementations over mock viewports.
 * If a legacy/native divergence is intentional (e.g. opacity gamma), the
 * divergent expectations are asserted side by side so the difference is
 * documented here rather than rediscovered in a viewer session.
 */

const { ViewportType, OrientationAxis } = Enums;

/** Minimal native ("next") viewport: satisfies csUtils.isGenericViewport. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeNextViewport(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'next-viewport',
    setDisplaySets: jest.fn().mockResolvedValue(undefined),
    setDisplaySetPresentation: jest.fn(),
    setViewState: jest.fn(),
    getViewState: jest.fn().mockReturnValue({ rotation: 90, flipHorizontal: true }),
    getCurrentMode: jest.fn().mockReturnValue('stack'),
    getSourceDataId: jest.fn().mockReturnValue('source-uid'),
    getDisplaySetPresentation: jest.fn().mockReturnValue({}),
    getDefaultVOIRange: jest.fn().mockReturnValue(undefined),
    getViewReference: jest.fn().mockReturnValue({
      viewPlaneNormal: [0, 0, 1],
      cameraFocalPoint: [1, 2, 3],
    }),
    ...overrides,
  };
}

/** Minimal legacy stack viewport: no setDisplaySets/setViewState surface. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeLegacyStackViewport(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'legacy-stack',
    type: ViewportType.STACK,
    getProperties: jest.fn().mockReturnValue({ voiRange: { lower: 0, upper: 100 } }),
    setProperties: jest.fn(),
    getCamera: jest.fn().mockReturnValue({
      viewPlaneNormal: [0, 0, 1],
      focalPoint: [1, 2, 3],
      rotation: 90,
    }),
    setCamera: jest.fn(),
    getActors: jest.fn().mockReturnValue([{ referencedId: 'imageId:abc' }]),
    ...overrides,
  };
}

/** Minimal legacy orthographic (volume) viewport. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeLegacyVolumeViewport(overrides: Record<string, unknown> = {}): any {
  const propertiesByVolumeId = {
    'volumeId-ds-1': { colormap: { name: 'hsv', opacity: 0.9 } },
  };
  return {
    id: 'legacy-volume',
    type: ViewportType.ORTHOGRAPHIC,
    getAllVolumeIds: jest.fn().mockReturnValue(['volumeId-ds-1', 'volumeId-ds-2']),
    getProperties: jest.fn((volumeId?: string) =>
      volumeId ? (propertiesByVolumeId[volumeId] ?? {}) : { voiRange: { lower: 5, upper: 50 } }
    ),
    setProperties: jest.fn(),
    getCamera: jest.fn().mockReturnValue({ viewPlaneNormal: [1, 0, 0], focalPoint: [4, 5, 6] }),
    setCamera: jest.fn(),
    getActors: jest.fn().mockReturnValue([{ referencedId: 'volumeId-ds-1' }]),
    isInAcquisitionPlane: jest.fn().mockReturnValue(true),
    getImageData: jest.fn(),
    ...overrides,
  };
}

describe('getViewportAdapter dispatch', () => {
  it('routes native viewports to NextViewportAdapter and legacy to LegacyViewportAdapter', () => {
    expect(getViewportAdapter(makeNextViewport())).toBeInstanceOf(NextViewportAdapter);
    expect(getViewportAdapter(makeLegacyStackViewport())).toBeInstanceOf(LegacyViewportAdapter);
    expect(getViewportAdapter(makeLegacyVolumeViewport())).toBeInstanceOf(LegacyViewportAdapter);
  });

  it('caches one adapter per viewport instance', () => {
    const viewport = makeNextViewport();
    expect(getViewportAdapter(viewport)).toBe(getViewportAdapter(viewport));
  });

  it('throws on a missing viewport', () => {
    expect(() => getViewportAdapter(null)).toThrow();
    expect(() => getViewportAdapter(undefined)).toThrow();
  });

  it('isNextViewport matches the dispatch decision', () => {
    expect(isNextViewport(makeNextViewport())).toBe(true);
    expect(isNextViewport(makeLegacyStackViewport())).toBe(false);
  });
});

describe('classification', () => {
  it('getShape resolves the content shape on both lanes', () => {
    expect(getViewportAdapter(makeLegacyStackViewport()).getShape()).toBe('stack');
    expect(getViewportAdapter(makeLegacyVolumeViewport()).getShape()).toBe('volume');
    expect(
      getViewportAdapter(makeLegacyVolumeViewport({ type: ViewportType.VOLUME_3D })).getShape()
    ).toBe('volume3d');

    expect(
      getViewportAdapter(
        makeNextViewport({ getCurrentMode: jest.fn().mockReturnValue('stack') })
      ).getShape()
    ).toBe('stack');
    expect(
      getViewportAdapter(
        makeNextViewport({ getCurrentMode: jest.fn().mockReturnValue('volume') })
      ).getShape()
    ).toBe('volume');
  });

  it('isVolumeRendering: legacy ORTHOGRAPHIC / native volume mode only', () => {
    expect(isVolumeRenderingViewport(makeLegacyVolumeViewport())).toBe(true);
    expect(isVolumeRenderingViewport(makeLegacyStackViewport())).toBe(false);
    expect(
      isVolumeRenderingViewport(
        makeNextViewport({ getCurrentMode: jest.fn().mockReturnValue('volume') })
      )
    ).toBe(true);
    expect(
      isVolumeRenderingViewport(
        makeNextViewport({ getCurrentMode: jest.fn().mockReturnValue('stack') })
      )
    ).toBe(false);
    // Native 3D reorients in place but does NOT support planar volume controls.
    const next3d = makeNextViewport({ getCurrentMode: jest.fn().mockReturnValue('volume3d') });
    expect(isVolumeRenderingViewport(next3d)).toBe(false);
    expect(getViewportAdapter(next3d).canReorientInPlace()).toBe(true);
  });

  it('isInAcquisitionPlane: legacy asks the viewport; native reads view-state orientation', () => {
    expect(getViewportAdapter(makeLegacyVolumeViewport()).isInAcquisitionPlane()).toBe(true);
    expect(
      getViewportAdapter(
        makeLegacyVolumeViewport({ isInAcquisitionPlane: jest.fn().mockReturnValue(false) })
      ).isInAcquisitionPlane()
    ).toBe(false);

    // Native default (unset orientation) counts as acquisition.
    expect(
      getViewportAdapter(
        makeNextViewport({ getViewState: jest.fn().mockReturnValue({}) })
      ).isInAcquisitionPlane()
    ).toBe(true);
    expect(
      getViewportAdapter(
        makeNextViewport({
          getViewState: jest.fn().mockReturnValue({ orientation: OrientationAxis.SAGITTAL }),
        })
      ).isInAcquisitionPlane()
    ).toBe(false);
  });

  it('hasContent: legacy via actors, native via content mode', () => {
    expect(getViewportAdapter(makeLegacyStackViewport()).hasContent()).toBe(true);
    expect(
      getViewportAdapter(
        makeLegacyStackViewport({ getActors: jest.fn().mockReturnValue([]) })
      ).hasContent()
    ).toBe(false);

    expect(getViewportAdapter(makeNextViewport()).hasContent()).toBe(true);
    expect(
      getViewportAdapter(
        makeNextViewport({ getCurrentMode: jest.fn().mockReturnValue('empty') })
      ).hasContent()
    ).toBe(false);
  });
});

describe('view geometry', () => {
  it('getViewState/setViewState map to getCamera/setCamera on legacy', () => {
    const viewport = makeLegacyStackViewport();
    const adapter = getViewportAdapter(viewport);
    expect(adapter.getViewState().rotation).toBe(90);
    adapter.setViewState({ flipHorizontal: true });
    expect(viewport.setCamera).toHaveBeenCalledWith({ flipHorizontal: true });
  });

  it('getViewState/setViewState pass through natively', () => {
    const viewport = makeNextViewport();
    const adapter = getViewportAdapter(viewport);
    expect(adapter.getViewState().rotation).toBe(90);
    adapter.setViewState({ rotation: 180 });
    expect(viewport.setViewState).toHaveBeenCalledWith({ rotation: 180 });
  });

  it('getViewPlaneNormal and getFocalPoint resolve on both lanes', () => {
    expect(getViewportAdapter(makeLegacyStackViewport()).getViewPlaneNormal()).toEqual([0, 0, 1]);
    expect(getViewportAdapter(makeLegacyStackViewport()).getFocalPoint()).toEqual([1, 2, 3]);
    expect(getViewportAdapter(makeNextViewport()).getViewPlaneNormal()).toEqual([0, 0, 1]);
    expect(getViewportAdapter(makeNextViewport()).getFocalPoint()).toEqual([1, 2, 3]);
  });
});

describe('per-display-set appearance', () => {
  it('getPresentation: legacy getProperties with/without dataId', () => {
    const viewport = makeLegacyVolumeViewport();
    const adapter = getViewportAdapter(viewport);
    expect(adapter.getPresentation()).toEqual({ voiRange: { lower: 5, upper: 50 } });
    expect(adapter.getPresentation('volumeId-ds-1').colormap).toEqual({
      name: 'hsv',
      opacity: 0.9,
    });
  });

  it('getPresentation: native per-binding read, defaulting to the source dataId', () => {
    const viewport = makeNextViewport({
      getDisplaySetPresentation: jest.fn().mockReturnValue({ invert: true }),
    });
    const adapter = getViewportAdapter(viewport);
    expect(adapter.getPresentation()).toEqual({ invert: true });
    expect(viewport.getDisplaySetPresentation).toHaveBeenCalledWith('source-uid');
    adapter.getPresentation('ds-2');
    expect(viewport.getDisplaySetPresentation).toHaveBeenCalledWith('ds-2');
  });

  it('getPresentation: native stamps isComputedVOI when the VOI matches the binding default', () => {
    const voiRange = { lower: 0, upper: 80 };
    const stamped = getViewportAdapter(
      makeNextViewport({
        getDisplaySetPresentation: jest.fn().mockReturnValue({ voiRange }),
        getDefaultVOIRange: jest.fn().mockReturnValue({ lower: 0, upper: 80 }),
      })
    ).getPresentation();
    expect(stamped.isComputedVOI).toBe(true);

    const notStamped = getViewportAdapter(
      makeNextViewport({
        getDisplaySetPresentation: jest.fn().mockReturnValue({ voiRange }),
        getDefaultVOIRange: jest.fn().mockReturnValue({ lower: 10, upper: 90 }),
      })
    ).getPresentation();
    expect(notStamped.isComputedVOI).toBeUndefined();
  });

  it('setPresentation targets setProperties (legacy) / setDisplaySetPresentation (native)', () => {
    const legacy = makeLegacyVolumeViewport();
    getViewportAdapter(legacy).setPresentation({ invert: true }, 'volumeId-ds-1');
    expect(legacy.setProperties).toHaveBeenCalledWith({ invert: true }, 'volumeId-ds-1');

    const next = makeNextViewport();
    getViewportAdapter(next).setPresentation({ invert: true }, 'ds-1');
    expect(next.setDisplaySetPresentation).toHaveBeenCalledWith('ds-1', { invert: true });

    // No dataId: native falls back to the source binding.
    getViewportAdapter(next).setPresentation({ invert: false });
    expect(next.setDisplaySetPresentation).toHaveBeenCalledWith('source-uid', { invert: false });
  });

  it('getDefaultVOIRange: native binding default; legacy has none', () => {
    expect(getViewportAdapter(makeLegacyStackViewport()).getDefaultVOIRange()).toBeUndefined();
    expect(
      getViewportAdapter(
        makeNextViewport({ getDefaultVOIRange: jest.fn().mockReturnValue({ lower: 1, upper: 2 }) })
      ).getDefaultVOIRange('ds-1')
    ).toEqual({ lower: 1, upper: 2 });
  });

  it('getColormap: legacy stack properties / legacy volume actor lookup / native presentation', () => {
    const stack = makeLegacyStackViewport({
      getProperties: jest.fn().mockReturnValue({ colormap: { name: 'gray' } }),
    });
    expect(getViewportAdapter(stack).getColormap('anything')).toEqual({ name: 'gray' });

    const volume = makeLegacyVolumeViewport();
    expect(getViewportAdapter(volume).getColormap('ds-1')).toEqual({ name: 'hsv', opacity: 0.9 });
    expect(getViewportAdapter(volume).getColormap('ds-unknown')).toBeUndefined();

    const next = makeNextViewport({
      getDisplaySetPresentation: jest.fn().mockReturnValue({ colormap: { name: 'jet' } }),
    });
    expect(getViewportAdapter(next).getColormap('ds-1')).toEqual({ name: 'jet' });
  });

  it('setLayerOpacity merges into the existing colormap on both lanes', () => {
    const volume = makeLegacyVolumeViewport();
    expect(getViewportAdapter(volume).setLayerOpacity('ds-1', 0.5)).toBe(true);
    expect(volume.setProperties).toHaveBeenCalledWith(
      { colormap: { name: 'hsv', opacity: 0.5 } },
      'volumeId-ds-1'
    );

    const next = makeNextViewport({
      getDisplaySetPresentation: jest.fn().mockReturnValue({ colormap: { name: 'jet' } }),
    });
    expect(getViewportAdapter(next).setLayerOpacity('ds-1', 0.5)).toBe(true);
    expect(next.setDisplaySetPresentation).toHaveBeenCalledWith('ds-1', {
      colormap: { name: 'jet', opacity: 0.5 },
    });
  });

  it('setLayerOpacity is unsupported on a legacy stack (caller must not render)', () => {
    const stack = makeLegacyStackViewport();
    expect(getViewportAdapter(stack).setLayerOpacity('ds-1', 0.5)).toBe(false);
    expect(stack.setProperties).not.toHaveBeenCalled();
  });

  it('setLayerThreshold: legacy historically does NOT merge; native merges', () => {
    const volume = makeLegacyVolumeViewport();
    expect(getViewportAdapter(volume).setLayerThreshold('ds-1', 42)).toBe(true);
    expect(volume.setProperties).toHaveBeenCalledWith(
      { colormap: { threshold: 42 } },
      'volumeId-ds-1'
    );

    const next = makeNextViewport({
      getDisplaySetPresentation: jest.fn().mockReturnValue({ colormap: { name: 'jet' } }),
    });
    expect(getViewportAdapter(next).setLayerThreshold('ds-1', 42)).toBe(true);
    expect(next.setDisplaySetPresentation).toHaveBeenCalledWith('ds-1', {
      colormap: { name: 'jet', threshold: 42 },
    });
  });

  it('getOpacityGamma: linear on native, historical 1/5 curve on legacy', () => {
    expect(getViewportAdapter(makeNextViewport()).getOpacityGamma()).toBe(1);
    expect(getViewportAdapter(makeLegacyVolumeViewport()).getOpacityGamma()).toBe(
      LEGACY_OPACITY_GAMMA
    );
  });
});

describe('data addressing', () => {
  it('getDataIdForDisplaySet: bare UID on native; matching volumeId on legacy volume; undefined on legacy stack', () => {
    expect(getViewportAdapter(makeNextViewport()).getDataIdForDisplaySet('ds-1')).toBe('ds-1');
    expect(getViewportAdapter(makeLegacyVolumeViewport()).getDataIdForDisplaySet('ds-1')).toBe(
      'volumeId-ds-1'
    );
    expect(
      getViewportAdapter(makeLegacyVolumeViewport()).getDataIdForDisplaySet('nope')
    ).toBeUndefined();
    expect(
      getViewportAdapter(makeLegacyStackViewport()).getDataIdForDisplaySet('ds-1')
    ).toBeUndefined();
  });

  it('getVolumeIds: legacy volume list; empty on native and legacy stack', () => {
    expect(getViewportAdapter(makeLegacyVolumeViewport()).getVolumeIds()).toEqual([
      'volumeId-ds-1',
      'volumeId-ds-2',
    ]);
    expect(getViewportAdapter(makeLegacyStackViewport()).getVolumeIds()).toEqual([]);
    expect(getViewportAdapter(makeNextViewport()).getVolumeIds()).toEqual([]);
  });

  it('getVoxelManagerForDisplaySet: native resolves from the cornerstone cache', () => {
    const voxelManager = { getRange: () => [0, 100] as [number, number] };
    const derivedVoxelManager = { getRange: () => [0, 1] as [number, number] };
    const spy = jest.spyOn(cache, 'getVolumes').mockReturnValue([
      // A derived id that merely EMBEDS the UID must not match (anchored lookup);
      // real volumeIds are `${volumeLoaderSchema}:${displaySetInstanceUID}`.
      { volumeId: 'derived-ds-1-labelmap', voxelManager: derivedVoxelManager },
      { volumeId: 'cornerstoneStreamingImageVolume:ds-1', voxelManager },
    ] as never);
    try {
      expect(getViewportAdapter(makeNextViewport()).getVoxelManagerForDisplaySet('ds-1')).toBe(
        voxelManager
      );
      expect(
        getViewportAdapter(makeNextViewport()).getVoxelManagerForDisplaySet('missing')
      ).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });

  it('getVoxelManagerForDisplaySet: legacy volume reads getImageData(volumeId)', () => {
    const voxelManager = { getRange: () => [0, 50] as [number, number] };
    const viewport = makeLegacyVolumeViewport({
      getImageData: jest.fn().mockReturnValue({
        imageData: {
          get: (key: string) => (key === 'voxelManager' ? { voxelManager } : undefined),
        },
      }),
    });
    expect(getViewportAdapter(viewport).getVoxelManagerForDisplaySet('ds-1')).toBe(voxelManager);
    expect(viewport.getImageData).toHaveBeenCalledWith('volumeId-ds-1');
    expect(
      getViewportAdapter(makeLegacyStackViewport()).getVoxelManagerForDisplaySet('ds-1')
    ).toBeUndefined();
  });
});

describe('capture (copyDisplayedContentTo)', () => {
  it('legacy: setStack + properties + view presentation + view reference onto the target', async () => {
    const source = makeLegacyStackViewport({
      getCurrentImageId: jest.fn().mockReturnValue('imageId:abc'),
      getViewReference: jest.fn().mockReturnValue({ viewPlaneNormal: [0, 0, 1] }),
      getViewPresentation: jest.fn().mockReturnValue({ zoom: 2 }),
    });
    const target = makeLegacyStackViewport({
      setStack: jest.fn().mockResolvedValue(undefined),
      setViewPresentation: jest.fn(),
      setViewReference: jest.fn(),
    });

    await getViewportAdapter(source).copyDisplayedContentTo(target as never);

    expect(target.setStack).toHaveBeenCalledWith(['imageId:abc']);
    expect(target.setViewPresentation).toHaveBeenCalledWith({ zoom: 2 });
    expect(target.setProperties).toHaveBeenCalledWith({ voiRange: { lower: 0, upper: 100 } });
    expect(target.setViewReference).toHaveBeenCalledWith({ viewPlaneNormal: [0, 0, 1] });
  });

  it('native: remounts the source dataId and copies presentation + view state', async () => {
    const source = makeNextViewport({
      getDisplaySetPresentation: jest.fn().mockReturnValue({ invert: true }),
      getViewState: jest.fn().mockReturnValue({ orientation: 'axial', rotation: 45 }),
    });
    const target = makeNextViewport({
      getSourceDataId: jest.fn().mockReturnValue('capture-uid'),
      setViewReference: jest.fn(),
    });

    await getViewportAdapter(source).copyDisplayedContentTo(target as never);

    expect(target.setDisplaySets).toHaveBeenCalledWith({
      displaySetId: 'source-uid',
      options: { orientation: 'axial', role: 'source' },
    });
    expect(target.setDisplaySetPresentation).toHaveBeenCalledWith('capture-uid', { invert: true });
    expect(target.setViewReference).toHaveBeenCalledWith({
      viewPlaneNormal: [0, 0, 1],
      cameraFocalPoint: [1, 2, 3],
    });
    expect(target.setViewState).toHaveBeenCalledWith({ orientation: 'axial', rotation: 45 });
  });
});

// ---------------------------------------------------------------------------
// Projection (MIP): T4 adapter contract, T6 off path, T7 guards.
// The same expectations run against both lanes; the intentional divergences
// (legacy half-width clipping planes vs native total-width reslice slab, and
// legacy resetSlabThickness vs native COMPOSITE + 0) are asserted side by side.
// ---------------------------------------------------------------------------

const MIP = Enums.BlendModes.MAXIMUM_INTENSITY_BLEND;
const COMPOSITE = Enums.BlendModes.COMPOSITE;

function makeLoadedVolume(volumeId: string, overrides: Record<string, unknown> = {}) {
  return {
    volumeId,
    dimensions: [32, 32, 32],
    spacing: [1, 1, 1],
    loadStatus: { loaded: true, loading: false },
    ...overrides,
  };
}

/** Legacy ORTHOGRAPHIC viewport with two volume layers and the projection surface. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeProjectableLegacyViewport(overrides: Record<string, unknown> = {}): any {
  const actors = [
    { uid: 'actor-ct', referencedId: 'volumeId:ds-ct', slabThickness: undefined },
    { uid: 'actor-pt', referencedId: 'volumeId:ds-pt', slabThickness: undefined },
  ];
  const blendByUid: Record<string, unknown> = { 'actor-ct': COMPOSITE, 'actor-pt': COMPOSITE };
  return makeLegacyVolumeViewport({
    getAllVolumeIds: jest.fn().mockReturnValue(['volumeId:ds-ct', 'volumeId:ds-pt']),
    getVolumeId: jest.fn().mockReturnValue('volumeId:ds-ct'),
    getActors: jest.fn(() => actors),
    getBlendMode: jest.fn((filter?: string[]) => blendByUid[filter?.[0] ?? 'actor-ct']),
    setBlendMode: jest.fn((blendMode: unknown, filter?: string[]) => {
      (filter ?? []).forEach(uid => {
        blendByUid[uid] = blendMode;
      });
    }),
    setSlabThickness: jest.fn((t: number, filter?: string[]) => {
      actors
        .filter(a => (filter ?? []).includes(a.uid))
        .forEach(a => {
          a.slabThickness = t;
        });
    }),
    resetSlabThickness: jest.fn(() => {
      actors.forEach(a => {
        a.slabThickness = undefined;
      });
    }),
    render: jest.fn(),
    ...overrides,
  });
}

/** Native planar viewport in volume mode with two bound layers. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeProjectableNextViewport(overrides: Record<string, unknown> = {}): any {
  const presentations: Record<string, Record<string, unknown>> = { 'ds-ct': {}, 'ds-pt': {} };
  return makeNextViewport({
    getCurrentMode: jest.fn().mockReturnValue('volume'),
    getSourceDataId: jest.fn().mockReturnValue('ds-ct'),
    getCurrentPlanarRendering: jest.fn().mockReturnValue({ renderMode: 'vtkVolumeSlice' }),
    getDataSet: jest.fn((dataId: string) =>
      presentations[dataId] ? { volumeId: `volumeId:${dataId}` } : undefined
    ),
    getDisplaySetPresentation: jest.fn((dataId: string) => presentations[dataId]),
    setDisplaySetPresentation: jest.fn((dataId: string, props: Record<string, unknown>) => {
      presentations[dataId] = { ...presentations[dataId], ...props };
    }),
    render: jest.fn(),
    ...overrides,
  });
}

function mockLoadedVolumes(ptLoadStatus = { loaded: true, loading: false }) {
  const volumes = [
    makeLoadedVolume('volumeId:ds-ct'),
    makeLoadedVolume('volumeId:ds-pt', { loadStatus: ptLoadStatus }),
  ];
  jest
    .spyOn(cache, 'getVolume')
    .mockImplementation((id: string) => volumes.find(v => v.volumeId === id) as never);
  jest.spyOn(cache, 'getVolumes').mockReturnValue(volumes as never);
}

describe('projection (T4 adapter contract)', () => {
  beforeEach(() => mockLoadedVolumes());
  afterEach(() => jest.restoreAllMocks());

  it('supportsProjection is true on a loaded planar volume layer on both lanes', () => {
    expect(getViewportAdapter(makeProjectableLegacyViewport()).supportsProjection('ds-pt')).toEqual(
      { supported: true }
    );
    expect(getViewportAdapter(makeProjectableNextViewport()).supportsProjection('ds-pt')).toEqual({
      supported: true,
    });
  });

  it('getProjection reads back off before any write', () => {
    expect(getViewportAdapter(makeProjectableLegacyViewport()).getProjection('ds-pt')).toEqual({
      blendOp: 'none',
      slabThickness: 0,
    });
    expect(getViewportAdapter(makeProjectableNextViewport()).getProjection('ds-pt')).toEqual({
      blendOp: 'none',
      slabThickness: 0,
    });
  });

  it('setProjection writes blend AND slab to exactly the requested layer, never rendering', () => {
    const legacy = makeProjectableLegacyViewport();
    const legacyResult = getViewportAdapter(legacy).setProjection(
      { blendOp: 'max', slabThickness: 10 },
      'ds-pt'
    );
    expect(legacyResult).toEqual({ applied: true, rendered: false });
    expect(legacy.setBlendMode).toHaveBeenCalledWith(MIP, ['actor-pt']);
    // Legacy clipping planes sit at focal +/- value, so the engine gets HALF the width.
    expect(legacy.setSlabThickness).toHaveBeenCalledWith(5, ['actor-pt']);
    expect(legacy.render).not.toHaveBeenCalled();
    // The other layer is untouched.
    expect(legacy.getBlendMode(['actor-ct'])).toBe(COMPOSITE);
    expect(legacy.getActors().find(a => a.uid === 'actor-ct').slabThickness).toBeUndefined();

    const next = makeProjectableNextViewport();
    const nextResult = getViewportAdapter(next).setProjection(
      { blendOp: 'max', slabThickness: 10 },
      'ds-pt'
    );
    expect(nextResult).toEqual({ applied: true, rendered: false });
    // The reslice mapper marches to t/2 each side, so it receives the TOTAL width.
    expect(next.setDisplaySetPresentation).toHaveBeenCalledWith('ds-pt', {
      blendMode: MIP,
      slabThickness: 10,
    });
    expect(next.render).not.toHaveBeenCalled();
    expect(next.getDisplaySetPresentation('ds-ct')).toEqual({});
  });

  it('getProjection reads back the normalised total width on both lanes', () => {
    const legacy = makeProjectableLegacyViewport();
    getViewportAdapter(legacy).setProjection({ blendOp: 'max', slabThickness: 10 }, 'ds-pt');
    expect(getViewportAdapter(legacy).getProjection('ds-pt')).toEqual({
      blendOp: 'max',
      slabThickness: 10,
    });

    const next = makeProjectableNextViewport();
    getViewportAdapter(next).setProjection({ blendOp: 'max', slabThickness: 10 }, 'ds-pt');
    expect(getViewportAdapter(next).getProjection('ds-pt')).toEqual({
      blendOp: 'max',
      slabThickness: 10,
    });
  });

  it('getProjection returns undefined for a foreign engine blend the registry does not offer', () => {
    const legacy = makeProjectableLegacyViewport();
    legacy.setBlendMode(Enums.BlendModes.LABELMAP_EDGE_PROJECTION_BLEND, ['actor-pt']);
    expect(getViewportAdapter(legacy).getProjection('ds-pt')).toBeUndefined();

    const next = makeProjectableNextViewport();
    next.setDisplaySetPresentation('ds-pt', {
      blendMode: Enums.BlendModes.LABELMAP_EDGE_PROJECTION_BLEND,
      slabThickness: 5,
    });
    expect(getViewportAdapter(next).getProjection('ds-pt')).toBeUndefined();
  });

  it('getSlabRange spans [engine minimum, volume diagonal]', () => {
    const max = Math.sqrt(3) * 32;
    const legacyRange = getViewportAdapter(makeProjectableLegacyViewport()).getSlabRange('ds-pt');
    const nextRange = getViewportAdapter(makeProjectableNextViewport()).getSlabRange('ds-pt');
    expect(legacyRange.min).toBeCloseTo(0.2); // smallest total width the legacy engine keeps
    expect(legacyRange.max).toBeCloseTo(max);
    expect(nextRange.min).toBeCloseTo(0.05);
    expect(nextRange.max).toBeCloseTo(max);
  });

  it('refuses a write whose layer cannot be resolved instead of using an empty filter', () => {
    const legacy = makeProjectableLegacyViewport();
    expect(
      getViewportAdapter(legacy).setProjection({ blendOp: 'max', slabThickness: 10 }, 'ds-missing')
    ).toEqual({ applied: false, rendered: false });
    expect(legacy.setBlendMode).not.toHaveBeenCalled();
    expect(legacy.setSlabThickness).not.toHaveBeenCalled();

    const next = makeProjectableNextViewport();
    expect(
      getViewportAdapter(next).setProjection({ blendOp: 'max', slabThickness: 10 }, 'ds-missing')
    ).toEqual({ applied: false, rendered: false });
    expect(next.setDisplaySetPresentation).not.toHaveBeenCalled();
  });
});

describe('projection off path (T6)', () => {
  beforeEach(() => mockLoadedVolumes());
  afterEach(() => jest.restoreAllMocks());

  it('legacy: MIP to off restores COMPOSITE and clears the slab through the explicit reset', () => {
    const legacy = makeProjectableLegacyViewport();
    const adapter = getViewportAdapter(legacy);
    adapter.setProjection({ blendOp: 'max', slabThickness: 10 }, 'ds-pt');
    adapter.setProjection({ blendOp: 'none', slabThickness: 0 }, 'ds-pt');

    expect(legacy.setBlendMode).toHaveBeenLastCalledWith(COMPOSITE, ['actor-pt']);
    expect(legacy.resetSlabThickness).toHaveBeenCalledTimes(1);
    // Never thickness = 0.
    expect(legacy.setSlabThickness).not.toHaveBeenCalledWith(0, expect.anything());
    expect(adapter.getProjection('ds-pt')).toEqual({ blendOp: 'none', slabThickness: 0 });
  });

  it('legacy: turning one layer off while another still projects resets only that layer', () => {
    const legacy = makeProjectableLegacyViewport();
    const adapter = getViewportAdapter(legacy);
    adapter.setProjection({ blendOp: 'max', slabThickness: 10 }, 'ds-ct');
    adapter.setProjection({ blendOp: 'max', slabThickness: 20 }, 'ds-pt');
    adapter.setProjection({ blendOp: 'none', slabThickness: 0 }, 'ds-pt');

    expect(legacy.resetSlabThickness).not.toHaveBeenCalled();
    expect(legacy.setSlabThickness).toHaveBeenLastCalledWith(0.05, ['actor-pt']);
    expect(adapter.getProjection('ds-ct')).toEqual({ blendOp: 'max', slabThickness: 10 });
    expect(adapter.getProjection('ds-pt')).toEqual({ blendOp: 'none', slabThickness: 0 });
  });

  it('native: MIP to off writes COMPOSITE together with slabThickness 0 (the single-slice value)', () => {
    const next = makeProjectableNextViewport();
    const adapter = getViewportAdapter(next);
    adapter.setProjection({ blendOp: 'max', slabThickness: 10 }, 'ds-pt');
    adapter.setProjection({ blendOp: 'none', slabThickness: 0 }, 'ds-pt');

    expect(next.setDisplaySetPresentation).toHaveBeenLastCalledWith('ds-pt', {
      blendMode: COMPOSITE,
      slabThickness: 0,
    });
    expect(adapter.getProjection('ds-pt')).toEqual({ blendOp: 'none', slabThickness: 0 });
    expect(next.getDisplaySetPresentation('ds-ct')).toEqual({});
  });
});

describe('projection guards (T7)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('refuses stack viewports on both lanes', () => {
    expect(getViewportAdapter(makeLegacyStackViewport()).supportsProjection()).toEqual({
      supported: false,
      reason: 'not-volume',
    });
    expect(
      getViewportAdapter(
        makeNextViewport({ getCurrentMode: jest.fn().mockReturnValue('stack') })
      ).supportsProjection()
    ).toEqual({ supported: false, reason: 'not-volume' });
  });

  it('refuses 3D volume rendering viewports on both lanes', () => {
    mockLoadedVolumes();
    expect(
      getViewportAdapter(
        makeProjectableLegacyViewport({ type: ViewportType.VOLUME_3D })
      ).supportsProjection('ds-pt')
    ).toEqual({ supported: false, reason: 'volume3d' });
    expect(
      getViewportAdapter(
        makeProjectableNextViewport({ type: ViewportType.VOLUME_3D_NEXT })
      ).supportsProjection('ds-pt')
    ).toEqual({ supported: false, reason: 'volume3d' });
  });

  it('refuses the native CPU volume lane (it silently drops the slab)', () => {
    mockLoadedVolumes();
    const next = makeProjectableNextViewport({
      getCurrentPlanarRendering: jest.fn().mockReturnValue({ renderMode: 'cpuVolume' }),
    });
    expect(getViewportAdapter(next).supportsProjection('ds-pt')).toEqual({
      supported: false,
      reason: 'cpu-lane',
    });
  });

  it('refuses a partially loaded volume on both lanes', () => {
    mockLoadedVolumes({ loaded: false, loading: true });
    expect(getViewportAdapter(makeProjectableLegacyViewport()).supportsProjection('ds-pt')).toEqual(
      { supported: false, reason: 'volume-not-loaded' }
    );
    expect(getViewportAdapter(makeProjectableNextViewport()).supportsProjection('ds-pt')).toEqual({
      supported: false,
      reason: 'volume-not-loaded',
    });
  });

  it('reports an unresolvable layer', () => {
    mockLoadedVolumes();
    expect(
      getViewportAdapter(makeProjectableLegacyViewport()).supportsProjection('ds-missing')
    ).toEqual({ supported: false, reason: 'layer-unresolved' });
    expect(
      getViewportAdapter(makeProjectableNextViewport()).supportsProjection('ds-missing')
    ).toEqual({ supported: false, reason: 'layer-unresolved' });
  });

  it('windowing after MIP leaves the projection read-back unchanged (T8, adapter level)', () => {
    mockLoadedVolumes();
    const next = makeProjectableNextViewport();
    const adapter = getViewportAdapter(next);
    adapter.setProjection({ blendOp: 'max', slabThickness: 12 }, 'ds-pt');
    adapter.setPresentation({ voiRange: { lower: -100, upper: 300 } }, 'ds-pt');
    expect(adapter.getProjection('ds-pt')).toEqual({ blendOp: 'max', slabThickness: 12 });
    expect(adapter.getPresentation('ds-pt').voiRange).toEqual({ lower: -100, upper: 300 });
  });
});

describe('projection review follow-ups', () => {
  beforeEach(() => mockLoadedVolumes());
  afterEach(() => jest.restoreAllMocks());

  it('legacy: a write at the advertised minimum total width round-trips through the engine floor', () => {
    const legacy = makeProjectableLegacyViewport({
      // Mirror cornerstone: half-widths below 0.1 are floored to 0.05.
      setSlabThickness: jest.fn(function (t: number, filter?: string[]) {
        const floored = t < 0.1 ? 0.05 : t;
        this.getActors()
          .filter(a => (filter ?? []).includes(a.uid))
          .forEach(a => {
            a.slabThickness = floored;
          });
      }),
    });
    const adapter = getViewportAdapter(legacy);
    const { min } = adapter.getSlabRange('ds-pt');
    adapter.setProjection({ blendOp: 'max', slabThickness: min }, 'ds-pt');
    expect(adapter.getProjection('ds-pt')).toEqual({ blendOp: 'max', slabThickness: min });
  });

  it('native: a foreign engine blend is reported as undefined even when the slab is 0', () => {
    const next = makeProjectableNextViewport();
    next.setDisplaySetPresentation('ds-pt', {
      blendMode: Enums.BlendModes.LABELMAP_EDGE_PROJECTION_BLEND,
      slabThickness: 0,
    });
    expect(getViewportAdapter(next).getProjection('ds-pt')).toBeUndefined();
  });
});
