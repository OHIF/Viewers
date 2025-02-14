import * as cornerstone from '@cornerstonejs/core'
import * as cornerstoneTools from '@cornerstonejs/tools';
import scaleHandles from './scaleHandles';
import { PEPPERMINT_TOOL_NAMES } from '../../../peppermint-tools';
import getSopInstanceUidToImageIdMap from './getSopInstanceUidToImageIdMap';
import allowStateUpdate from '../../awaitStateUpdate';
import {
  xnatRoiApi,
  calculateContourArea,
  calculateContourRoiVolume,
  getRoiMeasurementUnits,
} from '../../../peppermint-tools';

const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;
const modules = cornerstoneTools.store.modules;

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

const { getToolForElement, setToolPassiveForElement } = cornerstoneTools;

/**
 * addAllPolygonsToToolStateManager - Adds polygons to the cornerstoneTools
 *                                    toolState.
 *
 * @param  {Polygon[]} polygons   The polygons to add to cornerstoneTools.
 * @param  {string} importType The source file type (used for scaling).
 * @param {function} updateProgressCallback - for default/non-lazy ROI importer
 * @returns {null}
 */
const addAllPolygonsToToolStateManager = async (
  polygons,
  importType,
  updateProgressCallback
) => {
  const freehand3DStore = modules.freehand3D;
  const toolStateManager = globalToolStateManager.saveToolState();

  const sopInstanceUidToImageIdMap = getSopInstanceUidToImageIdMap();

  const numPolygons = polygons.length;
  let refPercentComplete = 0;

  if (numPolygons < 1) {
    return;
  }

  const { _seriesInstanceUid, _structureSetUid } = polygons[0];
  const structureSet = freehand3DStore.getters.structureSet(
    _seriesInstanceUid,
    _structureSetUid
  );
  const contourRoiStats = new Map();

  const {
    sliceSpacingFirstFrame,
    canCalculateVolume,
    modality,
  } = xnatRoiApi.getDisplaySetInfo(_seriesInstanceUid);

  const ROIContourCollection = structureSet.ROIContourCollection;
  ROIContourCollection.forEach(contourRoi => {
    const stats = contourRoi.stats;
    stats.canCalculateVolume = canCalculateVolume;
    stats.sliceSpacingFirstFrame = sliceSpacingFirstFrame;
    contourRoiStats.set(contourRoi.uid, stats);
  });

  for (let i = 0; i < numPolygons; i++) {
    const polygon = polygons[i];
    const sopInstanceUid = polygon.sopInstanceUid;
    const correspondingImageId = sopInstanceUidToImageIdMap[sopInstanceUid];

    if (correspondingImageId) {
      const scaledPoints = addPolygonToToolStateManager(
        polygon,
        toolStateManager,
        correspondingImageId,
        importType,
        freehand3DStore
      );

      // Calculate area
      if (canCalculateVolume && scaledPoints) {
        const {
          rowPixelSpacing,
          columnPixelSpacing,
        } = cornerstone.metaData.get('imagePlaneModule', correspondingImageId);
        const scaling = (columnPixelSpacing || 1) * (rowPixelSpacing || 1);
        const area = calculateContourArea(scaledPoints, scaling);
        const roiStats = contourRoiStats.get(polygon._ROIContourUid);
        roiStats.areas[polygon._polygonUid] = area;
        if (!roiStats.units) {
          roiStats.units = getRoiMeasurementUnits(modality, rowPixelSpacing);
        }
      }
    }

    // updateProgressCallback is provided by the default/non-lazy ROI importer
    if (updateProgressCallback) {
      const percentComplete = Math.floor(((i + 1) * 100) / numPolygons);
      if (percentComplete !== refPercentComplete) {
        updateProgressCallback(`Updating Tool State: ${percentComplete}%`);
        refPercentComplete = percentComplete;
        await allowStateUpdate();
      }
    }
  }

  // Calculate volumes
  if (canCalculateVolume) {
    contourRoiStats.forEach(stats => {
      stats.volumeCm3 = calculateContourRoiVolume(
        Object.values(stats.areas),
        sliceSpacingFirstFrame
      );
    });
  }

  refreshToolStateManager(toolStateManager);
};

/**
 * _addOnePolygonToToolStateManager - Adds a single polygon to the
 *                                    cornerstoneTools toolState.
 *
 * @param  {Polygon} polygon            The polygon to add.
 * @param  {object} toolStateManager    The toolStateManager object.
 * @param  {string} correspondingImageId The imageId the polygon should be added to.
 * @param  {string} importType           The source file type (used for scaling).
 * @param {object} freehand3DStore
 * @returns {null}
 */
