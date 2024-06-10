import dcmjs from 'dcmjs';
import { createReportDialogPrompt } from '@ohif/extension-default';
import { Types } from '@ohif/core';
import { cache, metaData } from '@cornerstonejs/core';
import {
  segmentation as cornerstoneToolsSegmentation,
  Enums as cornerstoneToolsEnums,
  utilities,
} from '@cornerstonejs/tools';
import { adaptersRT, helpers, adaptersSEG } from '@cornerstonejs/adapters';
import { classes, DicomMetadataStore } from '@ohif/core';

import vtkImageMarchingSquares from '@kitware/vtk.js/Filters/General/ImageMarchingSquares';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';

import {
  updateViewportsForSegmentationRendering,
  getUpdatedViewportsForSegmentation,
  getTargetViewport,
} from './utils/hydrationUtils';
const { segmentation: segmentationUtils } = utilities;

const { datasetToBlob } = dcmjs.data;

const {
  Cornerstone3D: {
    Segmentation: { generateLabelMaps2DFrom3D, generateSegmentation },
  },
} = adaptersSEG;

const {
  Cornerstone3D: {
    RTSS: { generateRTSSFromSegmentations },
  },
} = adaptersRT;

const { downloadDICOMData } = helpers;

const commandsModule = ({
  servicesManager,
  extensionManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  const {
    uiNotificationService,
    segmentationService,
    uiDialogService,
    displaySetService,
    viewportGridService,
    toolGroupService,
    cornerstoneViewportService,
  } = servicesManager.services;

  const actions = {
    /**
     * Retrieves a list of viewports that require updates in preparation for segmentation rendering.
     * This function evaluates viewports based on their compatibility with the provided segmentation's
     * frame of reference UID and appends them to the updated list if they should render the segmentation.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.viewportId - the ID of the viewport to be updated.
     * @param params.servicesManager - The services manager
     * @param params.referencedDisplaySetInstanceUID - Optional UID for the referenced display set instance.
     *
     * @returns {Array} Returns an array of viewports that require updates for segmentation rendering.
     */
    getUpdatedViewportsForSegmentation,
    /**
     * Creates an empty segmentation for a specified viewport.
     * It first checks if the display set associated with the viewport is reconstructable.
     * If not, it raises a notification error. Otherwise, it creates a new segmentation
     * for the display set after handling the necessary steps for making the viewport
     * a volume viewport first
     *
     * @param {Object} params - Parameters for the function.
     * @param params.viewportId - the target viewport ID.
     *
     */
    createEmptySegmentationForViewport: async ({ viewportId }) => {
      const viewport = getTargetViewport({ viewportId, viewportGridService });
      // Todo: add support for multiple display sets
      const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];

      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

      if (!displaySet.isReconstructable) {
        uiNotificationService.show({
          title: 'Segmentation',
          message: 'Segmentation is not supported for non-reconstructible displaysets yet',
          type: 'error',
        });
        return;
      }

      updateViewportsForSegmentationRendering({
        viewportId,
        servicesManager,
        displaySet,
        loadFn: async () => {
          const currentSegmentations = segmentationService.getSegmentations();
          const segmentationId = await segmentationService.createSegmentationForDisplaySet(
            displaySetInstanceUID,
            { label: `Segmentation ${currentSegmentations.length + 1}` }
          );

          const toolGroupId = viewport.viewportOptions.toolGroupId;

          await segmentationService.addSegmentationRepresentationToToolGroup(
            toolGroupId,
            segmentationId
          );

          // Add only one segment for now
          segmentationService.addSegment(segmentationId, {
            toolGroupId,
            segmentIndex: 1,
            properties: {
              label: 'Segment 1',
            },
          });

          return segmentationId;
        },
      });
    },
    /**
     * Loads segmentations for a specified viewport.
     * The function prepares the viewport for rendering, then loads the segmentation details.
     * Additionally, if the segmentation has scalar data, it is set for the corresponding label map volume.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentations - Array of segmentations to be loaded.
     * @param params.viewportId - the target viewport ID.
     *
     */
    loadSegmentationsForViewport: async ({ segmentations, viewportId }) => {
      updateViewportsForSegmentationRendering({
        viewportId,
        servicesManager,
        loadFn: async () => {
          // Todo: handle adding more than one segmentation
          const viewport = getTargetViewport({ viewportId, viewportGridService });
          const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];

          const segmentation = segmentations[0];
          const segmentationId = segmentation.id;
          const label = segmentation.label;
          const segments = segmentation.segments;

          delete segmentation.segments;

          await segmentationService.createSegmentationForDisplaySet(displaySetInstanceUID, {
            segmentationId,
            label,
          });

          if (segmentation.scalarData) {
            const labelmapVolume = segmentationService.getLabelmapVolume(segmentationId);
            labelmapVolume.scalarData.set(segmentation.scalarData);
          }

          segmentationService.addOrUpdateSegmentation(segmentation);

          const toolGroupId = viewport.viewportOptions.toolGroupId;
          await segmentationService.addSegmentationRepresentationToToolGroup(
            toolGroupId,
            segmentationId
          );

          segments.forEach(segment => {
            if (segment === null) {
              return;
            }
            segmentationService.addSegment(segmentationId, {
              segmentIndex: segment.segmentIndex,
              toolGroupId,
              properties: {
                color: segment.color,
                label: segment.label,
                opacity: segment.opacity,
                isLocked: segment.isLocked,
                visibility: segment.isVisible,
                active: segmentation.activeSegmentIndex === segment.segmentIndex,
              },
            });
          });

          if (segmentation.centroidsIJK) {
            segmentationService.setCentroids(segmentation.id, segmentation.centroidsIJK);
          }

          return segmentationId;
        },
      });
    },
    /**
     * Loads segmentation display sets for a specified viewport.
     * Depending on the modality of the display set (SEG or RTSTRUCT),
     * it chooses the appropriate service function to create
     * the segmentation for the display set.
     * The function then prepares the viewport for rendering segmentation.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.viewportId - ID of the viewport where the segmentation display sets should be loaded.
     * @param params.displaySets - Array of display sets to be loaded for segmentation.
     *
     */
    loadSegmentationDisplaySetsForViewport: async ({ viewportId, displaySets }) => {
      // Todo: handle adding more than one segmentation
      const displaySet = displaySets[0];
      const referencedDisplaySet = displaySetService.getDisplaySetByUID(
        displaySet.referencedDisplaySetInstanceUID
      );
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      const initialSliceIndex = viewport.getSliceIndex();

      updateViewportsForSegmentationRendering({
        viewportId,
        servicesManager,
        displaySet,
        loadFn: async () => {
          const segDisplaySet = displaySet;
          const suppressEvents = false;
          const serviceFunction =
            segDisplaySet.Modality === 'SEG'
              ? 'createSegmentationForSEGDisplaySet'
              : 'createSegmentationForRTDisplaySet';

          const boundFn = segmentationService[serviceFunction].bind(segmentationService);
          const segmentationId = await boundFn(segDisplaySet, null, suppressEvents);
          const segmentation = segmentationService.getSegmentation(segmentationId);
          segmentation.description = `S${referencedDisplaySet.SeriesNumber}: ${referencedDisplaySet.SeriesDescription}`;
          return segmentationId;
        },
        initialSliceIndex,
      });
    },
    /**
     * Generates a segmentation from a given segmentation ID.
     * This function retrieves the associated segmentation and
     * its referenced volume, extracts label maps from the
     * segmentation volume, and produces segmentation data
     * alongside associated metadata.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentationId - ID of the segmentation to be generated.
     * @param params.options - Optional configuration for the generation process.
     *
     * @returns Returns the generated segmentation data.
     */
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
      segmentationInOHIF.segments.forEach(segment => {
        // segmentation service already has a color for each segment
        if (!segment) {
          return;
        }
        const segmentIndex = segment.segmentIndex;
        const { label, color } = segment;

        const RecommendedDisplayCIELabValue = dcmjs.data.Colors.rgb2DICOMLAB(
          color.slice(0, 3).map(value => value / 255)
        ).map(value => Math.round(value));

        const segmentMetadata = {
          SegmentNumber: segmentIndex.toString(),
          SegmentLabel: label,
          SegmentAlgorithmType: segment?.algorithmType || 'MANUAL',
          SegmentAlgorithmName: segment?.algorithmName || 'OHIF Brush',
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
    /**
     * Downloads a segmentation based on the provided segmentation ID.
     * This function retrieves the associated segmentation and
     * uses it to generate the corresponding DICOM dataset, which
     * is then downloaded with an appropriate filename.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentationId - ID of the segmentation to be downloaded.
     *
     */
    downloadSegmentation: ({ segmentationId }) => {
      const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
      const generatedSegmentation = actions.generateSegmentation({
        segmentationId,
      });

      downloadDICOMData(generatedSegmentation.dataset, `${segmentationInOHIF.label}`);
    },
    /**
     * Stores a segmentation based on the provided segmentationId into a specified data source.
     * The SeriesDescription is derived from user input or defaults to the segmentation label,
     * and in its absence, defaults to 'Research Derived Series'.
     *
     * @param {Object} params - Parameters for the function.
     * @param params.segmentationId - ID of the segmentation to be stored.
     * @param params.dataSource - Data source where the generated segmentation will be stored.
     *
     * @returns {Object|void} Returns the naturalized report if successfully stored,
     * otherwise throws an error.
     */
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
      const SeriesDescription = promptResult.value || label || 'Research Derived Series';

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

      // The "Mode" route listens for DicomMetadataStore changes
      // When a new instance is added, it listens and
      // automatically calls makeDisplaySets

      // add the information for where we stored it to the instance as well
      naturalizedReport.wadoRoot = dataSource.getConfig().wadoRoot;

      DicomMetadataStore.addInstances([naturalizedReport], true);

      return naturalizedReport;
    },
    /**
     * Converts segmentations into RTSS for download.
     * This sample function retrieves all segentations and passes to
     * cornerstone tool adapter to convert to DICOM RTSS format. It then
     * converts dataset to downloadable blob.
     *
     */
    downloadRTSS: ({ segmentationId }) => {
      const segmentations = segmentationService.getSegmentation(segmentationId);
      const vtkUtils = {
        vtkImageMarchingSquares,
        vtkDataArray,
        vtkImageData,
      };

      const RTSS = generateRTSSFromSegmentations(
        segmentations,
        classes.MetadataProvider,
        DicomMetadataStore,
        cache,
        cornerstoneToolsEnums,
        vtkUtils
      );

      try {
        const reportBlob = datasetToBlob(RTSS);

        //Create a URL for the binary.
        const objectUrl = URL.createObjectURL(reportBlob);
        window.location.assign(objectUrl);
      } catch (e) {
        console.warn(e);
      }
    },
    setBrushSize: ({ value, toolNames }) => {
      const brushSize = Number(value);

      toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
        if (toolNames?.length === 0) {
          segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize);
        } else {
          toolNames?.forEach(toolName => {
            segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize, toolName);
          });
        }
      });
    },
    setThresholdRange: ({
      value,
      toolNames = ['ThresholdCircularBrush', 'ThresholdSphereBrush'],
    }) => {
      toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
        const toolGroup = toolGroupService.getToolGroup(toolGroupId);
        toolNames?.forEach(toolName => {
          toolGroup.setToolConfiguration(toolName, {
            strategySpecificConfiguration: {
              THRESHOLD: {
                threshold: value,
              },
            },
          });
        });
      });
    },
  };

  const definitions = {
    getUpdatedViewportsForSegmentation: {
      commandFn: actions.getUpdatedViewportsForSegmentation,
    },
    loadSegmentationDisplaySetsForViewport: {
      commandFn: actions.loadSegmentationDisplaySetsForViewport,
    },
    loadSegmentationsForViewport: {
      commandFn: actions.loadSegmentationsForViewport,
    },
    createEmptySegmentationForViewport: {
      commandFn: actions.createEmptySegmentationForViewport,
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
    downloadRTSS: {
      commandFn: actions.downloadRTSS,
    },
    setBrushSize: {
      commandFn: actions.setBrushSize,
    },
    setThresholdRange: {
      commandFn: actions.setThresholdRange,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'SEGMENTATION',
  };
};

export default commandsModule;
