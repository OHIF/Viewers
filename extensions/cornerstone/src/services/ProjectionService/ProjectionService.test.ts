import { Enums, cache } from '@cornerstonejs/core';
import ProjectionService from './ProjectionService';

const MIP = Enums.BlendModes.MAXIMUM_INTENSITY_BLEND;
const COMPOSITE = Enums.BlendModes.COMPOSITE;

/**
 * Native planar volume viewport mock with two layers (CT source, PT overlay).
 * The adapter lane is chosen by getViewportAdapter from the surface, so this
 * exercises the real NextViewportAdapter under the service.
 */
function makeViewport(id = 'viewport-1') {
  const presentations: Record<string, Record<string, unknown>> = { 'ds-ct': {}, 'ds-pt': {} };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewport: any = {
    id,
    setDisplaySets: jest.fn().mockResolvedValue(undefined),
    getViewState: jest.fn().mockReturnValue({}),
    setViewState: jest.fn(),
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
    getViewReference: jest.fn().mockReturnValue({}),
    render: jest.fn(),
  };
  return viewport;
}

function makeServices(viewport) {
  const listeners: Record<string, Array<(evt: unknown) => void>> = {};
  const subscribe = (event: string, cb: (evt: unknown) => void) => {
    (listeners[event] ??= []).push(cb);
    return {
      unsubscribe: () => {
        listeners[event] = listeners[event].filter(l => l !== cb);
      },
    };
  };
  const emit = (event: string, payload: unknown) =>
    (listeners[event] ?? []).forEach(l => l(payload));

  const cornerstoneViewportService = {
    EVENTS: {
      VIEWPORT_DATA_CHANGED: 'vdc',
      VIEWPORT_VOLUMES_CHANGED: 'vvc',
    },
    subscribe,
    getCornerstoneViewport: jest.fn((id: string) => (id === viewport.id ? viewport : undefined)),
    getViewportInfo: jest.fn(() => ({ getOrientation: () => 'axial' })),
  };
  const displaySets = {
    'ds-ct': { displaySetInstanceUID: 'ds-ct', isReconstructable: true },
    'ds-pt': { displaySetInstanceUID: 'ds-pt', isReconstructable: true },
  };
  const gridState = {
    activeViewportId: viewport.id,
    viewports: new Map([
      [viewport.id, { displaySetInstanceUIDs: ['ds-ct', 'ds-pt'], displaySetOptions: [{}, {}] }],
    ]),
  };
  const services = {
    cornerstoneViewportService,
    viewportGridService: {
      getState: () => gridState,
      getActiveViewportId: () => gridState.activeViewportId,
      getDisplaySetsUIDsForViewport: (id: string) =>
        gridState.viewports.get(id)?.displaySetInstanceUIDs,
    },
    displaySetService: {
      getDisplaySetByUID: (uid: string) => displaySets[uid],
    },
    toolbarService: { refreshToolbarState: jest.fn() },
  };
  const servicesManager = { services } as unknown as AppTypes.ServicesManager;
  const commandsManager = { run: jest.fn() } as unknown as AppTypes.CommandsManager;
  return { servicesManager, commandsManager, emit, services };
}

