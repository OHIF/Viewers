import dcmjs from 'dcmjs';
import { classes, Types, utils } from '@ohif/core';
import { cache, metaData } from '@cornerstonejs/core';
import { segmentation as cornerstoneToolsSegmentation } from '@cornerstonejs/tools';
import { adaptersRT, adaptersSEG } from '@cornerstonejs/adapters';
import { createReportDialogPrompt, useUIStateStore } from '@ohif/extension-default';
import { getEnabledElement } from '@cornerstonejs/core';

import PROMPT_RESPONSES from '../../default/src/utils/_shared/PROMPT_RESPONSES';
import {
  getSegmentationSaveOptions,
  LABELMAP_SEG_SOP_CLASS_UID,
  BITMAP_SEG_SOP_CLASS_UID,
} from './utils/segmentationConfig';

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

const commandsModule = ({
  servicesManager,
  extensionManager,
  commandsManager,
}: Types.Extensions.ExtensionParams): Types.Extensions.CommandsModule => {
  const { segmentationService, displaySetService, viewportGridService, customizationService } =
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
      // `dataSource` (a data source name) is consumed here to resolve the store
      // overrides; it must not be forwarded to the adapter's generateSegmentation.
      const { dataSource: dataSourceName, ...generateOptions } = options;
      const segmentation = cornerstoneToolsSegmentation.state.getSegmentation(segmentationId);
      const predecessorImageId =
        generateOptions.predecessorImageId ?? segmentation.predecessorImageId;

      // A data source may override the app-wide `segmentation.store.*` defaults
      // via `configuration.segmentation.store` (different back ends support
      // different SEG encodings). Use the named target data source when storing,
      // otherwise the active one (e.g. download).
      const dataSourceDefinition = dataSourceName
        ? extensionManager.getDataSourceDefinition(dataSourceName)
        : extensionManager.getActiveDataSourceDefinition();
      const dataSourceStoreOverride = dataSourceDefinition?.configuration?.segmentation?.store;

      const labelmapData = segmentation.representationData.Labelmap;

      // Build a labelmap3D (one labelmaps2D entry per source slice) from a list of
      // derived labelmap image ids. When `referencedImageIds` is supplied (the
      // multi-layer/overlap path) each frame is indexed by its source slice so the
      // layers align to the same frames; otherwise frames are sequential (the legacy
      // single-layer behavior, kept byte-identical).
      const buildLabelmap3D = (segImageIds: string[], metadata, referencedImageIds?: string[]) => {
        const segImages = segImageIds.map(imageId => cache.getImage(imageId));
        const labelmaps2D = [];

        // Map each source imageId to its frame index once (O(n)) so the per-slice lookup
        // below is O(1) — avoids the O(slices^2) indexOf scan on the multi-layer path.
        const referencedFrameIndexById = referencedImageIds
          ? new Map(referencedImageIds.map((imageId, index) => [imageId, index]))
          : undefined;

        let z = 0;

        for (const segImage of segImages) {
          if (!segImage) {
            console.warn('SEG export - skipping null segImage');
            continue;
          }
          
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

          const frameIndex = referencedFrameIndexById
            ? referencedFrameIndexById.get(segImage.referencedImageId) ?? -1
            : z++;

          if (frameIndex < 0) {
            continue;
          }

          labelmaps2D[frameIndex] = {
            segmentsOnLabelmap: Array.from(segmentsOnLabelmap),
            pixelData,
            rows,
            columns,
          };
        }

        const allSegmentsOnLabelmap = labelmaps2D
          .filter(Boolean)
          .map(labelmap => labelmap.segmentsOnLabelmap);

        return {
          segmentsOnLabelmap: Array.from(new Set(allSegmentsOnLabelmap.flat())),
          metadata,
          labelmaps2D,
        };
      };

      // Segment metadata (shared across all layers).
      const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
      const representations = segmentationService.getRepresentationsForSegmentation(segmentationId);
      const metadata = [];

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

        metadata[segmentIndex] = {
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
      });

      // Multi-layer (overlapping) SEGs register one labelmap layer per conflict-free
      // group. Export each layer as its own labelmap3D against the UNIQUE referenced
      // source series, so cornerstone writes overlapping segments as separate frames
      // that reference the same source slice (the DICOM SEG overlap encoding). The
      // cs3D adapter's fillSegmentation accepts an array of labelmap3D for exactly
      // this. Single-layer SEGs keep the original single-labelmap3D path unchanged.
      const layers = labelmapData.labelmaps ? Object.values(labelmapData.labelmaps) : undefined;


      // The referenced source images must be fully loaded (in cache) before we can
      // build the SEG dataset against them; fail loudly rather than passing undefined
      // frames to the adapter.
      const resolveReferencedImage = (referencedImageId: string, sliceIndex: number) => {
        const referencedImage = cache.getImage(referencedImageId);
        if (!referencedImage) {
          throw new Error(
            `Referenced source image not in cache for segmentation slice ${sliceIndex} ` +
              `(referencedImageId: ${referencedImageId}). Ensure the referenced series is fully loaded before storing.`
          );
        }
        return referencedImage;
      };

      let referencedImages;
      let labelmaps3D;

      if (layers && layers.length > 1) {
        const referencedImageIds =
          layers[0].referencedImageIds ?? labelmapData.referencedImageIds ?? [];

        referencedImages = referencedImageIds.map((referencedImageId, sliceIndex) => {
          const referencedImage = cache.getImage(referencedImageId);

          if (!referencedImage) {
            throw new Error(
              `Referenced source image not in cache for segmentation slice ${sliceIndex} ` +
                `(referencedImageId: ${referencedImageId}). Ensure the referenced series is fully loaded before storing.`
            );
          }

          // If the referenced image doesn't have metadata, try to get it from metadata provider
          if (!referencedImage.data || !referencedImage.data.SeriesInstanceUID) {
            const metadata = metaData.get(referencedImageId);
            if (metadata && metadata.SeriesInstanceUID) {
              // Add metadata to the image object
              referencedImage.data = metadata;
            }
          }

          return referencedImage;
        });

        labelmaps3D = layers.map(layer =>
          buildLabelmap3D(layer.imageIds ?? [], metadata, referencedImageIds)
        );
      } else {
        const { imageIds } = labelmapData;

        // Use labelmapData.referencedImageIds if available
        const referencedImageIds = labelmapData.referencedImageIds ?? [];

        // Use original arrays without filtering
        const filteredImageIds = imageIds;
        const filteredReferencedImageIds = referencedImageIds;

        // Try to get original image metadata from displaySetService
        const displaySets = displaySetService?.getActiveDisplaySets();

        // Find the original CT series displaySet
        const originalDisplaySet = displaySets?.find(ds => ds.Modality === 'CT');

        // Helper function to extract SOPInstanceUID from imageId
        function extractSOPInstanceUID(imageId: string): string | undefined {
          const match = imageId.match(/instances\/([^\/]+)/);
          return match ? match[1] : undefined;
        }

        referencedImages = filteredReferencedImageIds.map((referencedImageId, sliceIndex) => {
          const referencedImage = cache.getImage(referencedImageId);

          if (!referencedImage) {
            throw new Error(
              `Referenced source image not in cache for segmentation slice ${sliceIndex} ` +
                `(referencedImageId: ${referencedImageId}). Ensure the referenced series is fully loaded before storing.`
            );
          }

          // Force use original displaySet metadata
          if (originalDisplaySet && originalDisplaySet.images && originalDisplaySet.images.length > 0) {
            const originalImage = originalDisplaySet.images[sliceIndex];

            if (originalImage && originalImage.SeriesInstanceUID) {
              referencedImage.data = {
                ...originalImage,
                // Extract SOPInstanceUID from referencedImageId if possible
                SOPInstanceUID: extractSOPInstanceUID(referencedImageId) || originalImage.SOPInstanceUID,
                // Ensure PatientID and PatientName are present
                PatientID: originalImage.PatientID || referencedImage.data?.PatientID,
                PatientName: originalImage.PatientName || referencedImage.data?.PatientName,
                // Ensure spatial parameters are present - copy from original CT
                Rows: originalImage.Rows || referencedImage.data?.Rows,
                Columns: originalImage.Columns || referencedImage.data?.Columns,
                PixelSpacing: originalImage.PixelSpacing || referencedImage.data?.PixelSpacing,
                ImageOrientationPatient: originalImage.ImageOrientationPatient || referencedImage.data?.ImageOrientationPatient,
                BitsAllocated: originalImage.BitsAllocated || referencedImage.data?.BitsAllocated,
                BitsStored: originalImage.BitsStored || referencedImage.data?.BitsStored,
                HighBit: originalImage.HighBit || referencedImage.data?.HighBit,
              };
            }
          }

          // If still no metadata, try metadata provider as fallback
          if (!referencedImage.data || !referencedImage.data.SeriesInstanceUID) {
            const metadata = metaData.get(referencedImageId);
            if (metadata && metadata.SeriesInstanceUID) {
              referencedImage.data = metadata;
            }
          }

          return referencedImage;
        });
        labelmaps3D = [buildLabelmap3D(filteredImageIds, metadata)];
      }

      const saveOptions = {
        predecessorImageId,
        ...getSegmentationSaveOptions(customizationService, dataSourceStoreOverride),
        ...generateOptions,
      };

      // A LABELMAP SEG frame stores a single label per voxel, so the labelmap
      // encoder cannot represent overlapping segments — it keeps only the last
      // layer written to each voxel. Overlapping segmentations arrive here as
      // multiple layers, so switch those to the binary SEG encoding, which
      // writes overlapping segments as separate frames referencing the same
      // source slice.
      const hasOverlappingLayers = Boolean(layers && layers.length > 1);
      if (hasOverlappingLayers && saveOptions.sopClassUID === LABELMAP_SEG_SOP_CLASS_UID) {
        console.warn(
          'generateSegmentation: overlapping segments cannot be stored as a LABELMAP SEG; ' +
          'switching to the binary SEG encoding for this store.'
        );
        saveOptions.sopClassUID = BITMAP_SEG_SOP_CLASS_UID;
      }

      // 规范4：导出前严格防呆校验 - 检查是否有非零像素
      let totalNonZeroPixels = 0;
      for (const labelmap3D of labelmaps3D) {
        for (const labelmap2D of labelmap3D.labelmaps2D) {
          if (labelmap2D && labelmap2D.pixelData) {
            for (const pixel of labelmap2D.pixelData) {
              if (pixel !== 0) {
                totalNonZeroPixels++;
              }
            }
          }
        }
      }

      if (totalNonZeroPixels === 0) {
        throw new Error('当前分割为空，无法导出');
      }

      const generatedSegmentation = generateSegmentation(
        referencedImages,
        labelmaps3D,
        metaData,
        saveOptions
      );

      // 修复 PixelData 被错误除以8的问题
      // 从 labelmaps3D 中重建完整的像素数据，绕过底层的除以8逻辑
      if (generatedSegmentation.dataset) {
        const { dataset } = generatedSegmentation;
        const { Rows, Columns } = dataset;

        // 统计实际有数据的帧数
        let actualFrames = 0;
        const allPixelData = [];

        for (const labelmap3D of labelmaps3D) {
          for (const labelmap2D of labelmap3D.labelmaps2D) {
            if (labelmap2D && labelmap2D.pixelData) {
              actualFrames++;
              // 确保 pixelData 是 Uint8Array
              let frameData = labelmap2D.pixelData;
              if (!(frameData instanceof Uint8Array)) {
                frameData = new Uint8Array(frameData);
              }
              allPixelData.push(frameData);
            }
          }
        }

        console.log('DICOM SEG 导出调试信息:');
        console.log(`原始 NumberOfFrames: ${dataset.NumberOfFrames}`);
        console.log(`从 labelmaps3D 统计的实际帧数: ${actualFrames}`);

        // 重建完整的 PixelData
        if (allPixelData.length > 0) {
          const combinedLength = allPixelData.reduce((sum, arr) => sum + arr.length, 0);
          const combinedData = new Uint8Array(combinedLength);
          let offset = 0;

          for (const frameData of allPixelData) {
            combinedData.set(frameData, offset);
            offset += frameData.length;
          }

          dataset.PixelData = combinedData;
          dataset.NumberOfFrames = actualFrames;

          console.log(`已重建 PixelData，长度: ${combinedData.length} 字节`);
          console.log(`已更新 NumberOfFrames 为: ${actualFrames}`);
          console.log(`每帧字节数: ${Math.round(combinedData.length / actualFrames)} 字节`);
        }
      }

      // 规范1：强制使用8位像素深度
      if (generatedSegmentation.dataset) {
        generatedSegmentation.dataset.BitsAllocated = 8;
        generatedSegmentation.dataset.BitsStored = 8;
        generatedSegmentation.dataset.HighBit = 7;
        generatedSegmentation.dataset.PixelRepresentation = 0;

        // 规范2：确保使用未压缩传输语法
        generatedSegmentation.dataset.TransferSyntaxUID = '1.2.840.10008.1.2.1';

        // 规范3：确保医疗级元数据完整
        if (generatedSegmentation.dataset.SegmentSequence) {
          for (let i = 0; i < generatedSegmentation.dataset.SegmentSequence.length; i++) {
            const segment = generatedSegmentation.dataset.SegmentSequence[i];

            // 确保 SegmentNumber 存在
            if (!segment.SegmentNumber) {
              segment.SegmentNumber = i + 1;
            }

            if (!segment.SegmentedPropertyCategoryCodeSequence) {
              segment.SegmentedPropertyCategoryCodeSequence = {
                CodeValue: "T-D0050",
                CodingSchemeDesignator: "SRT",
                CodeMeaning: "Tissue"
              };
            }
            if (!segment.SegmentedPropertyTypeCodeSequence) {
              segment.SegmentedPropertyTypeCodeSequence = {
                CodeValue: "T-D0050",
                CodingSchemeDesignator: "SRT",
                CodeMeaning: "Tissue"
              };
            }
          }
        }

        // 规范5：强制保持空间绑定的唯一性
        // 确保ReferencedSeriesSequence包含正确的SeriesInstanceUID
        if (referencedImages.length > 0 && referencedImages[0].data) {
          const firstReferencedImage = referencedImages[0];
          if (firstReferencedImage.data.SeriesInstanceUID) {
            if (!generatedSegmentation.dataset.ReferencedSeriesSequence) {
              generatedSegmentation.dataset.ReferencedSeriesSequence = [];
            }
            if (generatedSegmentation.dataset.ReferencedSeriesSequence.length === 0 || !
              generatedSegmentation.dataset.ReferencedSeriesSequence[0]) {
              generatedSegmentation.dataset.ReferencedSeriesSequence[0] = {
                SeriesInstanceUID: firstReferencedImage.data.SeriesInstanceUID
              };
            } else {
              generatedSegmentation.dataset.ReferencedSeriesSequence[0].SeriesInstanceUID =
                firstReferencedImage.data.SeriesInstanceUID;
            }
          }
        }
      }

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
      const storeFn = commandsManager.runCommand('createStoreFunction', {
        dataSource: 'download',
        defaultFileName: `${segmentationInOHIF.label}.dcm`,
      });
      storeFn(generatedSegmentation.dataset);
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

      const {
        value: reportName,
        dataSourceName,
        series,
        priorSeriesNumber,
        action,
      } = await createReportDialogPrompt({
        servicesManager,
        extensionManager,
        predecessorImageId,
        title: 'Store Segmentation',
        modality,
        enableDownload: true,
      });

      if (action !== PROMPT_RESPONSES.CREATE_REPORT) {
        return;
      }

      const defaultFileName =
        modality === 'RTSTRUCT' ? `rtss-${segmentationId}.dcm` : `${label || 'segmentation'}.dcm`;

      const storeFn = commandsManager.runCommand('createStoreFunction', {
        dataSource: dataSourceName,
        defaultFileName,
      });

      if (!storeFn) {
        throw new Error(`No valid store for dataSource: ${dataSourceName}`);
      }

      try {
        const args = {
          segmentationId,
          options: {
            // Resolve store overrides against the data source we are storing into.
            dataSource: dataSourceName,
            SeriesDescription: series ? undefined : reportName || label || 'Contour Series',
            SeriesNumber: series ? undefined : 1 + priorSeriesNumber,
            predecessorImageId: series,
          },
        };
        const generatedDataAsync =
          (modality === 'SEG' && actions.generateSegmentation(args)) ||
          (modality === 'RTSTRUCT' && actions.generateContour(args));
        const generatedData = await generatedDataAsync;

        if (!generatedData?.dataset) {
          throw new Error('Error during segmentation generation');
        }

        const { dataset: naturalizedReport } = generatedData;

        // Ensure InstanceNumber is set for SEG export
        if (modality === 'SEG' && !naturalizedReport.InstanceNumber) {
          naturalizedReport.InstanceNumber = 1;
        }

        // DCMJS assigns a dummy study id during creation, and this can cause problems, so clearing it out
        if (naturalizedReport.StudyID === 'No Study ID') {
          naturalizedReport.StudyID = '';
        }

        await storeFn(naturalizedReport, {});

        // 调用后端导出接口，将文件保存到uploads目录
        if (modality === 'SEG') {
          try {
            const fileName = defaultFileName;
            // 获取当前caseId和folderId（从window或context中获取）
            const caseId = (window as any).currentCaseId || 'default-case';
            const folderId = (window as any).currentFolderId || '';
            
            // 调用导出API
            const exportResponse = await fetch(`http://localhost:8082/api/dicom-folders/${folderId}/files/${fileName}/export`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (exportResponse.ok) {
              const exportResult = await exportResponse.json();
              console.log('SEG file exported to uploads:', exportResult);
            } else {
              console.warn('Failed to export SEG file to uploads, falling back to download');
            }
          } catch (exportError) {
            console.warn('Export to uploads failed, falling back to download:', exportError);
          }
        }

        return naturalizedReport;
      } catch (error) {
        console.debug('Error storing segmentation:', error);
        throw error;
      }
    },

    generateContour: async args => {
      const { segmentationId, options } = args;
      // `dataSource` is only used by the SEG store path; keep it out of the RTSS options.
      const { dataSource: _dataSource, ...contourOptions } = options ?? {};
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
      const predecessorImageId =
        contourOptions.predecessorImageId ?? segmentations.predecessorImageId;
      const dataset = await generateRTSSFromRepresentation(segmentations, {
        predecessorImageId,
        ...contourOptions,
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
      const storeFn = commandsManager.runCommand('createStoreFunction', {
        dataSource: 'download',
        defaultFileName: `rtss-${seriesUID}-${instanceNumber}.dcm`,
      });
      await storeFn(dataset);
    },

    /**
     * Loads a custom SEG file using the custom rendering pipeline.
     * This command is called from the Vue component via postMessage.
     * It bypasses the old OHIF rendering pipeline and uses the CustomSegmentationOverlay.
     */
    loadCustomSEG: async ({ segFile }) => {
      console.log('Custom SEG load command received:', segFile);
      
      try {
        // Find the SEG display set by SOPInstanceUID
        const displaySets = displaySetService.getDisplaySetsBy((ds: any) => 
          ds.Modality === 'SEG' && ds.SOPInstanceUID === segFile.sopInstanceUID
        );
        
        if (!displaySets || displaySets.length === 0) {
          throw new Error('SEG display set not found for SOPInstanceUID: ' + segFile.sopInstanceUID);
        }
        
        const segDisplaySet = displaySets[0];
        console.log('Found SEG display set:', segDisplaySet);
        
        // Get the current viewport
        const { viewports, activeViewportId } = viewportGridService.getState();
        const viewport = viewports.get(activeViewportId);
        
        if (!viewport) {
          throw new Error('No active viewport found');
        }

        // Get the current display set (CT images)
        const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
        const ctDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
        
        if (!ctDisplaySet) {
          throw new Error('No CT display set found');
        }

        console.log('CT display set:', ctDisplaySet);
        console.log('SEG display set:', segDisplaySet);
        
        // Store the SEG display set UID in a global variable for CustomSegmentationOverlay to access
        // This is a simple way to communicate between the command and the overlay component
        (window as any).__activeSEGDisplaySetUID = segDisplaySet.displaySetInstanceUID;
        (window as any).__activeCTDisplaySetUID = displaySetInstanceUID;
        
        console.log('Set active SEG display set UID:', segDisplaySet.displaySetInstanceUID);
        
        // Find the first frame with segmentation data and jump to that slice
        if (segDisplaySet.images && segDisplaySet.images.length > 0) {
          try {
            // Get the first SEG image (which should have referenced image information)
            const firstSegImage = segDisplaySet.images[0];
            console.log('First SEG image:', firstSegImage);
            
            // Find the corresponding CT image by matching referenced SOP Instance UID
            const referencedSOPInstanceUID = firstSegImage.ReferencedSOPInstanceUID || 
                                               firstSegImage.referencedSOPInstanceUID;
            
            console.log('Referenced SOP Instance UID:', referencedSOPInstanceUID);
            
            if (referencedSOPInstanceUID && ctDisplaySet.images) {
              const targetCTIndex = ctDisplaySet.images.findIndex(
                (ctImage: any) => ctImage.SOPInstanceUID === referencedSOPInstanceUID
              );
              
              console.log('Target CT index:', targetCTIndex);
              
              if (targetCTIndex !== -1) {
                console.log(`Found target CT image at index: ${targetCTIndex}`);
                
                // Use the scroll command to move to the target slice
                try {
                  // Get current viewport element
                  const viewportElement = document.querySelector('.cornerstone-viewport-element');
                  if (viewportElement) {
                    const enabledElement = getEnabledElement(viewportElement as any);
                    if (enabledElement && enabledElement.viewport) {
                      const csViewport = enabledElement.viewport as any;
                      const currentIndex = csViewport.getCurrentImageIdIndex?.() || 0;
                      const delta = targetCTIndex - currentIndex;
                      
                      console.log(`Current index: ${currentIndex}, target: ${targetCTIndex}, delta: ${delta}`);
                      
                      if (delta !== 0) {
                        // Use the scroll command to move to the target slice
                        await commandsManager.run('scroll', {
                          direction: delta > 0 ? 1 : -1,
                          delta: Math.abs(delta)
                        });
                        console.log('Successfully scrolled to target slice');
                      } else {
                        console.log('Already at target slice');
                      }
                    }
                  }
                } catch (scrollError) {
                  console.error('Error using scroll command:', scrollError);
                }
              } else {
                console.log('Could not find matching CT image for referenced SOP Instance UID');
              }
            }
          } catch (error) {
            console.error('Error finding first segmentation frame:', error);
          }
        }
        
        // Trigger a custom event to notify CustomSegmentationOverlay
        window.dispatchEvent(new CustomEvent('SEG_LOADED', {
          detail: {
            segDisplaySetUID: segDisplaySet.displaySetInstanceUID,
            ctDisplaySetUID: displaySetInstanceUID,
            segFile: segFile
          }
        }));
        
        return { success: true, segFile, segDisplaySetUID: segDisplaySet.displaySetInstanceUID };
      } catch (error) {
        console.error('Failed to load custom SEG:', error);
        throw error;
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
  };

  const definitions = {
    loadSegmentationsForViewport: actions.loadSegmentationsForViewport,
    generateSegmentation: actions.generateSegmentation,
    downloadSegmentation: actions.downloadSegmentation,
    storeSegmentation: actions.storeSegmentation,
    downloadRTSS: actions.downloadRTSS,
    toggleActiveSegmentationUtility: actions.toggleActiveSegmentationUtility,
    loadCustomSEG: actions.loadCustomSEG,
  };

  return {
    actions,
    definitions,
    defaultContext: 'SEGMENTATION',
  };
};

export default commandsModule;
