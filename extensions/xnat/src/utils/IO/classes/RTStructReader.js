import { Polygon } from '../../../peppermint-tools';
import dicomParser from 'dicom-parser';
import cornerstoneTools from 'cornerstone-tools';
import allowStateUpdate from '../../awaitStateUpdate';

const modules = cornerstoneTools.store.modules;

/**
 * @class RTStructReader - Reads an RTSTRUCT using dicomParser and extracts any ROIContours.
 */
export default class RTStructReader {
  async init(
    rtStructArrayBuffer,
    seriesInstanceUidToImport,
    roiCollectionName,
    roiCollectionLabel,
    updateProgressCallback
  ) {
    this._dataSet = this._getdataSet(rtStructArrayBuffer);
    this._isRTStruct();

    this._updateProgressCallback = updateProgressCallback;
    this._percentComplete = 0;

    this._polygons = [];
    this._seriesInstanceUidToImport = seriesInstanceUidToImport;
    this._roiCollectionName = roiCollectionName;
    this._roiCollectionLabel = roiCollectionLabel;
    this._sopInstanceUid = this._dataSet.string(RTStructTag['SOPInstanceUID']);
    this._structureSetName = this._dataSet.string(
      RTStructTag['StructureSetName']
    );
    this._structureSetLabel = this._dataSet.string(
      RTStructTag['StructureSetLabel']
    );
    this._roiNames = {};

    this._sopInstancesInSeries = this._getSopInstancesInSeries();

    this._freehand3DStore = modules.freehand3D;

    if (this._sopInstancesInSeries.length > 0) {
      this._extractROINames();
      await this._extractROIContours();
    }
  }

  /**
   * _getdataSet - Gets the dataSet from the RTSTRUCT file.
   *
   * @param  {ArrayBuffer} rtStructArrayBuffer The RTSTRUCT file.
   * @returns {object}  The dataset.
   */
  _getdataSet(rtStructArrayBuffer) {
    let byteArray = new Uint8Array(rtStructArrayBuffer);

    let dataSet = null;
    try {
      dataSet = dicomParser.parseDicom(byteArray);
    } catch (err) {
      console.error(err.message);
    }

    return dataSet;
  }

  /**
   * _isRTStruct - checks if the DICOM is an RTSTRUCT
   *
   * @returns {boolean} True if the DICOM is an RTSTRUCT.
   */
  _isRTStruct() {
    const SOPClassUID = this._dataSet.string(RTStructTag['SOPClassUID']);
    if (SOPClassUID !== RadiationTherapyStructureSetStorage) {
      throw `DICOM file is not an RT-Struct. It has SOPClassUID: ${SOPClassUID}`;
    }

    return;
  }

  /**
   * _getSopInstancesInSeries - gets the referenced sop instance UIDs in the series.
   *
   * @returns {string[]} An array of sop instance UIDs.
   */
  _getSopInstancesInSeries() {
    let sopInstanceUids = [];
    const RTReferencedSeries = this._getRTReferenceSeries();

    if (RTReferencedSeries !== null) {
      const ContourImageSequenceItems =
        RTReferencedSeries.dataSet.elements[RTStructTag['ContourImageSequence']]
          .items;

      for (let i = 0; i < ContourImageSequenceItems.length; i++) {
        const ContourImage = ContourImageSequenceItems[i];
        const sopInstanceUid = ContourImage.dataSet.string(
          RTStructTag['ReferencedSOPInstanceUID']
        );
        sopInstanceUids.push(sopInstanceUid);
      }
    }

    return sopInstanceUids;
  }

  /**
   * _getRTReferenceSeries -  gets the RTReferencedSeries that corresponds to
   *                          the active series.
   *
   * @returns {object||null}  The referenced series node of the DICOM dataset.
   */
  _getRTReferenceSeries() {
    const ReferencedFrameofReferenceSequenceItems = this._dataSet.elements[
      RTStructTag['ReferencedFrameofReferenceSequence']
    ].items;

    for (let i = 0; i < ReferencedFrameofReferenceSequenceItems.length; i++) {
      const ReferencedFrameofReference =
        ReferencedFrameofReferenceSequenceItems[i];
      const RTReferencedStudySequenceItems =
        ReferencedFrameofReference.dataSet.elements[
          RTStructTag['RTReferencedStudySequence']
        ].items;

      for (let j = 0; j < RTReferencedStudySequenceItems.length; j++) {
        const RTReferencedStudy = RTReferencedStudySequenceItems[j];
        const RTReferencedSeriesSequenceItems =
          RTReferencedStudy.dataSet.elements[
            RTStructTag['RTReferencedSeriesSequence']
          ].items;

        for (let k = 0; k < RTReferencedSeriesSequenceItems.length; k++) {
          const RTReferencedSeries = RTReferencedSeriesSequenceItems[k];
          const seriesInstanceUid = RTReferencedSeries.dataSet.string(
            RTStructTag['SeriesInstanceUID']
          );
          if (seriesInstanceUid === this._seriesInstanceUidToImport) {
            return RTReferencedSeries;
          }
        }
      }
    }

    return null;
  }