const addPolygonToToolStateManager = (
  polygon,
  toolStateManager,
  correspondingImageId,
  importType,
  freehand3DStore
) => {
  // Point to correct imageId if multiframe Image
  correspondingImageId = _modifyImageIdIfMultiframe(
    correspondingImageId,
    polygon
  );

  _addImageToolStateIfNotPresent(toolStateManager, correspondingImageId);

  const freehandToolData =
    toolStateManager[correspondingImageId][FREEHAND_ROI_3D_TOOL].data;

  if (!_isPolygonPresentInToolData(freehandToolData, polygon.uid)) {
    const data = polygon.getFreehandToolData(importType);

    freehand3DStore.setters.incrementPolygonCount(
      data.seriesInstanceUid,
      data.structureSetUid,
      data.ROIContourUid
    );
    scaleHandles(data, correspondingImageId);

    freehandToolData.push(data);

    return data.handles.points;
  }
};

/**
 * _modifyImageIdIfMultiframe - Modifies the imageId for multiframe images,
 *                              so that the polygons are indexed correctly.
 *
 * @param  {string} correspondingImageId The imageid
 * @param  {Polygon} polygon The polygon being added.
 * @returns {string} The
 */
const _modifyImageIdIfMultiframe = (correspondingImageId, polygon) => {
  if (!correspondingImageId.includes('frame=')) {
    //single frame, return unchanged Id
    return correspondingImageId;
  }

  const frameArray = correspondingImageId.split('frame=');
  const correctedFrameNumber = Number(polygon.frameNumber) - 1;

  return `${frameArray[0]}frame=${correctedFrameNumber}`;
};

/**
 * _addImageToolStateIfNotPresent - Adds freehand toolState to imageId if its not present.
 *
 * @param  {object} toolStateManager The toolStateManager object.
 * @param  {string} imageId          The imageId of the Cornerstone image.
 * @returns {null}
 */
const _addImageToolStateIfNotPresent = (toolStateManager, imageId) => {
  // Add freehand tools to toolStateManager if no toolState for imageId
  if (!toolStateManager[imageId]) {
    toolStateManager[imageId] = {};
    toolStateManager[imageId][FREEHAND_ROI_3D_TOOL] = {};
    toolStateManager[imageId][FREEHAND_ROI_3D_TOOL].data = [];
  } else if (!toolStateManager[imageId][FREEHAND_ROI_3D_TOOL]) {
    toolStateManager[imageId][FREEHAND_ROI_3D_TOOL] = {};
    toolStateManager[imageId][FREEHAND_ROI_3D_TOOL].data = [];
  }
};

/**
 * _polygonNotAlreadyPresent - Returns true if the polygon is already on
 *                             the image.
 *
 * @param  {object} freehandToolData The freehandToolData for an image.
 * @param  {string} newPolygonUuid   The uuid of the polygon being checked.
 * @returns {boolean} True if the polygon is not already on the image.
 */
const _isPolygonPresentInToolData = (freehandToolData, newPolygonUuid) => {
  // return freehandToolData.includes(
  //   toolData => toolData.uuid === newPolygonUuid
  // );

  for (let i = 0; i < freehandToolData.length; i++) {
    if (freehandToolData[i].uuid === newPolygonUuid) {
      return true;
    }
  }

  return false;
};

/**
 * refreshToolStateManager - restores the toolStateManager.
 *
 * @param  {object} toolStateManager The toolStateManager
 */
const refreshToolStateManager = toolStateManager => {
  globalToolStateManager.restoreToolState(toolStateManager);

  cornerstone.getEnabledElements().forEach(enabledElement => {
    const { element, viewport } = enabledElement;

    const showAnnotations = viewport.hasOwnProperty('showAnnotations')
      ? viewport.showAnnotations
      : true;

    if (!showAnnotations) {
      return;
    }

    const tool = getToolForElement(element, FREEHAND_ROI_3D_TOOL);

    if (tool.mode !== 'active' && tool.mode !== 'passive') {
      // If not already active or passive, set passive so contours render.
      setToolPassiveForElement(element, FREEHAND_ROI_3D_TOOL);
    }

    cornerstone.updateImage(element);
  });
};

export default addAllPolygonsToToolStateManager;
