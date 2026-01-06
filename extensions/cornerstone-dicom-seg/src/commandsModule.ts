import dcmjs from 'dcmjs';
import { classes, Types, utils } from '@ohif/core';
import { cache, metaData } from '@cornerstonejs/core';
import { segmentation as cornerstoneToolsSegmentation } from '@cornerstonejs/tools';
import { adaptersRT, helpers, adaptersSEG } from '@cornerstonejs/adapters';
import { createReportDialogPrompt, useUIStateStore } from '@ohif/extension-default';
import { DicomMetadataStore } from '@ohif/core';

import PROMPT_RESPONSES from '../../default/src/utils/_shared/PROMPT_RESPONSES';

const getTargetViewport = ({ viewportId, viewportGridService }) => {
  const { viewports, activeViewportId } = viewportGridService.getState();
  const targetViewportId = viewportId || activeViewportId;

  const viewport = viewports.get(targetViewportId);

  return viewport;
};

const {
  Cornerstone3D: {
    Segmentation: { generateSegmentation },
  },
} = adaptersSEG;

const {
  Cornerstone3D: {
    RTSS: { generateRTSSFromRepresentation },
  },
} = adaptersRT;

const { downloadDICOMData } = helpers;

function getAuthHeader(dataSource) {
  const bearer = dataSource?.retrieve?.customClient?.headers?.Authorization;
  return bearer ? { Authorization: bearer } : {};
}