  /**
   * _extractROINames - extracts the ROI names.
   *
   * @returns {null}
   */
  _extractROINames() {
    const StructureSetROISequence = this._dataSet.elements[
      RTStructTag['StructureSetROISequence']
    ];
    const ROIs = StructureSetROISequence.items;
    for (let i = 0; i < ROIs.length; i++) {
      const ROINumber = ROIs[i].dataSet.string(RTStructTag.ROINumber);
      const ROIName = ROIs[i].dataSet.string(RTStructTag.ROIName);
      this._roiNames[ROINumber] = ROIName;
    }
  }

  /**
   * _extractROIContours - extracts the contours from the RTSTRUCT.
   *
   * @returns {null}
   */
  async _extractROIContours() {
    const ROIContourSequence = this._dataSet.elements[
      RTStructTag['ROIContourSequence']
    ];
    const ROIContours = ROIContourSequence.items;

    this._percentComplete = 0;
    let numAllContours = 0;
    const numContours = [];
    for (let i = 0; i < ROIContours.length; i++) {
      const contourSequence =
        ROIContours[i].dataSet.elements[RTStructTag['ContourSequence']];
      const polygon = contourSequence.items;
      numContours.push(polygon.length);
      numAllContours += polygon.length;
    }

    let extractedNumContours = 0;
    for (let i = 0; i < ROIContours.length; i++) {
      await this._extractOneROIContour(
        ROIContours[i].dataSet,
        extractedNumContours,
        numAllContours
      );
      extractedNumContours += numContours[i];
    }
  }

  /**
   * _extractOneROIContour - extracts one ROIContour from the dataset.
   *
   * @param  {type} ROIContourDataSet The dataset of the ROIContour.
   * @returns {null}
   */
  async _extractOneROIContour(
    ROIContourDataSet,
    extractedNumContours,
    numAllContours
  ) {
    const ROINumber = ROIContourDataSet.string(
      RTStructTag['ReferencedROINumber']
    );

    const ROIContourUid = this._createNewROIContourAndGetUid(ROINumber);

    const contourSequence =
      ROIContourDataSet.elements[RTStructTag['ContourSequence']];
    const polygon = contourSequence.items;
    for (let i = 0; i < polygon.length; i++) {
      this._extractOnePolygon(polygon[i].dataSet, ROIContourUid, ROINumber);

      const percentComplete = Math.floor(
        ((extractedNumContours + i + 1) * 100) / numAllContours
      );
      if (percentComplete !== this._percentComplete) {
        this._updateProgressCallback(`Reading Buffer: ${percentComplete}%`);
        this._percentComplete = percentComplete;
        await allowStateUpdate();
      }
    }
  }

  /**
   * _createNewROIContourAndGetUid - Creates a new ROIContour and returns its UID.
   *
   * @param  {number} ROINumber The index of the ROIContour.
   * @returns {string}  The ROICOntourUid.
   */
  _createNewROIContourAndGetUid(ROINumber) {
    const freehand3DStore = this._freehand3DStore;
    let name;
    let uid;

    uid = `${this._sopInstanceUid}.${this._structureSetLabel}.${ROINumber}`;

    const roiName = this._roiNames[ROINumber];
    if (roiName) {
      name = roiName;
    } else {
      if (this._structureSetName) {
        // StructureSetName is Type 3: Optional
        name = `${this._structureSetName} Lesion ${ROINumber}`;
      } else {
        // StructureSetLabel is Type: Mandatory and not empty
        name = ` ${this._structureSetLabel} Lesion ${ROINumber}`;
      }
    }

    this._addStructureSetIfNotPresent();

    const ROIContourUid = freehand3DStore.setters.ROIContour(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      name,
      {
        uid,
      }
    );

    return ROIContourUid;
  }

