jest.mock('./getDisplaySetMessages', () => jest.fn(() => ({ addMessage: jest.fn() })));
jest.mock('./getDisplaySetsFromUnsupportedSeries', () => jest.fn());

import getSopClassHandlerModule from './getSopClassHandlerModule';

const makeInstance = () => ({
  imageId: 'dicomfile:blob://local-multiframe',
  url: 'dicomfile:blob://local-multiframe',
  NumberOfFrames: 4,
  Rows: 2,
  Columns: 2,
  PixelSpacing: [1, 1],
  SliceThickness: 1,
  ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
  ImagePositionPatient: [0, 0, 0],
  FrameOfReferenceUID: 'frame-of-reference',
  StudyInstanceUID: 'study',
  SeriesInstanceUID: 'series',
  SOPInstanceUID: 'sop',
  SOPClassUID: '1.2.840.10008.5.1.4.1.1.2.1',
  Modality: 'CT',
  SeriesDescription: 'Local multiframe CT',
  SeriesNumber: 1,
});

describe('getSopClassHandlerModule', () => {
  it('checks dynamic volume grouping with generated multiframe imageIds', () => {
    const frameImageIds = [
      'dicomfile:blob://local-multiframe&frame=1',
      'dicomfile:blob://local-multiframe&frame=2',
      'dicomfile:blob://local-multiframe&frame=3',
      'dicomfile:blob://local-multiframe&frame=4',
    ];
    const getDynamicVolumeInfo = jest.fn(() => ({
      isDynamicVolume: false,
      timePoints: [frameImageIds],
      splittingTag: null,
    }));
    const dataSource = {
      getImageIdsForDisplaySet: jest.fn(() => frameImageIds),
      retrieve: {
        getGetThumbnailSrc: jest.fn(),
      },
    };
    const customizationService = {
      getCustomization: jest.fn(() => ({
        sortFunctions: {},
        defaultSortFunctionName: 'default',
      })),
    };
    const appContext = {
      appConfig: {},
      extensionManager: {
        getActiveDataSource: jest.fn(() => [dataSource]),
        getModuleEntry: jest.fn(() => ({
          exports: {
            getDynamicVolumeInfo,
          },
        })),
      },
      servicesManager: {
        services: {
          customizationService,
        },
      },
    };

    const stackHandler = getSopClassHandlerModule(appContext)[0];

    stackHandler.getDisplaySetsFromSeries([makeInstance()]);

    expect(getDynamicVolumeInfo).toHaveBeenCalledWith(frameImageIds);
  });
});
