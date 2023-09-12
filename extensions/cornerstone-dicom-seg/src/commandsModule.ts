import dcmjs from 'dcmjs';
import { createReportDialogPrompt } from '@ohif/extension-default';
import { ServicesManager, Types } from '@ohif/core';
import { Enums, cache, metaData } from '@cornerstonejs/core';
import { segmentation as cornerstoneToolsSegmentation } from '@cornerstonejs/tools';
import { adaptersSEG, helpers } from '@cornerstonejs/adapters';
import {
  hydrateUsingEmptySegmentation,
  hydrateUsingDisplaySets,
  hydrateUsingSegmentations,
} from './utils/hydrationUtils';

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
     * It checks if there is any other viewport that require to be updated
     * (is in the same FOR as the target viewport and is displaying) since
     * the segmentation is being hydrated and we only have support for volume
     * viewports to display segmentations.
     *
     * @param segmentationDisplaySet - the segmentation display set to hydrate
     * @param viewportId - the target viewport to hydrate the segmentation
     * @returns an array of viewports that require to be updated
     */
    getUpdatedViewportsForSegmentation: ({
      segmentationDisplaySet,
      viewportId,
    }: {
      segmentationDisplaySet: any;
      viewportId?: string;
    }) => {
      const { viewports, activeViewportId } = viewportGridService.getState();
      const targetViewportId = viewportId || activeViewportId;

      const displaySetInstanceUIDs = viewports.get(targetViewportId).displaySetInstanceUIDs;

      const referenceDisplaySetInstanceUID =
        segmentationDisplaySet?.referencedDisplaySetInstanceUID || displaySetInstanceUIDs[0];

      const referencedDisplaySet = displaySetService.getDisplaySetByUID(
        referenceDisplaySetInstanceUID
      );
      const segmentationFrameOfReferenceUID = referencedDisplaySet.instances[0].FrameOfReferenceUID;

      const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
        targetViewportId,
        referenceDisplaySetInstanceUID
      );

      viewports.forEach((viewport, viewportId) => {
        if (
          targetViewportId === viewportId ||
          updatedViewports.find(v => v.viewportId === viewportId)
        ) {
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
      return updatedViewports;
    },
    /**
     * It hydrates a segmentation display set on a target viewport. During such
     * hydration, it also checks if there is any other viewport that require
     * to be updated (is in the same FOR as the target viewport and is displaying)
     *
     * If no viewportId is provided, it will hydrate the active viewport.
     *
     * This function is capable of hydrating both RTSTRUCT and Labelmaps segmentations.
     *
     * 1) If the displaySets for the segmentations are provided (RTSTRUCT or DICOM SEG)
     *   then it will hydrate the segmentation for the target viewport.
     * 2) If segmentations array of objects is provided, then it will hydrate the segmentations
     *    for the target viewport.
     * 3) if none of the above is provided, then it will create a new segmentation for the target viewport.
     *
     *
     * @param viewportId is the target viewport to hydrate the segmentation
     * @param displaySet is the display set to hydrate (it can be a labelmap or RTSTRUCT)
     * @param segmentations is the list of segmentation objects to be hydrated
     */
    loadSegmentationsForViewport: async ({
      viewportId: targetViewportId,
      displaySets: segDisplaySets,
      segmentations,
    }: {
      viewportId?: string;
      displaySets?: any[];
      segmentations?: any[];
    }) => {
      const { viewports, activeViewportId } = viewportGridService.getState();
      const activeViewport = viewports.get(activeViewportId);

      targetViewportId = targetViewportId || activeViewportId;
      segDisplaySets = segDisplaySets || [];

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

      // Based on the segmentations provided, we might have to update other viewports
      // that are displaying the same frameOfReference to be a volume viewport,
      // so that the segmentation can be displayed (currently we only have support
      // for volume viewports to display segmentations)
      const segDisplaySet = segDisplaySets[0];
      const updatedViewports = actions.getUpdatedViewportsForSegmentation({
        segmentationDisplaySet: segDisplaySet,
        viewportId: targetViewportId,
      });

      const referenceDisplaySetInstanceUID =
        segDisplaySet?.referencedDisplaySetInstanceUID || displaySetInstanceUIDs[0];

      // create Segmentation callback which needs to be waited until
      // the volume is created (if coming from stack)
      const createSegmentationForVolume = async () => {
        let segmentationId;
        if (segDisplaySets[0]) {
          segmentationId = await hydrateUsingDisplaySets({
            segDisplaySet,
            segmentationService,
            segmentationId,
          });
        } else if (segmentations?.length) {
          segmentationId = await hydrateUsingSegmentations({
            segmentations,
            segmentationService,
            displaySetInstanceUID: referenceDisplaySetInstanceUID,
            activeViewport,
          });
        } else {
          segmentationId = await hydrateUsingEmptySegmentation({
            displaySetInstanceUID: referenceDisplaySetInstanceUID,
            activeViewport,
            segmentationService,
          });
        }

        segmentationService.hydrateSegmentation(segmentationId);
      };

      // the reference volume that is used to draw the segmentation. so check if the
      // volume exists in the cache (the target Viewport is already a volume viewport)
      const volumeExists = Array.from(cache._volumeCache.keys()).some(volumeId =>
        volumeId.includes(referenceDisplaySetInstanceUID)
      );

      updatedViewports.forEach(async viewport => {
        viewport.viewportOptions = {
          ...viewport.viewportOptions,
          viewportType: 'volume',
          needsRerendering: true,
        };
        const viewportId = viewport.viewportId;

        const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        const prevCamera = csViewport.getCamera();

        // only run the createSegmentationForVolume for the targetViewportId
        // since the rest will get handled by cornerstoneViewportService
        if (volumeExists && viewportId === targetViewportId) {
          await createSegmentationForVolume();
          return;
        }

        const createNewSegmentationWhenVolumeMounts = async evt => {
          const isTheActiveViewportVolumeMounted = evt.detail.volumeActors?.find(ac =>
            ac.uid.includes(referenceDisplaySetInstanceUID)
          );

          // Note: make sure to re-grab the viewport since it might have changed
          // during the time it took for the volume to be mounted, for instance
          // the stack viewport has been changed to a volume viewport
          const volumeViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
          volumeViewport.setCamera(prevCamera);

          volumeViewport.element.removeEventListener(
            Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
            createNewSegmentationWhenVolumeMounts
          );

          if (!isTheActiveViewportVolumeMounted) {
            // it means it is one of those other updated viewports so just update the camera
            return;
          }

          if (viewportId === targetViewportId) {
            await createSegmentationForVolume();
          }
        };

        csViewport.element.addEventListener(
          Enums.Events.VOLUME_VIEWPORT_NEW_VOLUME,
          createNewSegmentationWhenVolumeMounts
        );
      });

      // Set the displaySets for the viewports that require to be updated
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

      if (!displaySet.isReconstructable) {
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Segmentation is not supported for non-reconstructible displaysets yet',
          type: 'error',
        });
        return;
      }

      actions.loadSegmentationsForViewport({
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
    loadSegmentationsForViewport: {
      commandFn: actions.loadSegmentationsForViewport,
    },
    getUpdatedViewportsForSegmentation: {
      commandFn: actions.getUpdatedViewportsForSegmentation,
    },
  };

  return {
    actions,
    definitions,
  };
};

export default commandsModule;
