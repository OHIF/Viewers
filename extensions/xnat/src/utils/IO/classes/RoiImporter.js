import AIMReader from './AIMReader.js';
import RTStructReader from './RTStructReader.js';
import addAllPolygonsToToolStateManager from '../helpers/addAllPolygonsToToolStateManager.js';

/**
 * @class RoiImporter - Imports contour-based ROI formats to
 * peppermintTools ROIContours.
 */
export default class RoiImporter {
  constructor(seriesInstanceUid, updateProgressCallback) {
    this._seriesInstanceUid = seriesInstanceUid;

    this.updateProgressCallback = updateProgressCallback;
  }

  /**
   * importAIMfile -  Imports ImageAnnotations from an AIM
   *                  ImageAnnotationCollection as peppermintTools ROIContours.
   *
   * @param  {HTMLElement} aimDoc        The AIM ImageAnnotationCollection file.
   * @param  {string} roiCollectionName  The name of the ROICollection.
   * @param  {string} roiCollectionLabel The label of the ROICollection.
   * @returns {null}
   */
  async importAIMfile(aimDoc, roiCollectionName, roiCollectionLabel) {
    const aimReader = new AIMReader();
    await aimReader.init(
      aimDoc,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback
    );

    await addAllPolygonsToToolStateManager(
      aimReader.polygons,
      'AIM',
      this.updateProgressCallback
    );
  }

  /**
   * importRTStruct - Imports ROIContours from an RTSTRUCT as
   * peppermintTools ROIContours.
   *
   * @param  {ArrayBuffer} rtStructArrayBuffer The RTSTRUCT file.
   * @param  {string} roiCollectionName  The name of the ROICollection.
   * @param  {string} roiCollectionLabel The label of the ROICollection.
   * @returns {null}
   */
  async importRTStruct(
    rtStructArrayBuffer,
    roiCollectionName,
    roiCollectionLabel
  ) {
    const rtStructReader = new RTStructReader();
    await rtStructReader.init(
      rtStructArrayBuffer,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback
    );

    await addAllPolygonsToToolStateManager(
      rtStructReader.polygons,
      'RTSTRUCT',
      this.updateProgressCallback
    );
  }
}
