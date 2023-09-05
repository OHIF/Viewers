import dcmjs from 'dcmjs';
import { createReportDialogPrompt } from '@ohif/extension-default';
import { ServicesManager, Types } from '@ohif/core';
import { Enums, cache, metaData } from '@cornerstonejs/core';
import { segmentation as cornerstoneToolsSegmentation } from '@cornerstonejs/tools';
import { adaptersSEG, helpers } from '@cornerstonejs/adapters';

const {
  Cornerstone3D: {
    Segmentation: { generateLabelMaps2DFrom3D, generateSegmentation },
  },
} = adaptersSEG;

const { downloadDicomData } = helpers;

const commandsModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  const {
    customizationService,
    measurementService,
    hangingProtocolService,
    cornerstoneViewportService,
    uiNotificationService,
    viewportGridService,
    segmentationService,
    displaySetService,
    stateSyncService,
    toolbarService,
    uiDialogService,
  } = (servicesManager as ServicesManager).services;

  const actions = {
    /**
     * Show the context menu.
     * @param options.menuId defines the menu name to lookup, from customizationService
     * @param options.defaultMenu contains the default menu set to use
     * @param options.element is the element to show the menu within
     * @param options.event is the event that caused the context menu
     * @param options.selectorProps is the set of selection properties to use
     */
    addSegmentationForActiveViewport: () => {
      const { viewports, activeViewportId } = viewportGridService.getState();
      const activeViewport = viewports.get(activeViewportId);

      if (!activeViewport) {
        return;
      }

      const { displaySetInstanceUIDs } = activeViewport;

      // if more than one show notification that this is not supported
      if (displaySetInstanceUIDs.length > 1) {
        uiNotificationService.show({
          title: 'Segmentation',
          message:
            'Segmentation is not supported for multiple display sets yet',
          type: 'error',
        });
        return;
      }

      const displaySetInstanceUID = displaySetInstanceUIDs[0];

      // identify if the viewport is a stack viewport then we need to convert
      // the viewport to a volume viewport first and mount on the same element
      // otherwise we are good

      const { viewportOptions } = activeViewport;
      const csViewport = cornerstoneViewportService.getCornerstoneViewport(
        viewportOptions.viewportId
      );

      const prevCamera = csViewport.getCamera();

      if (viewportOptions.viewportType === 'stack') {
        // Todo: handle finding out other viewports in the grid
        // that require to change to volume viewport

        // Todo: add current imageIdIndex to the viewportOptions
        // so that we can restore it after changing to volume viewport
        viewportGridService.setDisplaySetsForViewports([
          {
            viewportId: activeViewportId,
            displaySetInstanceUIDs: [displaySetInstanceUID],
            viewportOptions: {
              viewportType: 'volume',
            },
          },
        ]);
      }

      csViewport.element.addEventListener(
        Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
        async () => {
          const activeViewport = viewports.get(activeViewportId);

          const volumeViewport =
            cornerstoneViewportService.getCornerstoneViewport(
              activeViewport?.viewportOptions?.viewportId
            );

          volumeViewport.setCamera(prevCamera);

          const segmentationId =
            await segmentationService.createSegmentationForDisplaySet(
              displaySetInstanceUID,
              { label: 'New Segmentation' }
            );

          await segmentationService.addSegmentationRepresentationToToolGroup(
            activeViewport.viewportOptions.toolGroupId,
            segmentationId,
            true // hydrateSegmentation,
          );

          // Todo: handle other toolgroups than default
          segmentationService.addSegment(segmentationId, {
            properties: {
              label: 'Segment 1',
            },
          });
        }
      );
    },
    generateSegmentation: ({ segmentationId, options = {} }) => {
      const segmentation =
        cornerstoneToolsSegmentation.state.getSegmentation(segmentationId);

      const { referencedVolumeId } = segmentation.representationData.LABELMAP;

      const segmentationVolume = cache.getVolume(segmentationId);
      const referencedVolume = cache.getVolume(referencedVolumeId);
      const referencedImages = referencedVolume.getCornerstoneImages();

      const labelmapObj = generateLabelMaps2DFrom3D(segmentationVolume);

      // Generate fake metadata as an example
      labelmapObj.metadata = [];

      const segmentationInOHIF =
        segmentationService.getSegmentation(segmentationId);
      labelmapObj.segmentsOnLabelmap.forEach(segmentIndex => {
        // segmentation service already has a color for each segment
        const segment = segmentationInOHIF?.segments[segmentIndex];
        const { label, color } = segment;

        const RecommendedDisplayCIELabValue = dcmjs.data.Colors.rgb2DICOMLAB(
          color.slice(0, 3).map(value => value / 255)
        ).map(value => Math.round(value));

        const segmentMetadata = {
          SegmentNumber: segmentIndex.toString(),
          SegmentLabel: label,
          SegmentAlgorithmType: 'MANUAL',
          SegmentAlgorithmName: 'OHIF Brush',
          RecommendedDisplayCIELabValue,
          SegmentedPropertyCategoryCodeSequence: {
            CodeValue: 'T-D0050',
            CodingSchemeDesignator: 'SRT',
            CodeMeaning: 'Tissue',
          },
          SegmentedPropertyTypeCodeSequence: {
            CodeValue: 'T-D0050',
            CodingSchemeDesignator: 'SRT',
            CodeMeaning: 'Tissue',
          },
        };
        labelmapObj.metadata[segmentIndex] = segmentMetadata;
      });

      const generatedSegmentation = generateSegmentation(
        referencedImages,
        labelmapObj,
        metaData,
        options
      );

      return generatedSegmentation;
    },
    downloadSegmentation: ({ segmentationId }) => {
      const segmentationInOHIF =
        segmentationService.getSegmentation(segmentationId);
      const generatedSegmentation = actions.generateSegmentation({
        segmentationId,
      });

      downloadDicomData(
        generatedSegmentation.dataset,
        `${segmentationInOHIF.label}`
      );
    },
    storeSegmentation: async ({ segmentationId, dataSource }) => {
      const promptResult = await createReportDialogPrompt(uiDialogService, {
        extensionManager,
      });

      if (promptResult.action !== 1 && promptResult.value) {
        return;
      }

      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation) {
        throw new Error('No segmentation found');
      }

      const { label } = segmentation;
      const SeriesDescription =
        promptResult.value !== undefined && promptResult.value !== ''
          ? promptResult.value
          : label !== undefined && label !== ''
          ? label
          : 'Research Derived Series';

      const generatedData = actions.generateSegmentation({
        segmentationId,
        options: {
          SeriesDescription,
        },
      });

      if (!generatedData || !generatedData.dataset) {
        throw new Error('Error during segmentation generation');
      }

      const { dataset: naturalizedReport } = generatedData;

      await dataSource.store.dicom(naturalizedReport);

      return naturalizedReport;
    },

    /** Close a context menu currently displayed */
  };

  const definitions = {
    addSegmentationForActiveViewport: {
      commandFn: actions.addSegmentationForActiveViewport,
    },
    generateSegmentation: {
      commandFn: actions.generateSegmentation,
    },
    downloadSegmentation: {
      commandFn: actions.downloadSegmentation,
    },
    storeSegmentation: {
      commandFn: actions.storeSegmentation,
    },
  };

  return {
    actions,
    definitions,
  };
};

export default commandsModule;
