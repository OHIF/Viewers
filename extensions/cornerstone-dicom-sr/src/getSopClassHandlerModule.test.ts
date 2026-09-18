const mockGetUIDsFromImageID = jest.fn();
const mockAddSRAnnotation = jest.fn();

jest.mock('@ohif/core', () => ({
  utils: {
    sopClassDictionary: {
      BasicTextSR: 'basic-text-sr',
      EnhancedSR: 'enhanced-sr',
      ComprehensiveSR: 'comprehensive-sr',
      Comprehensive3DSR: 'comprehensive-3d-sr',
    },
  },
  classes: {
    MetadataProvider: {
      getUIDsFromImageID: (...args: unknown[]) => mockGetUIDsFromImageID(...args),
    },
  },
  Types: {},
}));

jest.mock('@ohif/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

jest.mock('@cornerstonejs/adapters', () => ({
  adaptersSR: {
    Cornerstone3D: { TEXT_ANNOTATION_POSITION: {}, COMMENT_CODE: {}, CodeScheme: {} },
  },
}));

jest.mock('./utils/addSRAnnotation', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockAddSRAnnotation(...args),
}));

jest.mock('./utils/isRehydratable', () => ({ __esModule: true, default: jest.fn() }));

import { _checkIfCanAddMeasurementsToDisplaySet } from './getSopClassHandlerModule';

const servicesManager = {
  services: { customizationService: { getCustomization: () => undefined } },
};

const srWithOneMeasurementOn = (SOPInstanceUID: string) => ({
  SOPClassUID: 'comprehensive-sr',
  measurements: [
    {
      loaded: false,
      coords: [{ ReferencedSOPSequence: { ReferencedSOPInstanceUID: SOPInstanceUID } }],
    },
  ],
});

describe('_checkIfCanAddMeasurementsToDisplaySet', () => {
  beforeEach(() => {
    mockGetUIDsFromImageID.mockReset();
    mockAddSRAnnotation.mockReset();
  });

  // Loading an SR after a segmentation was opened ended the session: the hydrated
  // segmentation's display set carries labelmap `derived:` image ids, which resolve
  // to no UIDs.
  it('leaves the display set of a hydrated segmentation alone', () => {
    const srDisplaySet = srWithOneMeasurementOn('sop-1');
    const segDisplaySet = {
      displaySetInstanceUID: 'seg',
      Modality: 'SEG',
      isDerivedDisplaySet: true,
      images: [{ imageId: 'derived:labelmap-1' }],
    };
    const dataSource = { getImageIdsForDisplaySet: jest.fn(() => ['derived:labelmap-1']) };
    mockGetUIDsFromImageID.mockReturnValue(undefined);

    expect(() =>
      _checkIfCanAddMeasurementsToDisplaySet(
        srDisplaySet as never,
        segDisplaySet as never,
        dataSource,
        servicesManager as never
      )
    ).not.toThrow();

    expect(dataSource.getImageIdsForDisplaySet).not.toHaveBeenCalled();
    expect(srDisplaySet.measurements[0].loaded).toBe(false);
  });

  it('still places a measurement on the source image it references', () => {
    const srDisplaySet = srWithOneMeasurementOn('sop-1');
    const sourceDisplaySet = { displaySetInstanceUID: 'nm', Modality: 'NM' };
    const imageId = 'wadors:https://host/studies/st/series/se/instances/sop-1/frames/1';
    const dataSource = { getImageIdsForDisplaySet: jest.fn(() => [imageId]) };
    mockGetUIDsFromImageID.mockReturnValue({ SOPInstanceUID: 'sop-1', frameNumber: '1' });

    _checkIfCanAddMeasurementsToDisplaySet(
      srDisplaySet as never,
      sourceDisplaySet as never,
      dataSource,
      servicesManager as never
    );

    expect(mockAddSRAnnotation).toHaveBeenCalledWith(
      expect.objectContaining({ imageId, displaySet: sourceDisplaySet })
    );
    expect(srDisplaySet.measurements[0]).toMatchObject({
      loaded: true,
      imageId,
      displaySetInstanceUID: 'nm',
    });
  });
});
