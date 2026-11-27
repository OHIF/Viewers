jest.mock(
  '@ohif/core',
  () => ({
    utils: { guid: jest.fn(() => 'display-set'), getLatestInstanceDateTime: () => ({}) },
  }),
  { virtual: true }
);
jest.mock('@ohif/i18n', () => ({ t: value => value }), { virtual: true });
jest.mock(
  '@cornerstonejs/core',
  () => ({
    utilities: {
      genericMetadataProvider: { add: jest.fn() },
    },
    Enums: { ViewportType: { VIDEO: 'VIDEO' } },
  }),
  { virtual: true }
);

import getSopClassHandlerModule from './getSopClassHandlerModule';

const SOP_CLASS_UIDS = {
  VIDEO_MICROSCOPIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.2.1',
  VIDEO_PHOTOGRAPHIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.4.1',
  VIDEO_ENDOSCOPIC_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.1.1',
  SECONDARY_CAPTURE_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.7',
  MULTIFRAME_TRUE_COLOR_SECONDARY_CAPTURE_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.7.4',
};

const makeInstance = overrides => ({
  imageId: 'wadors:study/series/instance',
  url: 'https://example.test/dicom-web/studies/study/series/series/instances/instance',
  Modality: 'ES',
  NumberOfFrames: 60,
  SeriesDescription: 'Synthetic video routing fixture',
  SeriesNumber: 1,
  SeriesDate: '20260101',
  StudyInstanceUID: 'study',
  SeriesInstanceUID: 'series',
  SOPInstanceUID: 'instance',
  ...overrides,
});

const makeHandler = () => {
  const dataSource = {
    retrieve: {
      directURL: jest.fn(() => 'https://example.test/video'),
      getGetThumbnailSrc: jest.fn(),
    },
  };
  const extensionManager = {
    getActiveDataSource: jest.fn(() => [dataSource]),
  };
  const handler = getSopClassHandlerModule({ servicesManager: {}, extensionManager })[0];

  return { handler, dataSource };
};

const classify = overrides => {
  const { handler } = makeHandler();
  return handler.getDisplaySetsFromSeries([makeInstance(overrides)]);
};

describe('getSopClassHandlerModule video routing', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['microscopic', SOP_CLASS_UIDS.VIDEO_MICROSCOPIC_IMAGE_STORAGE],
    ['photographic', SOP_CLASS_UIDS.VIDEO_PHOTOGRAPHIC_IMAGE_STORAGE],
    ['endoscopic', SOP_CLASS_UIDS.VIDEO_ENDOSCOPIC_IMAGE_STORAGE],
  ])('accepts the %s video SOP class without transfer-syntax metadata', (_name, SOPClassUID) => {
    expect(classify({ SOPClassUID })).toHaveLength(1);
  });

  it('preserves the 90-frame heuristic for secondary capture', () => {
    const SOPClassUID = SOP_CLASS_UIDS.SECONDARY_CAPTURE_IMAGE_STORAGE;
    expect(classify({ SOPClassUID, NumberOfFrames: '89' })).toHaveLength(0);
    expect(classify({ SOPClassUID, NumberOfFrames: '90' })).toHaveLength(1);
    expect(classify({ SOPClassUID, NumberOfFrames: undefined })).toHaveLength(0);
  });
});
