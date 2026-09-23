import PROMPT_RESPONSES from './_shared/PROMPT_RESPONSES';

const mockCreateReportDialogPrompt = jest.fn();
const mockCreateReportAsync = jest.fn();

jest.mock('../Panels', () => ({
  createReportDialogPrompt: (...args) => mockCreateReportDialogPrompt(...args),
}));

jest.mock('../Actions/createReportAsync', () => ({
  __esModule: true,
  default: (...args) => mockCreateReportAsync(...args),
}));

import promptSaveReport from './promptSaveReport';

const MEASUREMENTS = [{ uid: 'measurement-1' }, { uid: 'measurement-2' }];

function setup({ storedDisplaySet = { predecessorImageId: 'wadors:/stored-sr' } } = {}) {
  const runCommand = jest.fn();
  const servicesManager = {
    services: {
      measurementService: { getMeasurements: () => MEASUREMENTS },
      displaySetService: { getDisplaySetByUID: jest.fn(() => storedDisplaySet) },
    },
  };

  mockCreateReportDialogPrompt.mockResolvedValue({
    action: PROMPT_RESPONSES.CREATE_REPORT,
    value: 'Measurements',
    dataSourceName: 'dicomweb',
    series: null,
    seriesNumber: 3001,
  });
  // Stands in for the store, which is what the real one drives through getReport.
  mockCreateReportAsync.mockImplementation(async ({ getReport }) => {
    await getReport();
    return ['created-display-set'];
  });

  const run = () =>
    promptSaveReport(
      { servicesManager, commandsManager: { runCommand }, extensionManager: {} } as any,
      { trackedStudy: '1.2.3', trackedSeries: ['1.2.3.4'], measurementFilter: () => true },
      { data: { StudyInstanceUID: '1.2.3', viewportId: 'viewport-1', isBackupSave: false } }
    );

  return { run, runCommand, servicesManager };
}

const commandCall = (runCommand: jest.Mock, name: string) =>
  runCommand.mock.calls.find(call => call[0] === name);

describe('promptSaveReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores the measurements with the series the dialog resolved', async () => {
    const { run, runCommand } = setup();

    await run();

    expect(commandCall(runCommand, 'storeMeasurements')[1]).toMatchObject({
      dataSource: 'dicomweb',
      options: {
        SeriesDescription: 'Measurements',
        SeriesNumber: 3001,
        predecessorImageId: null,
      },
    });
  });

  it('records the report just written as the predecessor of the measurements', async () => {
    const { run, runCommand, servicesManager } = setup();

    await run();

    expect(servicesManager.services.displaySetService.getDisplaySetByUID).toHaveBeenCalledWith(
      'created-display-set'
    );
    expect(commandCall(runCommand, 'recordMeasurementsPredecessor')[1]).toEqual({
      measurements: MEASUREMENTS,
      predecessorImageId: 'wadors:/stored-sr',
    });
  });

  it('records nothing when the stored report cannot be identified', async () => {
    const { run, runCommand } = setup({ storedDisplaySet: {} });

    await run();

    expect(commandCall(runCommand, 'recordMeasurementsPredecessor')).toBeUndefined();
  });

  it('does not store anything when the dialog is cancelled', async () => {
    const { run, runCommand } = setup();
    mockCreateReportDialogPrompt.mockResolvedValue({ action: PROMPT_RESPONSES.CANCEL });

    const result = await run();

    expect(mockCreateReportAsync).not.toHaveBeenCalled();
    expect(runCommand).not.toHaveBeenCalled();
    expect(result.userResponse).toBe(PROMPT_RESPONSES.CANCEL);
  });
});
