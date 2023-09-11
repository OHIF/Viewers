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

const { downloadDICOMData } = helpers;

const commandsModule = ({
  servicesManager,
  extensionManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  const {
    cornerstoneViewportService,
    uiNotificationService,
    viewportGridService,
    segmentationService,
    uiDialogService,
    displaySetService,
    hangingProtocolService,
  } = (servicesManager as ServicesManager).services;

  const actions = {
    /**
     * It hydrates a segmentation display set on a target viewport. During such
     * hydration, it also checks if there is any other viewport that require
     * to be updated (is in the same FOR as the target viewport and is displaying)
     *
     * @param viewportId is the target viewport to hydrate the segmentation
     * @param displaySet is the display set to hydrate (it can be a labelmap or RTSTRUCT)
     */
    hydrateSegmentationForViewport: async ({
      viewportId: targetViewportId,
      displaySet: segDisplaySet,
    }: {
      viewportId: string;
      displaySet?: any;
    }) => {
      const { viewports, activeViewportId } = viewportGridService.getState();
      const activeViewport = viewports.get(activeViewportId);

      if (!activeViewport) {
        return;
      }

      const { displaySetInstanceUIDs } = activeViewport;

      // Validate the active viewport for segmentation
      if (displaySetInstanceUIDs.length > 1) {
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Segmentation is not supported for multiple display sets yet',
          type: 'error',
        });
        return;
      }

      const referenceDisplaySetInstanceUID =
        segDisplaySet?.referencedDisplaySetInstanceUID || displaySetInstanceUIDs[0];
      const referencedDisplaySet = displaySetService.getDisplaySetByUID(
        referenceDisplaySetInstanceUID
      );
      const segmentationFrameOfReferenceUID = referencedDisplaySet.instances[0].FrameOfReferenceUID;

      const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
        targetViewportId,
        referenceDisplaySetInstanceUID
      );

      viewports.forEach((viewport, viewportId) => {
        if (targetViewportId === viewportId) {
          return;
        }
        const shouldDisplaySeg = segmentationService.shouldRenderSegmentation(
          viewport.displaySetInstanceUIDs,
          segmentationFrameOfReferenceUID
        );
        if (shouldDisplaySeg) {
          updatedViewports.push({
            viewportId,
            displaySetInstanceUIDs: viewport.displaySetInstanceUIDs,
            viewportOptions: {
              viewportType: 'volume',
              needsRerendering: true,
            },
          });
        }
      });

      // create Segmentation callback which needs to be waited until
      // the volume is created (if coming from stack)
      const createSegmentationForVolume = async () => {
        debugger;
        let segmentationId;
        if (!segDisplaySet) {
          const currentSegmentations = segmentationService.getSegmentations();
          segmentationId = await segmentationService.createSegmentationForDisplaySet(
            referenceDisplaySetInstanceUID,
            { label: `Segmentation ${currentSegmentations.length + 1}` }
          );

          await segmentationService.addSegmentationRepresentationToToolGroup(
            activeViewport.viewportOptions.toolGroupId,
            segmentationId
          );

          // Todo: handle other toolGroups than default
          segmentationService.addSegment(segmentationId, {
            properties: {
              label: 'Segment 1',
            },
          });
        } else {
          const suppressEvents = false;
          const serviceFunction =
            segDisplaySet.Modality === 'SEG'
              ? 'createSegmentationForSEGDisplaySet'
              : 'createSegmentationForRTDisplaySet';

          const load = segmentationService[serviceFunction].bind(segmentationService);

          segmentationId = await load(segDisplaySet, segmentationId, suppressEvents);
        }

        segmentationService.hydrateSegmentation(segmentationId);
      };

      // volume already exists so we can create the segmentation already
      let volumeExists = false;
      cache._volumeCache.forEach((volume, volumeId) => {
        if (volumeId.includes(referenceDisplaySetInstanceUID)) {
          volumeExists = true;
        }
      });

      if (volumeExists) {
        await createSegmentationForVolume();
      }

      // Update the viewports with volume type
      updatedViewports.forEach(async viewport => {
        viewport.viewportOptions = {
          ...viewport.viewportOptions,
          viewportType: 'volume',
          needsRerendering: true,
        };

        const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewport.viewportId);

        const isActiveViewport = viewport.viewportId === activeViewportId;

        // Keeping the camera
        const prevCamera = csViewport.getCamera();

        if (!volumeExists) {
          await createSegmentationForVolume();
        }

        // Callback function
        csViewport.element.addEventListener(Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME, async () => {
          // IMPORTANT: REGRAB the viewport since it has changed from stack to volume
          const volumeViewport = cornerstoneViewportService.getCornerstoneViewport(
            viewport.viewportId
          );
          volumeViewport.setCamera(prevCamera);

          if (isActiveViewport) {
            await createSegmentationForVolume();
          }

          csViewport.element.removeEventListener(Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME, this);
        });
      });

      viewportGridService.setDisplaySetsForViewports(updatedViewports);

      return true;
    },

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

      // if more than one, show notification that this is not supported
      if (displaySetInstanceUIDs.length > 1) {
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Segmentation is not supported for multiple display sets yet',
          type: 'error',
        });
        return;
      }

      const displaySetInstanceUID = displaySetInstanceUIDs[0];

      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      console.debug('🚀 ~ displaySet:', displaySet);

      if (!displaySet.isReconstructable) {
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Segmentation is not supported for non-reconstructible displaysets yet',
          type: 'error',
        });
        return;
      }

      actions.hydrateSegmentationForViewport({
        viewportId: activeViewportId,
      });
    },
    generateSegmentation: ({ segmentationId, options = {} }) => {
      const segmentation = cornerstoneToolsSegmentation.state.getSegmentation(segmentationId);

      const { referencedVolumeId } = segmentation.representationData.LABELMAP;

      const segmentationVolume = cache.getVolume(segmentationId);
      const referencedVolume = cache.getVolume(referencedVolumeId);
      const referencedImages = referencedVolume.getCornerstoneImages();

      const labelmapObj = generateLabelMaps2DFrom3D(segmentationVolume);

      // Generate fake metadata as an example
      labelmapObj.metadata = [];

      const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
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
      const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
      const generatedSegmentation = actions.generateSegmentation({
        segmentationId,
      });

      downloadDICOMData(generatedSegmentation.dataset, `${segmentationInOHIF.label}`);
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
    hydrateSegmentationForViewport: {
      commandFn: actions.hydrateSegmentationForViewport,
    },
  };

  return {
    actions,
    definitions,
  };
};

export default commandsModule;
