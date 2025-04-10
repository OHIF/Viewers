import * as cornerstoneTools from '@cornerstonejs/tools';
import getSeriesInstanceUidFromImageId from './getSeriesInstanceUidFromImageId.js';
import { PEPPERMINT_TOOL_NAMES } from '../peppermint-tools/index.js';

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

const modules = cornerstoneTools.store.modules;
const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * Lock the ROIs defined by the shouldLockArray, such that they can no longer be edited.
 * And then move them to a new named structureSet, freeing up the working directory.
 *
 * @param {boolean[]} shouldLockArray A true/false array describing which ROIs
 *                                    have been locked.
 * @param {string} seriesInstanceUid  The UID of the series on which the ROIs
 *                                    reside.
 * @param {string} structureSetName   The name of the newly created
 *                                    structureSet.
 * @param {string} structureSetUid    The uid of the newly created structureSet.
 */
export default function(
  shouldLockArray,
  seriesInstanceUid,
  structureSetName,
  structureSetUid
) {
  const freehand3DStore = modules.freehand3D;
  const structureSet = freehand3DStore.getters.structureSet(seriesInstanceUid);

  const workingRoiCollection = structureSet.ROIContourCollection;
  const activeROIContourIndex = structureSet.activeROIContourIndex;

  const activeROIContour = freehand3DStore.getters.activeROIContour(
    seriesInstanceUid
  );

  let activeROIContourUid = activeROIContour ? activeROIContour.uid : null;

  // Create copies of ROIContours inside the new structureSet
  const newIndicies = [];

  freehand3DStore.setters.structureSet(seriesInstanceUid, structureSetName, {
    uid: structureSetUid,
    isLocked: true,
    expanded: true,
    activeColorTemplate: structureSet.activeColorTemplate,
  });

  let ROIContourIndex = 0;

  for (let i = 0; i < shouldLockArray.length; i++) {
    if (shouldLockArray[i]) {
      const oldROIContour = workingRoiCollection[i];

      freehand3DStore.setters.ROIContour(
        seriesInstanceUid,
        structureSetUid,
        oldROIContour.name,
        {
          uid: oldROIContour.uid,
          polygonCount: oldROIContour.polygonCount,
          color: oldROIContour.color,
          colorTemplates: oldROIContour.colorTemplates,
          meshProps: oldROIContour.meshProps,
          stats: oldROIContour.stats,
        }
      );

      newIndicies[i] = ROIContourIndex;
      ROIContourIndex++;
    }
  }

  // Cycle through slices and update ROIs references to the new volumes.
  const newStructureSet = freehand3DStore.getters.structureSet(
    seriesInstanceUid,
    structureSetUid
  );

  const toolStateManager = globalToolStateManager.saveToolState();

  Object.keys(toolStateManager).forEach(elementId => {
    // Only get polygons from this series
    if (getSeriesInstanceUidFromImageId(elementId) === seriesInstanceUid) {
      // grab the freehand tool for this DICOM instance

      if (
        toolStateManager &&
        toolStateManager[elementId] &&
        toolStateManager[elementId][FREEHAND_ROI_3D_TOOL]
      ) {
        const toolState = toolStateManager[elementId][FREEHAND_ROI_3D_TOOL];
        const toolData = toolState.data;
        // Append new ROIs to polygon list
        const exportData = {
          toolData,
          elementId,
          shouldLockArray,
          newIndicies,
          newStructureSet,
          structureSetName,
          seriesInstanceUid,
        };
        moveExportedPolygonsInInstance(exportData);
      }
    }
  });

  // Remove old working volumes.
  for (let i = shouldLockArray.length - 1; i >= 0; i--) {
    if (shouldLockArray[i]) {
      freehand3DStore.setters.deleteROIFromStructureSet(
        seriesInstanceUid,
        'DEFAULT',
        workingRoiCollection[i].uid
      );
    }
  }

  if (shouldLockArray[activeROIContourIndex]) {
    // If active volume has been exported, set active volume to null.
    structureSet.activeROIContourIndex = null;
  } else if (
    activeROIContourUid !== null &&
    activeROIContourUid !== undefined
  ) {
    // Make sure we are pointing to the right contour now.
    freehand3DStore.setters.activeROIContour(
      seriesInstanceUid,
      'DEFAULT',
      activeROIContourUid
    );
  }

  // reset working collection name
  structureSet.name = '_';
}

/**
 * Moves the ROIs defined by the seriesInstanceUid, roiCollectionName
 * and shouldLockArray from the working directory to a new named roiCollection.
 *
 * @param  {Object} exportData  An object containing the required information
 *                              to execute the move opperation.
 */
function moveExportedPolygonsInInstance(exportData) {
  const freehand3DStore = modules.freehand3D;

  const {
    toolData,
    elementId,
    shouldLockArray,
    newIndicies,
    newStructureSet,
    structureSetName,
    seriesInstanceUid,
  } = exportData;

  for (let i = 0; i < toolData.length; i++) {
    const data = toolData[i];

    const ROIContourIndex = freehand3DStore.getters.ROIContourIndex(
      data.seriesInstanceUid,
      data.structureSetUid,
      data.ROIContourUid
    );
    const structureSetUid = data.structureSetUid;

    // Check to see if the volume referencing this contour is eligable for export.
    if (structureSetUid === 'DEFAULT' && shouldLockArray[ROIContourIndex]) {
      const newROIContourIndex = newIndicies[ROIContourIndex];

      data.structureSetUid = newStructureSet.uid;
      data.referencedStructureSet = newStructureSet;
      data.referencedROIContour =
        newStructureSet.ROIContourCollection[newROIContourIndex];
    }
  }
}
