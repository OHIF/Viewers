import { utilities as csToolsUtils } from '@cornerstonejs/tools';
import CornerstoneViewportService from './CornerstoneViewportService';

jest.mock('@cornerstonejs/tools', () => {
  const actual = jest.requireActual('@cornerstonejs/tools');
  return {
    ...actual,
    utilities: {
      ...actual.utilities,
      stackContextPrefetch: {
        enable: jest.fn(),
        disable: jest.fn(),
      },
    },
  };
});

const mockStackContextPrefetch = csToolsUtils.stackContextPrefetch as unknown as {
  enable: jest.Mock;
  disable: jest.Mock;
};

describe('CornerstoneViewportService._setOtherViewport', () => {
  let service: CornerstoneViewportService;
  let mountOther: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new CornerstoneViewportService({ services: {} } as never);

    // _setOtherViewport delegates the mount to the lazily-resolved backend;
    // stub it so the test only exercises the service method itself.
    mountOther = jest.fn().mockResolvedValue(undefined);
    (service as unknown as { _backend: unknown })._backend = { mountOther };
  });

  it('disables stack-context prefetch on the viewport element when mounting non-stack (video/WSI) content', async () => {
    const element = document.createElement('div');
    const viewport = { element, setViewReference: jest.fn() };
    const viewportInfo = { getViewReference: () => undefined };
    const viewportData = {
      data: [{ displaySetInstanceUID: 'displaySet1', imageIds: ['wadors:imageId1'] }],
    };

    await service._setOtherViewport(
      viewport as never,
      viewportData as never,
      viewportInfo as never
    );

    // Regression test for OHIF/Viewers#6414: switching a viewport from an
    // image stack to a DICOM video left the stack prefetch listener attached
    // to the element, so wheel scrolling over the video fired extra
    // WADO-RS /frames/N requests.
    expect(mockStackContextPrefetch.disable).toHaveBeenCalledTimes(1);
    expect(mockStackContextPrefetch.disable).toHaveBeenCalledWith(element);

    // The disable must happen before the new content mounts, and must not
    // skip the mount itself.
    expect(mockStackContextPrefetch.disable.mock.invocationCallOrder[0]).toBeLessThan(
      mountOther.mock.invocationCallOrder[0]
    );
    expect(mountOther).toHaveBeenCalledTimes(1);
    expect(mountOther).toHaveBeenCalledWith(viewport, viewportData.data[0]);
  });
});
