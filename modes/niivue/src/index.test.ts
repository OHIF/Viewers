import mode, { modeInstance, niivue, niivueLayout } from './index';

// Stub @ohif/mode-basic: the mode only spreads its namespaces and callbacks,
// and the real module pulls in Cornerstone. Virtual because its package
// main points at an unbuilt dist/.
jest.mock(
  '@ohif/mode-basic',
  () => ({
    ohif: {
      layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
      sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
      thumbnailList: '@ohif/extension-default.panelModule.seriesList',
    },
    cornerstone: {
      viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
      measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
    },
    dicompdf: {
      sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
      viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
    },
    dicomvideo: {
      sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
    },
    extensionDependencies: { '@ohif/extension-default': '^3.0.0' },
    isValidMode: jest.fn(),
    onModeEnter: jest.fn(),
    onModeExit: jest.fn(),
    layoutTemplate: jest.fn(),
    modeFactory: jest.fn(),
    initToolGroups: jest.fn(),
    NON_IMAGE_MODALITIES: ['SR', 'SEG'],
  }),
  { virtual: true }
);

const stackHandler = '@ohif/extension-default.sopClassHandlerModule.stack';
const videoHandler = '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video';
const pdfHandler = '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf';

const viewportFor = handler =>
  niivueLayout.props.viewports.find(({ displaySetsToDisplay }) =>
    displaySetsToDisplay.includes(handler)
  )?.namespace;

describe('NiiVue mode', () => {
  it('exposes the /niivue route', () => {
    expect(modeInstance.routeName).toBe('niivue');
    expect(modeInstance.routes).toHaveLength(1);
    expect(modeInstance.routes[0].layoutInstance).toBe(niivueLayout);
  });

  it('maps only video to the Cornerstone viewport', () => {
    const cornerstoneViewports = niivueLayout.props.viewports.filter(
      ({ namespace }) => namespace === '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );
    expect(cornerstoneViewports).toHaveLength(1);
    expect(cornerstoneViewports[0].displaySetsToDisplay).toEqual([videoHandler]);
  });

  it('renders image and whole-slide series in NiiVue', () => {
    expect(viewportFor(stackHandler)).toBe(niivue.viewport);
    expect(viewportFor(niivue.wsiSopClassHandler)).toBe(niivue.viewport);
  });

  it('renders PDF in the PDF viewport and video in the Cornerstone viewport', () => {
    expect(viewportFor(pdfHandler)).toBe('@ohif/extension-dicom-pdf.viewportModule.dicom-pdf');
    expect(viewportFor(videoHandler)).toBe(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );
  });

  it('gives every SOP class handler a viewport', () => {
    for (const handler of modeInstance.sopClassHandlers) {
      expect(viewportFor(handler)).toBeDefined();
    }
  });

  it('claims video and whole-slide series before the general stack handler', () => {
    const order = modeInstance.sopClassHandlers;
    expect(order[order.length - 1]).toBe(stackHandler);
    expect(order.indexOf(videoHandler)).toBeLessThan(order.indexOf(stackHandler));
    expect(order.indexOf(niivue.wsiSopClassHandler)).toBeLessThan(order.indexOf(stackHandler));
  });

  it('depends on the nv-ohif extension', () => {
    expect(modeInstance.extensions['@niivue/nv-ohif']).toBeDefined();
    expect(mode.extensionDependencies).toBe(modeInstance.extensions);
  });

  it('uses NiiVue capture/crosshair and the grid-only layout selector', () => {
    const primary = modeInstance.toolbarSections.find(section => 'primary' in section).primary;
    expect(primary).toEqual(
      expect.arrayContaining(['NiivueViews', 'NiivueCapture', 'NiivueCrosshair', 'NiivueLayout'])
    );
    expect(primary).not.toEqual(expect.arrayContaining(['Capture', 'Crosshairs', 'Layout']));

    const layoutButton = modeInstance.toolbarButtons.find(button => button.id === 'NiivueLayout');
    expect(layoutButton.uiType).toBe('ohif.layoutSelector');
  });

  it('hides the MPR / 3D presets from the layout selector', () => {
    const customizations = mode.customizations[modeInstance.modeCustomizations];
    expect(customizations['layoutSelector.advancedPresetGenerator']()).toEqual([]);
  });
});
