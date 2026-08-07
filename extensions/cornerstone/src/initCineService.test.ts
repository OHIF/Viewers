import { cache } from '@cornerstonejs/core';
import initCineService from './initCineService';

jest.mock('@cornerstonejs/core', () => ({
  cache: { getVolume: jest.fn() },
}));

jest.mock('@cornerstonejs/tools', () => ({
  utilities: { cine: { playClip: jest.fn(), stopClip: jest.fn() } },
}));

const DYNAMIC_VOLUME_ID = 'volume-dynamic';

function makeDynamicVolume() {
  return { volumeId: DYNAMIC_VOLUME_ID, isDynamicVolume: () => true };
}

function makeStaticVolume() {
  return { volumeId: 'volume-static', isDynamicVolume: () => false };
}

function makeVolumeViewport(volumeIds: string[]) {
  return {
    getAllVolumeIds: () => volumeIds,
    hasVolumeId: (volumeId: string) => volumeIds.includes(volumeId),
  };
}

// Stack (and other non-volume) viewports have no getAllVolumeIds.
function makeStackViewport() {
  return {};
}

function makeServicesManager({
  gridViewports,
  cornerstoneViewports,
}: {
  gridViewports: Array<{ viewportId: string; viewportOptions?: Record<string, unknown> }>;
  cornerstoneViewports: Record<string, unknown>;
}) {
  const implementations: Record<string, unknown> = {};

  const viewports = new Map(
    gridViewports.map(vp => [vp.viewportId, { viewportOptions: {}, ...vp }])
  );

  return {
    implementations,
    servicesManager: {
      services: {
        cineService: {
          setServiceImplementation: impl => Object.assign(implementations, impl),
        },
        viewportGridService: {
          getState: () => ({ viewports }),
        },
        cornerstoneViewportService: {
          getCornerstoneViewport: (viewportId: string) => cornerstoneViewports[viewportId] ?? null,
        },
      },
    } as unknown as AppTypes.ServicesManager,
  };
}

describe('initCineService getSyncedViewports', () => {
  beforeEach(() => {
    (cache.getVolume as jest.Mock).mockReset();
    (cache.getVolume as jest.Mock).mockImplementation(volumeId =>
      volumeId === DYNAMIC_VOLUME_ID ? makeDynamicVolume() : makeStaticVolume()
    );
  });

  // Regression: the mount pipeline applies its dynamic-volume viewportType
  // override on a mount-local copy, so the grid composition can keep
  // viewportType undefined for a 4D series mounted through the fallback.
  // Volume-ness must come from the live viewport, not grid state.
  it('syncs 4D viewports even when the grid composition never set viewportType=volume', () => {
    const { implementations, servicesManager } = makeServicesManager({
      gridViewports: [
        { viewportId: 'vp-src', viewportOptions: {} },
        { viewportId: 'vp-other', viewportOptions: {} },
        { viewportId: 'vp-unrelated', viewportOptions: {} },
      ],
      cornerstoneViewports: {
        'vp-src': makeVolumeViewport([DYNAMIC_VOLUME_ID]),
        'vp-other': makeVolumeViewport([DYNAMIC_VOLUME_ID]),
        'vp-unrelated': makeStackViewport(),
      },
    });

    initCineService(servicesManager);

    const synced = (implementations.getSyncedViewports as (id: string) => unknown[])('vp-src');
    expect(synced).toEqual([{ viewportId: 'vp-other' }]);
  });

  it('returns [] when the source viewport is not a volume viewport', () => {
    const { implementations, servicesManager } = makeServicesManager({
      gridViewports: [{ viewportId: 'vp-src' }, { viewportId: 'vp-other' }],
      cornerstoneViewports: {
        'vp-src': makeStackViewport(),
        'vp-other': makeVolumeViewport([DYNAMIC_VOLUME_ID]),
      },
    });

    initCineService(servicesManager);

    expect((implementations.getSyncedViewports as (id: string) => unknown[])('vp-src')).toEqual([]);
  });

  it('returns [] when the source volume is not dynamic', () => {
    const { implementations, servicesManager } = makeServicesManager({
      gridViewports: [{ viewportId: 'vp-src' }, { viewportId: 'vp-other' }],
      cornerstoneViewports: {
        'vp-src': makeVolumeViewport(['volume-static']),
        'vp-other': makeVolumeViewport(['volume-static']),
      },
    });

    initCineService(servicesManager);

    expect((implementations.getSyncedViewports as (id: string) => unknown[])('vp-src')).toEqual([]);
  });

  it('returns [] when the source viewport is not enabled yet', () => {
    const { implementations, servicesManager } = makeServicesManager({
      gridViewports: [{ viewportId: 'vp-src' }],
      cornerstoneViewports: {},
    });

    initCineService(servicesManager);

    expect((implementations.getSyncedViewports as (id: string) => unknown[])('vp-src')).toEqual([]);
  });

  it('tolerates volume ids that are not in the cache yet', () => {
    (cache.getVolume as jest.Mock).mockReturnValue(undefined);
    const { implementations, servicesManager } = makeServicesManager({
      gridViewports: [{ viewportId: 'vp-src' }],
      cornerstoneViewports: {
        'vp-src': makeVolumeViewport([DYNAMIC_VOLUME_ID]),
      },
    });

    initCineService(servicesManager);

    expect((implementations.getSyncedViewports as (id: string) => unknown[])('vp-src')).toEqual([]);
  });
});
