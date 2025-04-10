import LazyAIMReader from './LazyAIMReader';
import LazyRTStructReader from './LazyRTStructReader';
import addAllPolygonsToToolStateManager from '../helpers/addAllPolygonsToToolStateManager';

/**
 * @class LazyRoiImporter - Imports contour-based ROI formats to
 *            peppermintTools ROIContours in a lazy-loading mode.
 */
export default class LazyRoiImporter {
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
    const aimReader = new LazyAIMReader();
    await aimReader.init(
      aimDoc,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback,
      addAllPolygonsToToolStateManager
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
    const rtStructReader = new LazyRTStructReader();
    await rtStructReader.init(
      rtStructArrayBuffer,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback,
      addAllPolygonsToToolStateManager
    );
  }
}
