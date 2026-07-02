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
    const spy = jest
      .spyOn(cache, 'getVolumes')
      .mockReturnValue([{ volumeId: 'volumeId-ds-1', voxelManager }] as never);
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
