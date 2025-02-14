import * as cornerstone from '@cornerstonejs/core'
import * as cornerstoneTools from '@cornerstonejs/tools';
// import dcmjs from 'dcmjs';
// import getElementFromFirstImageId from '../../getElementFromFirstImageId';
import { Segmentation_4X_fork } from './_tempDCMJSFork';
import viewerEquipmentAttributes from '../ViewerEquipmentAttributes';

const segmentationModule = cornerstoneTools.getModule('segmentation');
// const globalToolStateManager =
//   cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * @class DICOMSEGWriter - Utilises dcmjs to extract a peppermintTools brush
 *                         mask drawn on the given series.
 */
export default class DICOMSEGWriter {
  constructor(seriesInfo) {
    this._seriesInfo = seriesInfo;
  }

  /**
   * write - Writes the DICOM SEG.
   *
   * @param  {string} name The name/series description of the DICOM SEG.
   * @returns {Promise} A promise that resolves to a Blob containing the DICOM SEG.
   */
  async write(name, element) {
    return new Promise((resolve, reject) => {
      const stackToolState = cornerstoneTools.getToolState(element, 'stack');
      const imageIds = stackToolState.data[0].imageIds;

      let imagePromises = [];

      for (let i = 0; i < imageIds.length; i++) {
        imagePromises.push(cornerstone.loadAndCacheImage(imageIds[i]));
      }

      const { labelmaps3D } = segmentationModule.getters.labelmaps3D(element);

      Promise.all(imagePromises)
        .then(images => {
          const { date, time } = this._generateDateTime();

          const options = {
            includeSliceSpacing: true,
            rleEncode: false, // Not yet currently supported by the XNAT ROI plugin
            SeriesDescription: name,
            Manufacturer: viewerEquipmentAttributes.Manufacturer,
            ManufacturerModelName:
              viewerEquipmentAttributes.ManufacturerModelName,
            SoftwareVersions: viewerEquipmentAttributes.SoftwareVersions,
            SeriesDate: date,
            SeriesTime: time,
            ContentDate: date,
            ContentTime: time,
          };

          // const segBlob = dcmjs.adapters.Cornerstone.Segmentation.generateSegmentation(
          const segBlob = Segmentation_4X_fork.generateSegmentation(
            images,
            labelmaps3D,
            options
          );

          resolve(segBlob);
        })
        .catch(err => {
          // console.log(err);
          reject(err);
        });
    });
  }

  /**
   * _generateDateTime - Generates a datestamp and timestamp.
   *
   * @returns {object} An object with formatted date and time properties.
   */
  _generateDateTime() {
    const d = new Date();
    const dateTime = {
      year: d.getFullYear().toString(),
      month: (d.getMonth() + 1).toString(),
      date: d.getDate().toString(),
      hours: d.getHours().toString(),
      minutes: d.getMinutes().toString(),
      seconds: d.getSeconds().toString(),
    };

    // Pad with zeros e.g. March: 3 => 03
    Object.keys(dateTime).forEach(element => {
      if (dateTime[`${element}`].length < 2) {
        dateTime[`${element}`] = '0' + dateTime[`${element}`];
      }
    });

    return {
      date: dateTime.year + dateTime.month + dateTime.date,
      time: dateTime.hours + dateTime.minutes + dateTime.seconds,
    };
  }
}
