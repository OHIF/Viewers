import { adaptersRT, adaptersSEG } from '@cornerstonejs/adapters';
import commandsModule from './commandsModule';

jest.mock('@cornerstonejs/adapters', () => ({
  version: '5.13.2',
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
jest.mock('@ohif/extension-default', () => ({
  createReportDialogPrompt: jest.fn(),
  useUIStateStore: jest.fn(),
}));
jest.mock('@ohif/extension-cornerstone', () => ({
  utils: { getSingleLayerExportSource: () => ({ imageIds: ['seg'] }) },
}));

const { generateSegmentation } = adaptersSEG.Cornerstone3D.Segmentation;
const { generateRTSSFromRepresentation } = adaptersRT.Cornerstone3D.RTSS;

const OHIF_WRITER = {
  Manufacturer: 'OHIF',
  ManufacturerModelName: '@cornerstonejs/adapters',
  SoftwareVersions: ['OHIF 3.14.0', 'CS3D 5.13.2'],
};

function getActions() {
  const segmentationService = {
    getSegmentation: () => ({ segments: {} }),
    getRepresentationsForSegmentation: () => [{ viewportId: 'viewport' }],
    getSegmentColor: () => [0, 0, 0, 255],
  };
  const { actions } = commandsModule({
    servicesManager: {
      services: { segmentationService, customizationService: { getCustomization: () => {} } },
    },
    extensionManager: { getActiveDataSourceDefinition: () => ({}) },
    commandsManager: {},
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
