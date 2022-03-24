import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import { Polygon, PEPPERMINT_TOOL_NAMES } from '../../../peppermint-tools';
import AIMReader from './AIMReader.js';
import RTStructReader from './RTStructReader.js';
import { utils } from '@ohif/core';
import allowStateUpdate from '../../awaitStateUpdate';

const { studyMetadataManager } = utils;

const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;
const modules = cornerstoneTools.store.modules;

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

const { getToolForElement, setToolPassive } = cornerstoneTools;

/**
 * @class RoiImporter - Imports contour-based ROI formats to
 * peppermintTools ROIContours.
 */
export default class RoiImporter {
  constructor(seriesInstanceUid, updateProgressCallback) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._sopInstanceUidToImageIdMap = this._getSopInstanceUidToImageIdMap();

    this._freehand3DStore = modules.freehand3D;
    this.updateProgressCallback = updateProgressCallback;
    this._percentComplete = 0;
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

    await this._addPolygonsToToolStateManager(aimReader.polygons, 'AIM');
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
  async importRTStruct(rtStructArrayBuffer, roiCollectionName, roiCollectionLabel) {
    const rtStructReader = new RTStructReader();
    await rtStructReader.init(
      rtStructArrayBuffer,
      this._seriesInstanceUid,
      roiCollectionName,
      roiCollectionLabel,
      this.updateProgressCallback
    );
    await this._addPolygonsToToolStateManager(rtStructReader.polygons, 'RTSTRUCT');
  }

  /**
   * _addPolygonsToToolStateManager - Adds polygons to the cornerstoneTools
   *                                  toolState.
   *
   * @param  {Polygon[]} polygons   The polygons to add to cornerstoneTools.
   * @param  {string} importType The source file type (used for scaling).
   * @returns {null}
   */
  async _addPolygonsToToolStateManager(polygons, importType) {
    const toolStateManager = globalToolStateManager.saveToolState();

    const numpPolygons = polygons.length;
    this._percentComplete = 0;

    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i];
      const sopInstanceUid = polygon.sopInstanceUid;
      const correspondingImageId = this._sopInstanceUidToImageIdMap[
        sopInstanceUid
      ];

      this._addOnePolygonToToolStateManager(
        polygon,
        toolStateManager,
        correspondingImageId,
        importType
      );

