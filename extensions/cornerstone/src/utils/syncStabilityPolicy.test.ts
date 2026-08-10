import { selectStability } from '@ohif/core';

import { installSyncStabilityPolicy } from './syncStabilityPolicy';
import SyncGroupService from '../services/SyncGroupService/SyncGroupService';
import { SynchronizerManager } from '@cornerstonejs/tools';

jest.mock('@cornerstonejs/core', () => ({
  getRenderingEngines: jest.fn(() => []),
  utilities: {
    spatialRegistrationMetadataProvider: { add: jest.fn() },
  },
}));

jest.mock('@cornerstonejs/tools', () => ({
  synchronizers: {},
  Synchronizer: class {},
  SynchronizerManager: {
    getAllSynchronizers: jest.fn(() => []),
    getSynchronizer: jest.fn(),
    destroy: jest.fn(),
    destroySynchronizer: jest.fn(),
  },
}));

jest.mock('../services/SyncGroupService/createHydrateSegmentationSynchronizer', () => jest.fn());

type StabilitySelection = { isStable: boolean; epoch: number; pending: string[] };

describe('installSyncStabilityPolicy', () => {
  let listener: (selected: StabilitySelection, previous: StabilitySelection) => void;
  let selectedSelector: (state: unknown) => unknown;
  let unsubscribe: jest.Mock;
  let viewportGridService: { select: jest.Mock };
  let calls: string[];
  let syncGroupService: { suspendAll: jest.Mock; resumeAll: jest.Mock };
  let servicesManager: AppTypes.ServicesManager;

  const emit = (isStable: boolean, epoch = 0, pending: string[] = []) => {
    listener({ isStable, epoch, pending }, { isStable: !isStable, epoch, pending });
  };

  beforeEach(() => {
    calls = [];
    unsubscribe = jest.fn();
    viewportGridService = {
      select: jest.fn((selector, handler) => {
        selectedSelector = selector;
        listener = handler;
        return unsubscribe;
      }),
    };
    syncGroupService = {
      suspendAll: jest.fn(() => calls.push('suspend')),
      resumeAll: jest.fn(() => calls.push('resume')),
    };
    servicesManager = {
      services: { viewportGridService, syncGroupService },
    } as unknown as AppTypes.ServicesManager;
  });

  it('subscribes to the rendered stability selection', () => {
    installSyncStabilityPolicy({ servicesManager });

    expect(viewportGridService.select).toHaveBeenCalledTimes(1);

    // The subscribed selector must select the same slice as
    // selectStability('rendered') would.
    const state = {
      derived: {
        epoch: 3,
        allMounted: true,
        allRendered: false,
        allSettled: false,
        pendingViewportIds: ['a'],
      },
    };
    expect(selectedSelector(state)).toEqual(selectStability('rendered')(state as never));
  });

  it('suspends synchronizers when the grid becomes unstable', () => {
    installSyncStabilityPolicy({ servicesManager });

    emit(false, 1);

    expect(syncGroupService.suspendAll).toHaveBeenCalledTimes(1);
    expect(syncGroupService.resumeAll).not.toHaveBeenCalled();
  });

  it('resumes synchronizers when the grid becomes stable', () => {
    installSyncStabilityPolicy({ servicesManager });

    emit(true, 1);

    expect(syncGroupService.resumeAll).toHaveBeenCalledTimes(1);
    expect(syncGroupService.suspendAll).not.toHaveBeenCalled();
  });

  it('mirrors a flap sequence as suspend/resume in order', () => {
    installSyncStabilityPolicy({ servicesManager });

    emit(true, 1);
    emit(false, 2);
    emit(true, 2);

    expect(calls).toEqual(['resume', 'suspend', 'resume']);
  });

  it('uninstall unsubscribes and resumes', () => {
    const uninstall = installSyncStabilityPolicy({ servicesManager });

    emit(false, 1);
    expect(syncGroupService.suspendAll).toHaveBeenCalledTimes(1);

    uninstall();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(syncGroupService.resumeAll).toHaveBeenCalledTimes(1);
  });
});