  /**
   * _addStructureSetIfNotPresent - Adds a structureSet to the series if it
   *                                doesn't exist yet.
   *
   * @returns {null}
   */
  _addStructureSetIfNotPresent() {
    const freehand3DStore = this._freehand3DStore;

    const structureSet = freehand3DStore.getters.structureSet(
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel
    );

    if (!structureSet) {
      freehand3DStore.setters.structureSet(
        this._seriesInstanceUidToImport,
        this._roiCollectionName,
        {
          isLocked: true,
          visible: true,
          uid: this._roiCollectionLabel,
        }
      );
    }
  }

  /**
   * _extractOnePolygon - Extracts one polygon from the ROIContour.
   *
   * @param  {object} contourSequenceItemData The dataset for the polygon.
   * @param  {string} ROIContourUid           The UID of the ROIContour.
   * @param  {number} ROINumber               The index of the ROIContour.
   * @returns {null}
   */
  _extractOnePolygon(contourSequenceItemData, ROIContourUid, ROINumber) {
    // Only parse closed polygons
    const contourGeometricType = contourSequenceItemData.string(
      RTStructTag['ContourGeometricType']
    );
    if (contourGeometricType !== 'CLOSED_PLANAR') {
      return;
    }

    const contourImageSequenceData =
      contourSequenceItemData.elements[RTStructTag['ContourImageSequence']]
        .items[0].dataSet;
    const referencedSopInstanceUid = contourImageSequenceData.string(
      RTStructTag['ReferencedSOPInstanceUID']
    );

    // Don't extract polygon if it doesn't belong to the series being imported
    if (!this._sopInstancesInSeries.includes(referencedSopInstanceUid)) {
      return;
    }

    const referencedFrameNumber = contourImageSequenceData.string(
      RTStructTag['ReferencedFrameNumber']
    );
    const contourNumber = contourSequenceItemData.string(
      RTStructTag['ContourNumber']
    );
    const polygonUid = `${this._sopInstanceUid}.${ROINumber}.${contourNumber}`;

    const points = this._extractPoints(
      contourSequenceItemData,
      referencedSopInstanceUid
    );
    const polygon = new Polygon(
      points,
      referencedSopInstanceUid,
      this._seriesInstanceUidToImport,
      this._roiCollectionLabel,
      ROIContourUid,
      polygonUid,
      referencedFrameNumber
    );

    this._polygons.push(polygon);
  }

  /**
   * _extractPoints - Extracts the points of a polygon.
   *
   * @param  {object} contourSequenceItemData  The dataset for the polygon.
   * @param  {string} referencedSopInstanceUid  The sop instance UID referenced
   *                                            by the polygon.
   * @returns {number[]} An array of points.
   */
  _extractPoints(contourSequenceItemData, referencedSopInstanceUid) {
    const points = [];
    const numPoints = contourSequenceItemData.intString(
      RTStructTag['NumberofContourPoints']
    );
    const numValues = numPoints * 3;

    for (let i = 0; i < numValues; i += 3) {
      points.push({
        x: contourSequenceItemData.floatString(RTStructTag['ContourData'], i),
        y: contourSequenceItemData.floatString(
          RTStructTag['ContourData'],
          i + 1
        ),
        z: contourSequenceItemData.floatString(
          RTStructTag['ContourData'],
          i + 2
        ),
      });
    }

    return points;
  }

  get polygons() {
    return this._polygons;
  }
}

const RadiationTherapyStructureSetStorage = '1.2.840.10008.5.1.4.1.1.481.3';

const RTStructTag = {
  SOPClassUID: 'x00080016',
  SOPInstanceUID: 'x00080018',
  ROIContourSequence: 'x30060039',
  ROINumber: 'x30060022',
  ROIName: 'x30060026',
  ReferencedROINumber: 'x30060084',
  ContourSequence: 'x30060040',
  ContourImageSequence: 'x30060016',
  ReferencedSOPInstanceUID: 'x00081155',
  ReferencedFrameNumber: 'x00081160',
  ContourNumber: 'x30060048',
  ContourGeometricType: 'x30060042',
  NumberofContourPoints: 'x30060046',
  ContourData: 'x30060050',
  StructureSetROISequence: 'x30060020',
  ReferencedFrameofReferenceUID: 'x30060024',
  ReferencedFrameofReferenceSequence: 'x30060010',
  FrameofReferenceUID: 'x00200052',
  RTReferencedStudySequence: 'x30060012',
  RTReferencedSeriesSequence: 'x30060014',
  SeriesInstanceUID: 'x0020000e',
  StructureSetName: 'x30060004',
  StructureSetLabel: 'x30060002',
};
