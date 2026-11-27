import { createElement } from 'react';
import { act, render } from '@testing-library/react';
import PanelStudyBrowser from './PanelStudyBrowser';

const mockStudyBrowser = jest.fn(() => null);
const mockUseViewportGrid = jest.fn();
const mockUseSystem = jest.fn();

jest.mock('@ohif/ui-next', () => ({
  useImageViewer: () => ({ StudyInstanceUIDs: ['study-1'] }),
  useViewportGrid: () => mockUseViewportGrid(),
  StudyBrowser: props => {
    mockStudyBrowser(props);
    return null;
  },
  Separator: () => null,
}));

jest.mock('@ohif/core', () => ({
  useSystem: () => mockUseSystem(),
  utils: {
    sortStudyInstances: () => {},
    formatDate: value => value || '',
    formatTime: value => value || '',
    createStudyBrowserTabs: (studyUIDs, studyDisplayList, displaySets) => [
      {
        name: 'all',
        studies: studyDisplayList.map(study => ({
          ...study,
          displaySets,
        })),
      },
    ],
  },
}));

jest.mock('@ohif/core/src/utils/thumbnailNoImageModalities', () => ({
  thumbnailNoImageModalities: ['SR', 'SEG'],
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('./PanelStudyBrowserHeader', () => ({
  PanelStudyBrowserHeader: () => null,
}));

jest.mock('../../Components/MoreDropdownMenu', () => ({
  __esModule: true,
  default: () => () => null,
}));

describe('PanelStudyBrowser', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockStudyBrowser.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stores loaded thumbnail URLs in thumbnailImageSrcMap on initial thumbnail load', async () => {
    const displaySet: Record<string, any> = {
      displaySetInstanceUID: 'ds-1',
      StudyInstanceUID: 'study-1',
      SeriesDescription: 'Axial CT',
      SeriesNumber: 1,
      SeriesDate: '20260817',
      Modality: 'CT',
      instances: [{}],
    };

    const displaySetService = {
      EVENTS: {
        DISPLAY_SETS_ADDED: 'event::displaySetsAdded',
        DISPLAY_SETS_CHANGED: 'event::displaySetsChanged',
        DISPLAY_SET_SERIES_METADATA_INVALIDATED: 'event::invalidated',
      },
      activeDisplaySets: [displaySet],
      getActiveDisplaySets: () => [displaySet],
      getDisplaySetByUID: uid => (uid === 'ds-1' ? displaySet : undefined),
      subscribe: () => ({ unsubscribe: jest.fn() }),
    };

    const customizationService = {
      getCustomization: key => {
        if (key === 'studyBrowser.viewPresets') {
          return [{ id: 'thumbnails', iconName: 'GroupLayers', selected: true }];
        }
        return undefined;
      },
    };

    mockUseSystem.mockReturnValue({
      servicesManager: {
        services: {
          displaySetService,
          customizationService,
        },
      },
      commandsManager: {},
      extensionManager: { appConfig: {} },
    });

    mockUseViewportGrid.mockReturnValue([
      {
        activeViewportId: 'empty-vp-1',
        viewports: new Map([
          ['empty-vp-1', { viewportId: 'empty-vp-1', displaySetInstanceUIDs: [] }],
        ]),
        isHangingProtocolLayout: true,
      },
    ]);

    const observedMaps: Record<string, string | undefined>[] = [];
    const customMapDisplaySets = (displaySets, _loadingState, thumbnailImageSrcMap) => {
      observedMaps.push({ ...thumbnailImageSrcMap });
      return displaySets.map(ds => ({
        displaySetInstanceUID: ds.displaySetInstanceUID,
        StudyInstanceUID: ds.StudyInstanceUID,
        description: ds.SeriesDescription,
        seriesNumber: ds.SeriesNumber,
        modality: ds.Modality,
        numInstances: 1,
        componentType: 'thumbnail',
        imageSrc: thumbnailImageSrcMap[ds.displaySetInstanceUID],
      }));
    };

    const getImageSrc = jest.fn().mockResolvedValue('data:image/png;base64,thumb');
    const dataSource = {
      query: {
        studies: {
          search: jest.fn().mockResolvedValue([
            {
              studyInstanceUid: 'study-1',
              date: '20260817',
              description: 'Chest CT',
              modalities: 'CT',
              instances: 1,
            },
          ]),
        },
      },
      getImageIdsForDisplaySet: () => ['image-1'],
    };

    render(
      createElement(PanelStudyBrowser, {
        getImageSrc,
        getStudiesForPatientByMRN: async studies => studies,
        requestDisplaySetCreationForStudy: jest.fn(),
        dataSource,
        customMapDisplaySets,
        onClickUntrack: jest.fn(),
      })
    );

    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getImageSrc).toHaveBeenCalledWith('image-1');
    const lastMap = observedMaps[observedMaps.length - 1];
    expect(lastMap['ds-1']).toBe('data:image/png;base64,thumb');
  });
});
