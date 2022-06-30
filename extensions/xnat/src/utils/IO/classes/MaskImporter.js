import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
// import dcmjs from 'dcmjs';
import { Segmentation_4X_fork } from './_tempDCMJSFork/';
import { utils } from '@ohif/core';
import colorMaps from '../../../constants/colorMaps';
import { generateUID } from '../../../peppermint-tools';

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
    return new Promise(resolve => {
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

        const metadata = segMetadata.data;
        metadata.forEach(seg => {
          if (seg !== undefined) {
            seg.uid = generateUID();
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
            0, // TODO -> Can define a color LUT based on colors in the SEG later.
            metadata,
            imageIds.length,
            segmentsOnFrame
          );

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
