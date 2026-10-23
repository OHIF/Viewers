import { configureViewportForLayerRemoval } from './layerConfigurationUtils';

jest.mock(
  '@ohif/extension-cornerstone',
  () => ({ isNextViewport: jest.fn().mockReturnValue(false), NEXT_OVERLAY_OPACITY: 0.3 })
);

describe('configureViewportForLayerRemoval', () => {
  type DisplaySetStub = {
    displaySetInstanceUID?: string;
    isOverlayDisplaySet: boolean;
    referencedDisplaySetInstanceUID?: string;
  };

  const createServicesManager = (displaySets: Record<string, DisplaySetStub>) =>
    ({
      services: {
        cornerstoneViewportService: {
          getCornerstoneViewport: jest.fn().mockReturnValue({ type: 'stack' }),
          getOrientation: jest.fn(),
        },
        displaySetService: {
          getDisplaySetByUID: jest.fn(uid => displaySets[uid]),
        },
      },
    }) as unknown as AppTypes.ServicesManager;

  it('keeps the referenced images when removing the only overlay display set', () => {
    const overlayDisplaySetInstanceUID = 'rtstruct-display-set';
    const referencedDisplaySetInstanceUID = 'pet-display-set';
    const viewport = {
      viewportId: 'default',
      displaySetInstanceUIDs: [overlayDisplaySetInstanceUID],
      displaySetOptions: [{}],
      viewportOptions: { orientation: 'axial', viewportType: 'stack' },
    };
    const displaySets = {
      [overlayDisplaySetInstanceUID]: {
        displaySetInstanceUID: overlayDisplaySetInstanceUID,
        isOverlayDisplaySet: true,
        referencedDisplaySetInstanceUID,
      },
      [referencedDisplaySetInstanceUID]: {
        displaySetInstanceUID: referencedDisplaySetInstanceUID,
        isOverlayDisplaySet: false,
      },
    };
    const servicesManager = createServicesManager(displaySets);

    configureViewportForLayerRemoval({
      viewport,
      displaySetInstanceUID: overlayDisplaySetInstanceUID,
      currentDisplaySetUIDs: [overlayDisplaySetInstanceUID],
      servicesManager,
    });

    expect(viewport.displaySetInstanceUIDs).toEqual([referencedDisplaySetInstanceUID]);
  });

  it('does not duplicate referenced images that are already configured', () => {
    const overlayDisplaySetInstanceUID = 'rtstruct-display-set';
    const referencedDisplaySetInstanceUID = 'pet-display-set';
    const viewport = {
      viewportId: 'default',
      displaySetInstanceUIDs: [referencedDisplaySetInstanceUID, overlayDisplaySetInstanceUID],
      displaySetOptions: [{}, {}],
      viewportOptions: { orientation: 'axial', viewportType: 'stack' },
    };
    const servicesManager = createServicesManager({
      [overlayDisplaySetInstanceUID]: {
        isOverlayDisplaySet: true,
        referencedDisplaySetInstanceUID,
      },
      [referencedDisplaySetInstanceUID]: { isOverlayDisplaySet: false },
    });

    configureViewportForLayerRemoval({
      viewport,
      displaySetInstanceUID: overlayDisplaySetInstanceUID,
      currentDisplaySetUIDs: viewport.displaySetInstanceUIDs,
      servicesManager,
    });

    expect(viewport.displaySetInstanceUIDs).toEqual([referencedDisplaySetInstanceUID]);
  });
});
