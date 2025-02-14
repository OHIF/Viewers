import * as cornerstone from '@cornerstonejs/core'
import * as cornerstoneTools from '@cornerstonejs/tools';
// import dcmjs from 'dcmjs';
import { Segmentation_4X_fork } from './_tempDCMJSFork';
import { utils } from '@ohif/core';
import colorMaps from '../../../constants/colorMaps';
import {
  generateUID,
  xnatRoiApi,
  calculateMaskRoiVolume,
} from '../../../peppermint-tools';

const { studyMetadataManager } = utils;
const segmentationModule = cornerstoneTools.getModule('segmentation');

export default class MaskImporter {
  constructor(seriesInstanceUid, updateProgressCallback) {
    const imageIds = this._getImageIds(seriesInstanceUid);

    const { rows, columns } = cornerstone.metaData.get(
      'imagePlaneModule',
      imageIds[0]
    );

    const dimensions = {
      rows,
      columns,
      slices: imageIds.length,
    };

    dimensions.sliceLength = dimensions.rows * dimensions.columns;
    dimensions.cube = dimensions.sliceLength * dimensions.slices;

    this._seriesInstanceUid = seriesInstanceUid;
    this._imageIds = imageIds;
    this._dimensions = dimensions;
    this.updateProgressCallback = updateProgressCallback;
  }

  /**
   * _getImageIds - Returns the imageIds for the stack.
   *
   * @param  {type} SeriesInstanceUID description
   * @returns {type}                   description
   */
  _getImageIds(SeriesInstanceUID) {
    // Get the imageId of each sopInstance in the series
    const imageIds = [];

    const studies = studyMetadataManager.all();
    for (let i = 0; i < studies.length; i++) {
      const study = studies[i];
      const displaySets = study.getDisplaySets();

      for (let j = 0; j < displaySets.length; j++) {
        const displaySet = displaySets[j];

        if (displaySet.SeriesInstanceUID === SeriesInstanceUID) {
          const images = displaySet.images;

          for (let k = 0; k < images.length; k++) {
            imageIds.push(images[k].getImageId());
          }
        }
      }
    }

    return imageIds;
  }

  /**
   * importDICOMSEG - Imports a DICOM SEG file to CornerstoneTools.
   *
   * @param  {ArrayBuffer} dicomSegArrayBuffer An arraybuffer of the DICOM SEG object.
   * @returns {null}                     description
   */
  importDICOMSEG(dicomSegArrayBuffer) {
    return new Promise((resolve, reject) => {
      const imageIds = this._imageIds;
      const imagePromises = [];

      const numImages = imageIds.length;
      let processed = 0;

      for (let i = 0; i < imageIds.length; i++) {
        const promise = cornerstone.loadAndCacheImage(imageIds[i]);

        promise.then(() => {
          processed++;

          this.updateProgressCallback(
            Math.floor((processed * 100) / numImages)
          );
        });

        imagePromises.push(promise);
      }

      Promise.all(imagePromises).then(() => {
        try {
          const {
            labelmapBuffer,
            segMetadata,
            probabilityMapBuffer,
            isFractional,
            segmentsOnFrame,
          } = Segmentation_4X_fork.generateToolState(
            imageIds,
            dicomSegArrayBuffer,
            cornerstone.metaData
          );

          const firstImageId = imageIds[0];

          // Delete old labelmap
          if (segmentationModule.state.series[firstImageId]) {
            delete segmentationModule.state.series[firstImageId];
          }

          const {
            sliceSpacingFirstFrame,
            canCalculateVolume,
          } = xnatRoiApi.getDisplaySetInfo(segMetadata.seriesInstanceUid);
          const {
            rowPixelSpacing,
            columnPixelSpacing,
          } = cornerstone.metaData.get('imagePlaneModule', firstImageId);
          const voxelScaling =
            (columnPixelSpacing || 1) *
            (rowPixelSpacing || 1) *
            (sliceSpacingFirstFrame || 1);

          const metadata = segMetadata.data;
          metadata.forEach(seg => {
            if (seg !== undefined) {
              seg.uid = generateUID();
              seg.stats = {
                volumeCm3: 0,
                stats2D: [],
              };
              const stats = seg.stats;
              stats.canCalculateVolume = canCalculateVolume && !isFractional;
              stats.sliceSpacingFirstFrame = sliceSpacingFirstFrame;
            }
          });

          if (isFractional) {
            segmentationModule.setters.fractionalLabelmap3DByFirstImageId(
              firstImageId,
              labelmapBuffer,
              probabilityMapBuffer,
              0,
              metadata,
              imageIds.length,
              segmentsOnFrame
            );

            // Set fractional labelmap rendering options
            Object.assign(
              segmentationModule.configuration,
              fractionalLabelmapConfiguration
            );

            const colorLUT = segmentationModule.state.colorLutTables[0];

            // If the first is a color, set it to a colormap.
            if (!Array.isArray(colorLUT[1][0][0])) {
              colorLUT[1] = colorMaps[0].colormap;
              colorLUT[1].ID = colorMaps[0].ID;
            }
          } else {
            segmentationModule.setters.labelmap3DByFirstImageId(
              firstImageId,
              labelmapBuffer,
              0,
              metadata,
              imageIds.length,
              segmentsOnFrame
              // TODO -> Can define a color LUT based on colors in the SEG later.
            );

            // Calculate segment volume
            const brushStackState =
              segmentationModule.state.series[firstImageId];
            const labelmap3D =
              brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];
            labelmap3D.metadata.forEach((seg, index) => {
              if (seg !== undefined) {
                const stats = seg.stats;
                if (stats.canCalculateVolume) {
                  stats.volumeCm3 = calculateMaskRoiVolume(
                    labelmap3D,
                    index,
                    voxelScaling
                  );
                }
              }
            });

            // Set labelmap rendering options
            Object.assign(
              segmentationModule.configuration,
              labelmapConfiguration
            );
          }

          cornerstoneTools.store.state.enabledElements.forEach(element =>
            cornerstone.updateImage(element)
          );

          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

const labelmapConfiguration = {
  fillAlpha: 0.2,
  renderOutline: true,
};

const fractionalLabelmapConfiguration = {
  fillAlpha: 0.5,
  renderOutline: false,
};