      const percentComplete = Math.floor(((i + 1) * 100) / numpPolygons);
      if (percentComplete !== this._percentComplete) {
        this.updateProgressCallback(`Updating Tool State: ${percentComplete}%`);
        this._percentComplete = percentComplete;
        await allowStateUpdate();
      }
    }

    this._refreshToolStateManager(toolStateManager);
  }

  /**
   * _addOnePolygonToToolStateManager - Adds a single polygon to the
   *                                    cornerstoneTools toolState.
   *
   * @param  {Polygon} polygon            The polygon to add.
   * @param  {object} toolStateManager    The toolStateManager object.
   * @param  {string} correspondingImageId The imageId the polygon should be added to.
   * @param  {type} importType           The source file type (used for scaling).
   * @returns {null}
   */
  _addOnePolygonToToolStateManager(
    polygon,
    toolStateManager,
    correspondingImageId,
    importType
  ) {
    if (!correspondingImageId) {
      // ROI for image which is not loaded
      return;
    }

    // Point to correct imageId if multiframe Image
    correspondingImageId = this._modifyImageIdIfMultiframe(
      correspondingImageId,
      polygon
    );

    this._addImageToolStateIfNotPresent(toolStateManager, correspondingImageId);

    const freehandToolData =
      toolStateManager[correspondingImageId][FREEHAND_ROI_3D_TOOL].data;
    if (this._polygonNotAlreadyPresent(freehandToolData, polygon.uid)) {
      const data = polygon.getFreehandToolData(importType);

      this._freehand3DStore.setters.incrementPolygonCount(
        data.seriesInstanceUid,
        data.structureSetUid,
        data.ROIContourUid
      );
      scaleHandles(data, correspondingImageId);

      freehandToolData.push(data);
    }

    // console.log(toolStateManager);
  }

  /**
   * _polygonNotAlreadyPresent - Returns true if the polygon is not already on
   *                             the image.
   *
   * @param  {object} freehandToolData The freehandToolData for an image.
   * @param  {string} newPolygonUuid   The uuid of the polygon being checked.
   * @returns {boolean} True if the polygon is not already on the image.
   */
  _polygonNotAlreadyPresent(freehandToolData, newPolygonUuid) {
    for (let i = 0; i < freehandToolData.length; i++) {
      if (freehandToolData[i].uuid === newPolygonUuid) {
        return false;
      }
    }

    return true;
  }

  /**
   * _addImageToolStateIfNotPresent - Adds freehand toolState to imageId if its not present.
   *
   * @param  {object} toolStateManager The toolStateManager object.
   * @param  {string} imageId          The imageId of the Cornerstone image.
   * @returns {null}
   */
  _addImageToolStateIfNotPresent(toolStateManager, imageId) {
    // Add freehand tools to toolStateManager if no toolState for imageId
    if (!toolStateManager[imageId]) {
      toolStateManager[imageId] = {};
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL] = {};
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL].data = [];
    } else if (!toolStateManager[imageId][FREEHAND_ROI_3D_TOOL]) {
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL] = {};
      toolStateManager[imageId][FREEHAND_ROI_3D_TOOL].data = [];
    }
  }

  /**
   * _refreshToolStateManager - restores the toolStateManager.
   *
   * @param  {object} toolStateManager The toolStateManager
   */
  _refreshToolStateManager(toolStateManager) {
    globalToolStateManager.restoreToolState(toolStateManager);

    cornerstone.getEnabledElements().forEach(enabledElement => {
      const { element } = enabledElement;
      const tool = getToolForElement(element, FREEHAND_ROI_3D_TOOL);

      if (tool.mode !== 'active' && tool.mode !== 'passive') {
        // If not already active or passive, set passive so contours render.
        setToolPassive(FREEHAND_ROI_3D_TOOL);
      }

      cornerstone.updateImage(element);
    });
  }

  /**
   * _getSopInstanceUidToImageIdMap - Generates and returns a map of
   *                                  sop instance UID to imageId.
   *
   * @returns {object}  The sop instance UID to image Id map.
   */
  _getSopInstanceUidToImageIdMap() {
    const sopInstanceUidToImageIdMap = {};
    const studies = studyMetadataManager.all();

    // TODO -> We could actually build this map once on import if we have all the correct data?

    for (let i = 0; i < studies.length; i++) {
      const study = studies[i];
      const displaySets = study.getDisplaySets();

      for (let j = 0; j < displaySets.length; j++) {
        const displaySet = displaySets[j];
        const { images } = displaySet;

        for (let k = 0; k < images.length; k++) {
          const image = images[k];
          const sopInstanceUID = image.getSOPInstanceUID();
          const imageId = image.getImageId();

          sopInstanceUidToImageIdMap[sopInstanceUID] = imageId;
        }
      }
    }

    return sopInstanceUidToImageIdMap;
  }

  /**
   * _modifyImageIdIfMultiframe - Modifies the imageId for multiframe images,
   *                              so that the polygons are indexed correctly.
   *
   * @param  {string} correspondingImageId The imageid
   * @param  {Polygon} polygon The polygon being added.
   * @returns {string} The
   */
  _modifyImageIdIfMultiframe(correspondingImageId, polygon) {
    if (!correspondingImageId.includes('frame=')) {
      //single frame, return unchanged Id
      return correspondingImageId;
    }

    const frameArray = correspondingImageId.split('frame=');
    const correctedFrameNumber = Number(polygon.frameNumber) - 1;

    return `${frameArray[0]}frame=${correctedFrameNumber}`;
  }
}

