import { TextEncoder, TextDecoder } from 'util';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import OHIF from '@ohif/core';
import {
  registerNaturalizedDatasetForLocalWadouri,
  releaseLocalWadouriRegistrations,
} from './registerNaturalizedDatasetForLocalWadouri';

// jsdom does not expose TextEncoder/TextDecoder, which dcmjs's buffer streams need.
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

jest.mock('@cornerstonejs/dicom-image-loader', () => ({
  __esModule: true,
  default: {
    wadouri: {
      fileManager: {
        add: jest.fn(() => 'dicomfile:0'),
        remove: jest.fn(),
      },
      dataSetCacheManager: {
        isLoaded: jest.fn(() => false),
        unload: jest.fn(),
      },
    },
  },
}));

jest.mock('@ohif/core', () => ({
  __esModule: true,
  default: {
    classes: {
      MetadataProvider: {
        addImageIdToUIDs: jest.fn(),
      },
    },
    log: {
      debug: jest.fn(),
    },
  },
}));

const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';

const addBlob = dicomImageLoader.wadouri.fileManager.add;
const addImageIdToUIDs = OHIF.classes.MetadataProvider.addImageIdToUIDs;

function makeDataset(extra = {}) {
  return {
    _meta: { TransferSyntaxUID: { vr: 'UI', Value: [EXPLICIT_VR_LITTLE_ENDIAN] } },
    SOPInstanceUID: '1.2.3.4.5',
    StudyInstanceUID: '1.2.3.4',
    SeriesInstanceUID: '1.2.3.4.1',
    PatientID: 'TEST-PATIENT',
    ...extra,
  };
}

describe('registerNaturalizedDatasetForLocalWadouri', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Drain the module-level registration tracking between tests.
    releaseLocalWadouriRegistrations();
  });

  it('skips datasets without pixel data (SR/RTSTRUCT) and does not mutate them', () => {
    const dataset = makeDataset({
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.88.33',
      Modality: 'SR',
    });

    const imageId = registerNaturalizedDatasetForLocalWadouri(dataset);

    // No frames to serve through the image loader: nothing registered, no Blob pinned.
    expect(imageId).toBeUndefined();
    expect(addBlob).not.toHaveBeenCalled();
    expect(addImageIdToUIDs).not.toHaveBeenCalled();

    // The serialized form of an SR must not gain a (0028,0008) element or a url.
    expect(Object.prototype.hasOwnProperty.call(dataset, 'NumberOfFrames')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(dataset, 'url')).toBe(false);
  });

  it('registers a single-frame pixel-bearing dataset without stamping NumberOfFrames', () => {
    const dataset = makeDataset({
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
      Modality: 'OT',
      PixelData: new Uint8Array(4).buffer,
    });

    const imageId = registerNaturalizedDatasetForLocalWadouri(dataset);

    expect(Object.prototype.hasOwnProperty.call(dataset, 'NumberOfFrames')).toBe(false);

    expect(imageId).toBe('dicomfile:0');
    expect(addBlob).toHaveBeenCalledTimes(1);
    // Single frame: the bare imageId is mapped, no ?frame= query.
    expect(addImageIdToUIDs).toHaveBeenCalledTimes(1);
    expect(addImageIdToUIDs).toHaveBeenCalledWith('dicomfile:0', {
      StudyInstanceUID: '1.2.3.4',
      SeriesInstanceUID: '1.2.3.4.1',
      SOPInstanceUID: '1.2.3.4.5',
      frameNumber: 1,
    });
  });

  it('still registers per-frame imageIds (and NumberOfFrames) for a multiframe SEG', () => {
    const dataset = makeDataset({
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      Modality: 'SEG',
      PerFrameFunctionalGroupsSequence: [{}, {}, {}],
    });

    registerNaturalizedDatasetForLocalWadouri(dataset);

    // Legitimately multiframe: the count is derived from the per-frame groups
    // and must be serialized (enumerable).
    expect(dataset.NumberOfFrames).toBe(3);
    expect(Object.getOwnPropertyDescriptor(dataset, 'NumberOfFrames').enumerable).toBe(true);

    expect(addImageIdToUIDs).toHaveBeenCalledTimes(3);
    for (let frame = 1; frame <= 3; frame++) {
      expect(addImageIdToUIDs).toHaveBeenNthCalledWith(frame, `dicomfile:0?frame=${frame}`, {
        StudyInstanceUID: '1.2.3.4',
        SeriesInstanceUID: '1.2.3.4.1',
        SOPInstanceUID: '1.2.3.4.5',
        frameNumber: frame,
      });
    }
  });

  it('keeps the wadouri imageId on the dataset without making it serializable', () => {
    const dataset = makeDataset({
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      Modality: 'SEG',
      PixelData: new Uint8Array(4).buffer,
    });

    registerNaturalizedDatasetForLocalWadouri(dataset);

    expect(dataset.url).toBe('dicomfile:0');
    expect(Object.getOwnPropertyDescriptor(dataset, 'url').enumerable).toBe(false);
  });

  it('releases the retained Blob and cached dataset on releaseLocalWadouriRegistrations', () => {
    const dataset = makeDataset({
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.66.4',
      Modality: 'SEG',
      PixelData: new Uint8Array(4).buffer,
    });
    dicomImageLoader.wadouri.fileManager.add.mockReturnValueOnce('dicomfile:7');
    // Simulate a parsed dataset held with a refcount of 2 (e.g. two frame loads).
    dicomImageLoader.wadouri.dataSetCacheManager.isLoaded
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);

    registerNaturalizedDatasetForLocalWadouri(dataset);
    releaseLocalWadouriRegistrations();

    expect(dicomImageLoader.wadouri.fileManager.remove).toHaveBeenCalledWith(7);
    expect(dicomImageLoader.wadouri.dataSetCacheManager.unload).toHaveBeenCalledTimes(2);
    expect(dicomImageLoader.wadouri.dataSetCacheManager.unload).toHaveBeenCalledWith('7');

    // Idempotent: the tracking set was drained.
    dicomImageLoader.wadouri.fileManager.remove.mockClear();
    releaseLocalWadouriRegistrations();
    expect(dicomImageLoader.wadouri.fileManager.remove).not.toHaveBeenCalled();
  });
});