describe('ProjectionService', () => {
  let viewport;
  let service: ProjectionService;
  let emit: (event: string, payload: unknown) => void;
  let services;

  beforeEach(() => {
    const volumes = [
      {
        volumeId: 'volumeId:ds-ct',
        dimensions: [32, 32, 32],
        spacing: [1, 1, 1],
        loadStatus: { loaded: true },
      },
      {
        volumeId: 'volumeId:ds-pt',
        dimensions: [32, 32, 32],
        spacing: [1, 1, 1],
        loadStatus: { loaded: true },
      },
    ];
    jest
      .spyOn(cache, 'getVolume')
      .mockImplementation((id: string) => volumes.find(v => v.volumeId === id) as never);
    jest.spyOn(cache, 'getVolumes').mockReturnValue(volumes as never);

    viewport = makeViewport();
    const env = makeServices(viewport);
    emit = env.emit;
    services = env.services;
    service = new ProjectionService(env.servicesManager, env.commandsManager);
  });

  afterEach(() => {
    service.destroy();
    jest.restoreAllMocks();
  });

  it('enables MIP on the foreground layer with the default slab and renders once', async () => {
    const result = await service.setProjectionMode({ modeId: 'mip' });
    expect(result).toEqual({ applied: true, projection: { blendOp: 'max', slabThickness: 10 } });
    expect(viewport.setDisplaySetPresentation).toHaveBeenCalledWith('ds-pt', {
      blendMode: MIP,
      slabThickness: 10,
    });
    expect(viewport.render).toHaveBeenCalledTimes(1);
    // The other fusion layer is untouched.
    expect(viewport.getDisplaySetPresentation('ds-ct')).toEqual({});
  });

  it('broadcasts PROJECTION_CHANGED with a payload read back from the engine', async () => {
    const listener = jest.fn();
    service.subscribe(ProjectionService.EVENTS.PROJECTION_CHANGED, listener);
    await service.setProjectionMode({ modeId: 'mip', slabThickness: 25 });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        viewportId: 'viewport-1',
        displaySetInstanceUID: 'ds-pt',
        projection: { blendOp: 'max', slabThickness: 25 },
        support: { supported: true },
      })
    );
    expect(services.toolbarService.refreshToolbarState).toHaveBeenCalledWith({
      viewportId: 'viewport-1',
    });
  });

  it('setSlabThickness restates the current mode with the new thickness (one write, one render)', async () => {
    await service.setProjectionMode({ modeId: 'mip' });
    viewport.render.mockClear();
    viewport.setDisplaySetPresentation.mockClear();

    await service.setSlabThickness({ slabThickness: 30 });
    expect(viewport.setDisplaySetPresentation).toHaveBeenCalledTimes(1);
    expect(viewport.setDisplaySetPresentation).toHaveBeenCalledWith('ds-pt', {
      blendMode: MIP,
      slabThickness: 30,
    });
    expect(viewport.render).toHaveBeenCalledTimes(1);
    expect(service.getProjection()).toEqual({ blendOp: 'max', slabThickness: 30 });
  });

  it('clamps the slab thickness to the volume diagonal', async () => {
    await service.setProjectionMode({ modeId: 'mip', slabThickness: 100000 });
    expect(service.getProjection()?.slabThickness).toBeCloseTo(Math.sqrt(3) * 32);
  });

  it('T5: re-applies the stored projection for the projected layer only after a volume remount', async () => {
    await service.setProjectionMode({
      modeId: 'mip',
      slabThickness: 20,
      displaySetInstanceUID: 'ds-pt',
    });

    // Simulate the rebuild: a fresh viewport instance with blank presentations.
    const rebuilt = makeViewport();
    services.cornerstoneViewportService.getCornerstoneViewport.mockImplementation((id: string) =>
      id === rebuilt.id ? rebuilt : undefined
    );
    emit('vvc', { viewportInfo: { getViewportId: () => 'viewport-1' } });

    expect(rebuilt.setDisplaySetPresentation).toHaveBeenCalledWith('ds-pt', {
      blendMode: MIP,
      slabThickness: 20,
    });
    expect(rebuilt.getDisplaySetPresentation('ds-ct')).toEqual({});
    expect(rebuilt.render).toHaveBeenCalledTimes(1);
    expect(service.getProjection({ displaySetInstanceUID: 'ds-pt' })).toEqual({
      blendOp: 'max',
      slabThickness: 20,
    });
    expect(service.getProjection({ displaySetInstanceUID: 'ds-ct' })).toEqual({
      blendOp: 'none',
      slabThickness: 0,
    });
  });

  it('T6: MIP -> off restores composite rendering and stops restoring on remount', async () => {
    await service.setProjectionMode({ modeId: 'mip' });
    const off = await service.setProjectionMode({ modeId: 'none' });
    expect(off).toEqual({ applied: true, projection: { blendOp: 'none', slabThickness: 0 } });
    expect(viewport.setDisplaySetPresentation).toHaveBeenLastCalledWith('ds-pt', {
      blendMode: COMPOSITE,
      slabThickness: 0,
    });

    const rebuilt = makeViewport();
    services.cornerstoneViewportService.getCornerstoneViewport.mockImplementation((id: string) =>
      id === rebuilt.id ? rebuilt : undefined
    );
    emit('vvc', { viewportInfo: { getViewportId: () => 'viewport-1' } });
    expect(rebuilt.setDisplaySetPresentation).not.toHaveBeenCalled();
  });

  it('T7: refuses 3D viewports, non-reconstructable data and missing viewports with a message', async () => {
    const threeD = await service.setProjectionMode({ modeId: 'mip', viewportId: 'missing' });
    expect(threeD).toMatchObject({ applied: false, reason: 'no-viewport' });

    viewport.type = Enums.ViewportType.VOLUME_3D_NEXT;
    const result3d = await service.setProjectionMode({ modeId: 'mip' });
    expect(result3d).toMatchObject({ applied: false, reason: '3d-viewport' });
    delete viewport.type;

    services.displaySetService.getDisplaySetByUID = (uid: string) => ({
      displaySetInstanceUID: uid,
      isReconstructable: false,
    });
    const notRecon = await service.setProjectionMode({ modeId: 'mip' });
    expect(notRecon).toMatchObject({ applied: false, reason: 'not-reconstructable' });
    expect((notRecon as { message: string }).message).toMatch(/reconstructable/);
    expect(viewport.setDisplaySetPresentation).not.toHaveBeenCalled();
  });

  it('T7: refuses the CPU lane through the adapter', async () => {
    viewport.getCurrentPlanarRendering.mockReturnValue({ renderMode: 'cpuVolume' });
    const result = await service.setProjectionMode({ modeId: 'mip' });
    expect(result).toMatchObject({ applied: false, reason: 'cpu-lane' });
    expect(viewport.setDisplaySetPresentation).not.toHaveBeenCalled();
  });

  it('getProjection is an engine read-back, not the stored value', async () => {
    await service.setProjectionMode({ modeId: 'mip', slabThickness: 15 });
    // A third party changes the engine behind our back.
    viewport.setDisplaySetPresentation('ds-pt', { blendMode: COMPOSITE, slabThickness: 0 });
    expect(service.getProjection()).toEqual({ blendOp: 'none', slabThickness: 0 });
  });
});

describe('ProjectionService snapshot on a 2D stack viewport', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reports promotionAvailable so the UI offers the switch although the engine cannot project yet', () => {
    jest.spyOn(cache, 'getVolume').mockReturnValue(undefined as never);
    jest.spyOn(cache, 'getVolumes').mockReturnValue([] as never);
    const viewport = makeViewport();
    viewport.getCurrentMode.mockReturnValue('stack');
    const env = makeServices(viewport);
    const service = new ProjectionService(env.servicesManager, env.commandsManager);

    const snapshot = service.snapshot();
    expect(snapshot?.support).toEqual({ supported: false, reason: 'not-volume' });
    expect(snapshot?.promotionAvailable).toBe(true);

    env.services.displaySetService.getDisplaySetByUID = (uid: string) => ({
      displaySetInstanceUID: uid,
      isReconstructable: false,
    });
    expect(service.snapshot()?.promotionAvailable).toBe(false);
    service.destroy();
  });
});