function scaleHandles(toolData, imageId) {
  switch (toolData.toBeScaled) {
    case 'AIM':
      // No scaling, TwoDimensionSpatialCoordinates in AIM are already stored in pixel coordinates.
      break;
    case 'RTSTRUCT':
      try {
        scaleRtStructContourData(toolData, imageId);
      } catch (err) {
        console.error(err.message);
      }
      break;
    default:
      console.error(`Unrecognised scaling type: ${toolData.toBeScaled}`);
      break;
  }

  delete toolData.toBeScaled;
}

function scaleRtStructContourData(toolData, imageId) {
  // See Equation C.7.6.2.1-1 of the DICOM standard

  const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);

  const {
    rowCosines,
    columnCosines,
    rowPixelSpacing: deltaI,
    columnPixelSpacing: deltaJ,
    imagePositionPatient,
  } = imagePlane;

  const X = [rowCosines[0], rowCosines[1], rowCosines[2]];
  const Y = [columnCosines[0], columnCosines[1], columnCosines[2]];
  const S = [
    imagePositionPatient[0],
    imagePositionPatient[1],
    imagePositionPatient[2],
  ];

  // 9 sets of simulataneous equations to choose from, choose which set to solve
  // Based on the largest component of each direction cosine.
  // This avoids NaNs or floating point errors caused by dividing by very small numbers and ensures a safe mapping.

  let ix = 0;
  let iy = 0;
  let largestDirectionCosineMagnitude = {
    x: 0,
    y: 0,
  };

  // Find the element with the largest magnitude in each direction cosine vector.
  for (let i = 0; i < X.length; i++) {
    if (Math.abs(X[i]) > largestDirectionCosineMagnitude.x) {
      ix = i;
      largestDirectionCosineMagnitude.x = Math.abs(X[i]);
    }
    if (Math.abs(Y[i]) > largestDirectionCosineMagnitude.y) {
      iy = i;
      largestDirectionCosineMagnitude.y = Math.abs(Y[i]);
    }
  }

  const ci = {
    // Index of max elements in X and Y
    ix,
    iy,
  };

  // Sanity Check
  const directionCosineMagnitude = {
    x: Math.pow(X[0], 2) + Math.pow(X[1], 2) + Math.pow(X[2], 2),
    y: Math.pow(Y[0], 2) + Math.pow(Y[1], 2) + Math.pow(Y[2], 2),
  };

  if (directionCosineMagnitude.x < 0.99 || directionCosineMagnitude.y < 0.99) {
    throw Error(
      `Direction cosines do not sum to 1 in quadrature. There is likely a mistake in the DICOM metadata.` +
        `directionCosineMagnitudes: ${directionCosineMagnitude.x}, ${directionCosineMagnitude.y}`
    );
  }

  // Fill in elements that won't change between points
  const c = [undefined, Y[ci.ix], X[ci.ix], undefined, X[ci.iy], Y[ci.iy]];

  const points = toolData.handles.points;

  for (let pointI = 0; pointI < points.length; pointI++) {
    // Subtract imagePositionPatient from the coordinate
    const r = [
      points[pointI].x - S[0],
      points[pointI].y - S[1],
      points[pointI].z - S[2],
    ];

    // Set the variable terms in c.
    c[0] = r[ci.ix];
    c[3] = r[ci.iy];

    // General case: Solves the two choosen simulataneous equations to go from the patient coordinate system to the imagePlane.
    const i =
      (c[0] - (c[1] * c[3]) / c[5]) /
      (c[2] * deltaI * (1 - (c[1] * c[4]) / (c[2] * c[5])));
    const j = (c[3] - c[4] * i * deltaI) / (c[5] * deltaJ);

    // NOTE: Add (0.5, 0.5) to the coordinate, as PCS reference frame is with respect to the centre of the first pixel.
    points[pointI].x = i + 0.5;
    points[pointI].y = j + 0.5;
    points[pointI].z = 0;
  }

  return;
}
