/**
 * The one-up toggle store (`useToggleOneUpViewportGridStore`) must only ever
 * hold a one-up that is currently active and can be toggled back. Any explicit
 * layout change that actually proceeds — a common grid (`setViewportGridLayout`)
 * or a protocol/preset (`setHangingProtocol`) — abandons a pending one-up, so
 * those commands clear the store. Without this, reaching a 1x1 preset (e.g.
 * "3D only") and double-clicking it restores a stale grid left over from an
 * earlier one-up.
 *
 * A layout change that does NOT proceed must leave the store untouched: if the
 * protocol's `onLayoutChange` callback vetoes the grid change, we are still in
 * the pending one-up and the toggle-back state must survive.
 *
 * The command module pulls a large dependency graph (OHIF core/app, cornerstone,
 * the context-menu controller, …), so the heavy imports are mocked out; the real
 * store is kept so we can assert the clearing behaviour, and the services are
 * stubbed enough for each command to run its happy path to completion.
 */

// --- Mock the heavy / resolution-breaking imports (keep the real store) ------
jest.mock('@ohif/core', () => ({ Types: {}, DicomMetadataStore: {}, utils: {} }), {
  virtual: true,
});
jest.mock('@ohif/app', () => ({ history: {} }), { virtual: true });
jest.mock('../utils/dicomWriter', () => ({
  datasetToDicomBlob: jest.fn(),
  setNonEnumerableInstanceProperty: jest.fn(),
}));
jest.mock('../utils/registerNaturalizedDatasetForLocalWadouri', () => ({
  registerNaturalizedDatasetsForLocalWadouri: jest.fn(),
}));
jest.mock('../CustomizableContextMenu', () => ({ ContextMenuController: class {} }));
jest.mock('../DicomTagBrowser/DicomTagBrowser', () => ({ __esModule: true, default: class {} }));
jest.mock('../utils/reuseCachedLayouts', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../utils/layerConfigurationUtils', () => ({
  configureViewportForLayerAddition: jest.fn(),
  configureViewportForLayerRemoval: jest.fn(),
  canAddDisplaySetToViewport: jest.fn(),
  DERIVED_OVERLAY_MODALITIES: [],
}));
jest.mock('../findViewportsByPosition', () => ({
  __esModule: true,
  default: jest.fn(),
  findOrCreateViewport: jest.fn(),
}));
jest.mock('../Panels/requestDisplaySetCreationForStudy', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../utils/promptSaveReport', () => ({ __esModule: true, default: jest.fn() }));

import commandsModule from '../commandsModule';
import { useToggleOneUpViewportGridStore } from '../stores/useToggleOneUpViewportGridStore';

/**
 * Build the commands module with services stubbed enough that the two layout
 * commands complete their happy path. `onLayoutChange` lets a test install a
 * grid-change veto callback on the active protocol.
 */
function makeCommandsModule({ onLayoutChange }: { onLayoutChange?: () => unknown } = {}) {
  const noop = () => undefined;
  const services = {
    customizationService: { getCustomization: noop },
    measurementService: {},
    hangingProtocolService: {
      // setViewportGridLayout reads the active protocol's onLayoutChange callback.
      getActiveProtocol: () => ({ protocol: { callbacks: { onLayoutChange } } }),
      getState: () => ({ protocolId: 'someProtocol', stageIndex: 0, activeStudyUID: 'study' }),
      getStageIndex: () => 0,
      setActiveStudyUID: () => false,
      setProtocol: noop,
      run: noop,
    },
    uiNotificationService: { show: noop },
    viewportGridService: {
      getState: () => ({ layout: { numRows: 1, numCols: 1 }, viewports: new Map() }),
      setLayout: noop,
      set: noop,
      getLayoutOptionsFromState: () => [],
    },
    displaySetService: { getActiveDisplaySets: () => [] },
    multiMonitorService: {},
  };
  // Run function-valued commands (the onLayoutChange callback) so a veto is
  // observable; ignore string command ids used elsewhere.
  const commandsManager = {
    run: (cmd: unknown, options: unknown) => (typeof cmd === 'function' ? cmd(options) : undefined),
    runCommand: noop,
  };
  const extensionManager = { getActiveDataSource: () => [] };
  return commandsModule({
    servicesManager: { services },
    commandsManager,
    extensionManager,
  } as any);
}

const store = () => useToggleOneUpViewportGridStore.getState();
const seedPendingOneUp = () =>
  store().setToggleOneUpViewportGridStore({
    activeViewportId: 'v',
    layout: { numRows: 2, numCols: 3 },
    viewports: new Map(),
  });

describe('commandsModule — one-up store is cleared only on layout changes that proceed', () => {
  beforeEach(() => {
    store().clearToggleOneUpViewportGridStore();
  });

  it('setViewportGridLayout clears a pending one-up when the change proceeds', () => {
    const { actions } = makeCommandsModule();
    seedPendingOneUp();
    expect(store().toggleOneUpViewportGridStore).not.toBeNull();

    actions.setViewportGridLayout({ numRows: 1, numCols: 1 });

    expect(store().toggleOneUpViewportGridStore).toBeNull();
  });

  it('setViewportGridLayout keeps the one-up when onLayoutChange vetoes the change', () => {
    const { actions } = makeCommandsModule({ onLayoutChange: () => false });
    seedPendingOneUp();
    expect(store().toggleOneUpViewportGridStore).not.toBeNull();

    actions.setViewportGridLayout({ numRows: 1, numCols: 1 });

    // Change was rejected — the toggle-back state must survive so the next
    // double-click still restores.
    expect(store().toggleOneUpViewportGridStore).not.toBeNull();
  });

  it('setHangingProtocol clears a pending one-up (advanced presets like "3D only")', () => {
    const { actions } = makeCommandsModule();
    seedPendingOneUp();
    expect(store().toggleOneUpViewportGridStore).not.toBeNull();

    const applied = actions.setHangingProtocol({ protocolId: 'someProtocol' });

    expect(applied).toBe(true);
    expect(store().toggleOneUpViewportGridStore).toBeNull();
  });
});
