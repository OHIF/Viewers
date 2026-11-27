import { adaptersRT, adaptersSEG } from '@cornerstonejs/adapters';
import { createReportDialogPrompt } from '@ohif/extension-default';
import commandsModule from './commandsModule';
import PROMPT_RESPONSES from '../../default/src/utils/_shared/PROMPT_RESPONSES';

jest.mock('@cornerstonejs/adapters/version', () => ({ version: '9.9.9' }));
jest.mock('@cornerstonejs/adapters', () => ({
  adaptersSEG: { Cornerstone3D: { Segmentation: { generateSegmentation: jest.fn(() => ({})) } } },
  adaptersRT: {
    Cornerstone3D: { RTSS: { generateRTSSFromRepresentation: jest.fn(async () => ({})) } },
  },
}));
jest.mock('@cornerstonejs/core', () => ({
  ...jest.requireActual('@cornerstonejs/core'),
  cache: {
    getImage: () => ({
      referencedImageId: 'ref',
      getPixelData: () => new Uint8Array(1),
      rows: 1,
      columns: 1,
    }),
  },
}));
jest.mock('@cornerstonejs/tools', () => ({
  segmentation: {
    state: { getSegmentation: () => ({ representationData: { Labelmap: {} } }) },
  },
}));
// jest.config.js maps both extensions to one stub module, so one mock gives the names of both.
jest.mock('@ohif/extension-default', () => ({
  createReportDialogPrompt: jest.fn(),
  useUIStateStore: jest.fn(),
  utils: { getSingleLayerExportSource: () => ({ imageIds: ['seg'] }) },
}));

const { generateSegmentation } = adaptersSEG.Cornerstone3D.Segmentation;
const { generateRTSSFromRepresentation } = adaptersRT.Cornerstone3D.RTSS;

const OHIF_WRITER = {
  Manufacturer: 'OHIF',
  ManufacturerModelName: '@cornerstonejs/adapters',
  SoftwareVersions: ['OHIF 3.14.0', 'CS3D 9.9.9'],
};

function getActions(services = {}, commandsManager = {}) {
  const segmentationService = {
    getSegmentation: () => ({ segments: {}, label: 'Contours' }),
    getRepresentationsForSegmentation: () => [{ viewportId: 'viewport' }],
    getSegmentColor: () => [0, 0, 0, 255],
  };
  const { actions } = commandsModule({
    servicesManager: {
      services: {
        segmentationService,
        customizationService: { getCustomization: () => {} },
        ...services,
      },
    },
    extensionManager: { getActiveDataSourceDefinition: () => ({}) },
    commandsManager,
  } as never);
  return actions;
}

describe('SEG and RTSTRUCT writer header', () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.VERSION_NUMBER = '3.14.0';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('names OHIF and the CS3D adapters as the writer of the SEG', () => {
    getActions().generateSegmentation({ segmentationId: 'seg' });

    expect(jest.mocked(generateSegmentation).mock.calls[0][3]).toMatchObject(OHIF_WRITER);
  });

  it('names OHIF and the CS3D adapters as the writer of the RTSTRUCT', async () => {
    await getActions().generateContour({ segmentationId: 'seg' });

    expect(jest.mocked(generateRTSSFromRepresentation).mock.calls[0][1]).toMatchObject(OHIF_WRITER);
  });

  it('keeps a writer value that the caller gives', async () => {
    const options = { Manufacturer: 'Site viewer' };
    const actions = getActions();
    actions.generateSegmentation({ segmentationId: 'seg', options });
    await actions.generateContour({ segmentationId: 'seg', options });

    expect(jest.mocked(generateSegmentation).mock.calls[0][3].Manufacturer).toBe('Site viewer');
    expect(jest.mocked(generateRTSSFromRepresentation).mock.calls[0][1].Manufacturer).toBe(
      'Site viewer'
    );
  });
});

describe('storeSegmentation', () => {
  it('stores one series when the user saves the same segmentation again during a save', async () => {
    let finishStore;
    const storeFn = jest.fn(() => new Promise(resolve => (finishStore = resolve)));
    const uiNotificationService = { show: jest.fn() };
    jest
      .mocked(createReportDialogPrompt)
      .mockResolvedValue({ action: PROMPT_RESPONSES.CREATE_REPORT, dataSourceName: 'ds' } as never);
    const actions = getActions({ uiNotificationService }, { runCommand: () => storeFn });
    const save = () => actions.storeSegmentation({ segmentationId: 'seg', modality: 'RTSTRUCT' });

    const firstSave = save();
    await new Promise(resolve => setTimeout(resolve));
    await save();
    finishStore();
    await firstSave;

    expect(storeFn).toHaveBeenCalledTimes(1);
    expect(uiNotificationService.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning' })
    );
  });
});