describe('SyncGroupService suspendAll/resumeAll', () => {
  const getAllSynchronizers = SynchronizerManager.getAllSynchronizers as jest.Mock;

  const makeSynchronizer = (id: string, enabled = true) => {
    const synchronizer = {
      id,
      _enabled: enabled,
      setEnabled: jest.fn(function (this: { _enabled: boolean }, value: boolean) {
        this._enabled = value;
      }),
    };
    return synchronizer;
  };

  const createService = () =>
    new SyncGroupService({ services: {} } as unknown as AppTypes.ServicesManager);

  beforeEach(() => {
    getAllSynchronizers.mockReset();
    getAllSynchronizers.mockReturnValue([]);
  });

  it('suspendAll disables only enabled synchronizers and resumeAll re-enables only those', () => {
    const enabledA = makeSynchronizer('a');
    const alreadyDisabled = makeSynchronizer('b', false);
    const enabledC = makeSynchronizer('c');
    getAllSynchronizers.mockReturnValue([enabledA, alreadyDisabled, enabledC]);

    const service = createService();

    service.suspendAll();

    expect(enabledA.setEnabled).toHaveBeenCalledWith(false);
    expect(enabledC.setEnabled).toHaveBeenCalledWith(false);
    expect(alreadyDisabled.setEnabled).not.toHaveBeenCalled();

    service.resumeAll();

    expect(enabledA.setEnabled).toHaveBeenLastCalledWith(true);
    expect(enabledC.setEnabled).toHaveBeenLastCalledWith(true);
    // The externally-disabled synchronizer was never in the record.
    expect(alreadyDisabled.setEnabled).not.toHaveBeenCalled();
    expect(alreadyDisabled._enabled).toBe(false);
  });

  it('suspendAll is idempotent while suspended', () => {
    const synchronizer = makeSynchronizer('a');
    getAllSynchronizers.mockReturnValue([synchronizer]);

    const service = createService();

    service.suspendAll();
    service.suspendAll();

    expect(synchronizer.setEnabled).toHaveBeenCalledTimes(1);

    service.resumeAll();

    expect(synchronizer.setEnabled).toHaveBeenCalledTimes(2);
    expect(synchronizer._enabled).toBe(true);
  });

  it('resumeAll clears its record and is a no-op afterwards', () => {
    const synchronizer = makeSynchronizer('a');
    getAllSynchronizers.mockReturnValue([synchronizer]);

    const service = createService();

    service.suspendAll();
    service.resumeAll();
    service.resumeAll();

    expect(synchronizer.setEnabled).toHaveBeenCalledTimes(2);
  });

  it('resumeAll without a prior suspendAll is a no-op', () => {
    const synchronizer = makeSynchronizer('a');
    getAllSynchronizers.mockReturnValue([synchronizer]);

    const service = createService();

    service.resumeAll();

    expect(synchronizer.setEnabled).not.toHaveBeenCalled();
  });

  it('falls back to isDisabled() when the private _enabled field is absent', () => {
    // Simulates a cs3d upgrade renaming the private field: the guarded read
    // must degrade to the public heuristic instead of suspending nothing.
    const renamedEnabled = {
      id: 'a',
      setEnabled: jest.fn(),
      isDisabled: jest.fn(() => false),
    };
    const renamedDisabled = {
      id: 'b',
      setEnabled: jest.fn(),
      isDisabled: jest.fn(() => true),
    };
    getAllSynchronizers.mockReturnValue([renamedEnabled, renamedDisabled]);

    const service = createService();
    service.suspendAll();

    expect(renamedEnabled.setEnabled).toHaveBeenCalledWith(false);
    expect(renamedDisabled.setEnabled).not.toHaveBeenCalled();

    service.resumeAll();
    expect(renamedEnabled.setEnabled).toHaveBeenLastCalledWith(true);
  });

  it('a second suspendAll picks up synchronizers enabled since the first', () => {
    const first = makeSynchronizer('a');
    getAllSynchronizers.mockReturnValue([first]);

    const service = createService();
    service.suspendAll();

    const late = makeSynchronizer('b');
    getAllSynchronizers.mockReturnValue([first, late]);
    service.suspendAll();

    expect(late.setEnabled).toHaveBeenCalledWith(false);

    service.resumeAll();

    expect(first._enabled).toBe(true);
    expect(late._enabled).toBe(true);
  });
});