const commandsModule = ({
  servicesManager,
  extensionManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  const { segmentationService, displaySetService, viewportGridService } =
    servicesManager.services as AppTypes.Services;

  const actions = {
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
      // Todo: handle adding more than one segmentation
      const viewport = getTargetViewport({ viewportId, viewportGridService });
      const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];

      const segmentation = segmentations[0];
      const segmentationId = segmentation.segmentationId;
      const label = segmentation.config.label;
      const segments = segmentation.config.segments;

      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

      await segmentationService.createLabelmapForDisplaySet(displaySet, {
        segmentationId,
        segments,
        label,
      });

      segmentationService.addOrUpdateSegmentation(segmentation);

      await segmentationService.addSegmentationRepresentation(viewport.viewportId, {
        segmentationId,
      });

      return segmentationId;
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
      const predecessorImageId = options.predecessorImageId ?? segmentation.predecessorImageId;

      const { imageIds } = segmentation.representationData.Labelmap;

      const segImages = imageIds.map(imageId => cache.getImage(imageId));
      const referencedImages = segImages.map(image => cache.getImage(image.referencedImageId));

      const labelmaps2D = [];

      let z = 0;

      for (const segImage of segImages) {
        const segmentsOnLabelmap = new Set();
        const pixelData = segImage.getPixelData();
        const { rows, columns } = segImage;

        // Use a single pass through the pixel data
        for (let i = 0; i < pixelData.length; i++) {
          const segment = pixelData[i];
          if (segment !== 0) {
            segmentsOnLabelmap.add(segment);
          }
        }

        labelmaps2D[z++] = {
          segmentsOnLabelmap: Array.from(segmentsOnLabelmap),
          pixelData,
          rows,
          columns,
        };
      }

      const allSegmentsOnLabelmap = labelmaps2D.map(labelmap => labelmap.segmentsOnLabelmap);

      const labelmap3D = {
        segmentsOnLabelmap: Array.from(new Set(allSegmentsOnLabelmap.flat())),
        metadata: [],
        labelmaps2D,
      };

      const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
      const representations = segmentationService.getRepresentationsForSegmentation(segmentationId);

      Object.entries(segmentationInOHIF.segments).forEach(([segmentIndex, segment]) => {
        // segmentation service already has a color for each segment
        if (!segment) {
          return;
        }

        const { label } = segment;

        const firstRepresentation = representations[0];
        const color = segmentationService.getSegmentColor(
          firstRepresentation.viewportId,
          segmentationId,
          segment.segmentIndex
        );

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
        labelmap3D.metadata[segmentIndex] = segmentMetadata;
      });

      const generatedSegmentation = generateSegmentation(referencedImages, labelmap3D, metaData, {
        predecessorImageId,
        ...options,
      });

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
    storeSegmentation: async ({ segmentationId, dataSource, modality = 'SEG' }) => {
      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation) {
        throw new Error('No segmentation found');
      }

      const { label, predecessorImageId } = segmentation;
      const defaultDataSource = dataSource ?? extensionManager.getActiveDataSource()[0];

      const {
        value: reportName,
        dataSourceName: selectedDataSource,
        series,
        priorSeriesNumber,
        action,
      } = await createReportDialogPrompt({
        servicesManager,
        extensionManager,
        predecessorImageId,
        title: 'Store Segmentation',
        modality,
      });

      if (action === PROMPT_RESPONSES.CREATE_REPORT) {
        try {
          const selectedDataSourceConfig = selectedDataSource
            ? extensionManager.getDataSources(selectedDataSource)[0]
            : defaultDataSource[0];

          const args = {
            segmentationId,
            options: {
              SeriesDescription: series ? undefined : reportName || label || 'Contour Series',
              SeriesNumber: series ? undefined : 1 + priorSeriesNumber,
              predecessorImageId: series,
            },
          };
          const generatedDataAsync =
            (modality === 'SEG' && actions.generateSegmentation(args)) ||
            (modality === 'RTSTRUCT' && actions.generateContour(args));
          const generatedData = await generatedDataAsync;

          if (!generatedData || !generatedData.dataset) {
            throw new Error('Error during segmentation generation');
          }

          const { dataset: naturalizedReport } = generatedData;

          // DCMJS assigns a dummy study id during creation, and this can cause problems, so clearing it out
          if (naturalizedReport.StudyID === 'No Study ID') {
            naturalizedReport.StudyID = '';
          }

          await selectedDataSourceConfig.store.dicom(naturalizedReport);

          // add the information for where we stored it to the instance as well
          naturalizedReport.wadoRoot = selectedDataSourceConfig.getConfig().wadoRoot;

          DicomMetadataStore.addInstances([naturalizedReport], true);

          return naturalizedReport;
        } catch (error) {
          console.debug('Error storing segmentation:', error);
          throw error;
        }
      }
    },

    generateContour: async args => {
      const { segmentationId, options } = args;
      const segmentations = segmentationService.getSegmentation(segmentationId);

      // inject colors to the segmentIndex
      const firstRepresentation =
        segmentationService.getRepresentationsForSegmentation(segmentationId)[0];
      Object.entries(segmentations.segments).forEach(([segmentIndex, segment]) => {
        segment.color = segmentationService.getSegmentColor(
          firstRepresentation.viewportId,
          segmentationId,
          Number(segmentIndex)
        );
      });
      const predecessorImageId = options?.predecessorImageId ?? segmentations.predecessorImageId;
      const dataset = await generateRTSSFromRepresentation(segmentations, {
        predecessorImageId,
        ...options,
      });
      return { dataset };
    },

    /**
     * Downloads an RTSS instance from a segmentation or contour
     * representation.
     */
    downloadRTSS: async args => {
      const { dataset } = await actions.generateContour(args);
      const { InstanceNumber: instanceNumber = 1, SeriesInstanceUID: seriesUID } = dataset;

      try {
        //Create a URL for the binary.
        const filename = `rtss-${seriesUID}-${instanceNumber}.dcm`;
        downloadDICOMData(dataset, filename);
      } catch (e) {
        console.warn(e);
      }
    },

    toggleActiveSegmentationUtility: ({ itemId: buttonId }) => {
      const { uiState, setUIState } = useUIStateStore.getState();
      const isButtonActive = uiState['activeSegmentationUtility'] === buttonId;
      console.log('toggleActiveSegmentationUtility', isButtonActive, buttonId);
      // if the button is active, clear the active segmentation utility
      if (isButtonActive) {
        setUIState('activeSegmentationUtility', null);
      } else {
        setUIState('activeSegmentationUtility', buttonId);
      }
    },
    sendToGlasses: ({ segmentationId, dataSource }) => {
      try {
        const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
        const generatedSegmentation = actions.generateSegmentation({
          segmentationId,
        });

        if (!generatedSegmentation || !generatedSegmentation.dataset) {
          console.error('Failed to generate segmentation dataset.');
          return;
        }

        const dataset = generatedSegmentation.dataset;

        const dicomBlob = datasetToBlob(dataset);

        const formData = new FormData();
        formData.append('file', dicomBlob, `${segmentationInOHIF.label}.dcm`);

        const defaultDataSource = dataSource ?? extensionManager.getActiveDataSource()[0];
        const config = defaultDataSource.getConfig();

        return fetch(
          `https://${config.pythonFunctionName}.azurewebsites.net/api/ConvertDicomToObj`,
          {
            method: 'POST',
            body: formData,
            headers: {
              ...getAuthHeader(defaultDataSource),
            },
          }
        )
          .then(async response => {
            if (response.ok) {
              console.log('Segmentation sent successfully!');
              const result = await response.text();
              console.log('Server response:', result);
            } else {
              console.error(
                `Error sending segmentation. Status: ${response.status}, Text: ${response.statusText}`
              );
            }
          })
          .catch(error => {
            console.error('Error sending segmentation:', error);
          });
      } catch (error) {
        console.error('Unexpected error in sendToGlasses:', error);
      }
    },
    downloadObj: ({ segmentationId, dataSource }) => {
      try {
        // Отримання даних сегментації та генерація DICOM Blob
        const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
        const generatedSegmentation = actions.generateSegmentation({ segmentationId });

        if (!generatedSegmentation || !generatedSegmentation.dataset) {
          console.error('Failed to generate segmentation dataset.');
          return;
        }

        const dataset = generatedSegmentation.dataset;
        const dicomBlob = datasetToBlob(dataset);

        // Формуємо FormData з DICOM файлом
        const formData = new FormData();
        formData.append('file', dicomBlob, `${segmentationInOHIF.label}.dcm`);

        const defaultDataSource = dataSource ?? extensionManager.getActiveDataSource()[0];
        const config = defaultDataSource.getConfig();

        fetch(
          `https://${config.pythonFunctionName}.azurewebsites.net/api/ConvertDicomToObjDownload`,
          {
            method: 'POST',
            body: formData,
            headers: {
              ...getAuthHeader(defaultDataSource),
            },
          }
        )
          .then(async response => {
            if (response.ok) {
              // Отримуємо відповіді як blob і створюємо посилання для завантаження
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${segmentationInOHIF.label}.obj`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              console.log('OBJ file downloaded successfully!');
            } else {
              console.error(`Error downloading OBJ file. Status: ${response.status}`);
            }
          })
          .catch(error => {
            console.error('Error downloading OBJ file:', error);
          });
      } catch (error) {
        console.error('Unexpected error in downloadObj:', error);
      }
    },
    segmentByPreset: async ({
      studyInstanceUID,
      seriesInstanceUID,
      preset,
      customWindow,
      customSegRange,
      dataSource,
    }) => {
      try {
        const defaultDataSource = dataSource ?? extensionManager.getActiveDataSource()[0];
        const config = defaultDataSource.getConfig();

        const payload = {
          studyInstanceUID,
          seriesInstanceUID,
          preset,
          customWindow,
          customSegRange,
          output: {
            mode: 'dicom_seg',
            returnMode: 'meta',
          },
        };

        const response = await fetch(
          `https://${config.pythonFunctionName}.azurewebsites.net/api/segmentbypreset`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader(defaultDataSource),
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          console.error('Segmentation request failed:', response.status, text);
          return;
        }

        const result = await response.json();
        console.log('Segmentation successful:', result);

        return result;
      } catch (e) {
        console.error('Error in segmentByPreset:', e);
      }
    },
    magicWandSegmentation: async ({
      studyInstanceUID,
      seriesInstanceUID,
      seed,
      options,
      dataSource,
    }) => {
      try {
        const defaultDataSource = dataSource ?? extensionManager.getActiveDataSource()[0];
        const config = defaultDataSource.getConfig();

        // Use the same endpoint pattern as segmentByPreset
        const endpoint = `https://${config.pythonFunctionName}.azurewebsites.net/api/segmentbymagicwand`;

        const payload: any = {
          studyInstanceUID,
          seriesInstanceUID,
          seed,
        };

        // Only include options if they are provided
        if (options && Object.keys(options).length > 0) {
          payload.options = options;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(defaultDataSource),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('Magic wand segmentation request failed:', response.status, text);
          throw new Error(`Segmentation request failed: ${response.status} ${text}`);
        }

        const result = await response.json();
        console.log('Magic wand segmentation successful:', result);

        return result;
      } catch (e) {
        console.error('Error in magicWandSegmentation:', e);
        throw e;
      }
    },
  };

  const definitions = {
    loadSegmentationsForViewport: actions.loadSegmentationsForViewport,
    generateSegmentation: actions.generateSegmentation,
    downloadSegmentation: actions.downloadSegmentation,
    storeSegmentation: actions.storeSegmentation,
    downloadRTSS: actions.downloadRTSS,
    toggleActiveSegmentationUtility: actions.toggleActiveSegmentationUtility,
    sendToGlasses: actions.sendToGlasses,
    downloadObj: actions.downloadObj,
    segmentByPreset: actions.segmentByPreset,
    magicWandSegmentation: actions.magicWandSegmentation,
  };

  return {
    actions,
    definitions,
    defaultContext: 'SEGMENTATION',
  };
};

export default commandsModule;
