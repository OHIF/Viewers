import { TextEncoder, TextDecoder } from 'util';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import OHIF from '@ohif/core';
import { registerNaturalizedDatasetForLocalWadouri } from './registerNaturalizedDatasetForLocalWadouri';

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

  it('does not stamp NumberOfFrames onto a single-frame dataset (SR/RTSTRUCT)', () => {
    const dataset = makeDataset({
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.88.33',
      Modality: 'SR',
    });

    const imageId = registerNaturalizedDatasetForLocalWadouri(dataset);

    // The serialized form of an SR must not gain a (0028,0008) element.
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
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.88.33',
      Modality: 'SR',
    });

    registerNaturalizedDatasetForLocalWadouri(dataset);

    expect(dataset.url).toBe('dicomfile:0');
    expect(Object.getOwnPropertyDescriptor(dataset, 'url').enumerable).toBe(false);
  });
});
