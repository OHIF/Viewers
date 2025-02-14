import {
  store,
  globalImageIdSpecificToolStateManager,
} from '@cornerstonejs/tools';

import getSeriesInstanceUidFromImageId from './getSeriesInstanceUidFromImageId.js';
import { PEPPERMINT_TOOL_NAMES } from '../peppermint-tools/index.js';

const modules = store.modules;
const globalToolStateManager = globalImageIdSpecificToolStateManager;

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

/**
 * Unlock a structureSet, moving them to the working directory
 * so that they may be edited
 *
 * @param {string} seriesInstanceUid  The UID of the series on which the ROIs
 *                                    reside.
 * @param {string} structureSetUid    The uid of the newly created structureSet.
 */
export default function(seriesInstanceUid, structureSetUid) {
  const freehand3DStore = modules.freehand3D;
  const structureSet = freehand3DStore.getters.structureSet(
    seriesInstanceUid,
    structureSetUid
  );

  const ROIContourCollection = structureSet.ROIContourCollection;

  const workingStructureSet = freehand3DStore.getters.structureSet(
    seriesInstanceUid
  );

  // Create new ROIContours in the working directory.
  for (let i = 0; i < ROIContourCollection.length; i++) {
    const ROIContour = ROIContourCollection[i];

    freehand3DStore.setters.ROIContour(
      seriesInstanceUid,
      'DEFAULT',
      ROIContour.name,
      {
        uid: ROIContour.uid,
        polygonCount: ROIContour.polygonCount,
        color: ROIContour.color,
        colorTemplates: ROIContour.colorTemplates,
        meshProps: ROIContour.meshProps,
        stats: ROIContour.stats,
      }
    );
  }

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

        const filteredToolData = toolData.filter(
          data => data.structureSetUid === structureSetUid
        );

        // Process if the instance has contours belonging to the structure set
        if (filteredToolData.length > 0) {
          movePolygonsInInstance(workingStructureSet, toolData);
        }
      }
    }
  });

  // Remove named structureSet.
  freehand3DStore.setters.deleteStructureSet(
    seriesInstanceUid,
    structureSetUid
  );

  if (workingStructureSet.activeROIContourIndex === null) {
    workingStructureSet.activeROIContourIndex = 0;
  }
}

/**
 * Moves the ROIs defined by the seriesInstanceUid, roiCollectionName
 * and exportMask from the working directory to a new named roiCollection.
 *
 * @param workingStructureSet
 * @param toolData
 */
function movePolygonsInInstance(workingStructureSet, toolData) {
  for (let i = 0; i < toolData.length; i++) {
    const data = toolData[i];

    const referencedROIContour = workingStructureSet.ROIContourCollection.find(
      ROIContour => {
        return ROIContour && ROIContour.uid === data.ROIContourUid;
      }
    );
    if (!referencedROIContour) {
      continue;
    }

    data.structureSetUid = 'DEFAULT';
    data.referencedStructureSet = workingStructureSet;
    data.referencedROIContour = referencedROIContour;
  }
}
