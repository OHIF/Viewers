import cornerstone from 'cornerstone-core';
import getImageIdOfCenterFrameOfROIContour from './lib/getImageIdOfCenterFrameOfROIContour';
import structureSetReferencesSeriesInstanceUid from './lib/structureSetReferencesSeriesInstanceUid';

// We should put this as a helper somewhere as we are using it in mutliple places.
function refreshViewport() {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
}

const state = {
  StructureSets: [],
};

/**
 * Adds a structure set to the module.
 * @param {Object} structureSetData The structure set data.
 */
function setStructureSet(structureSetData) {
  state.StructureSets.push(structureSetData);
}

/**
 * Returns the StructureSet with the given SeriesInstanceUID.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 *
 * @returns {Object} The StructureSet.
 */
function getStructureSet(SeriesInstanceUID) {
  return state.StructureSets.find(
    structureSet => structureSet.seriesInstanceUid === SeriesInstanceUID
  );
}

/**
 * Returns the ROI Contour with the given ROINumber on the StructureSet defined by the given
 * SeriesInstanceUID.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {number} ROINumber The ROINUmber of the ROIContour to fetch.
 */
function getROIContour(SeriesInstanceUID, ROINumber) {
  const structureSet = getStructureSet(SeriesInstanceUID);

  if (!structureSet) {
    return;
  }

  return structureSet.ROIContours.find(
    ROIContour => ROIContour.ROINumber === ROINumber
  );
}

/**
 * Hides the StructureSet.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 */
function setHideStructureSet(SeriesInstanceUID) {
  _setStructureSetVisible(SeriesInstanceUID, false);
}

/**
 * Shows the StructureSet.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 */
function setShowStructureSet(seriesInstanceUid) {
  _setStructureSetVisible(seriesInstanceUid, true);
}

/**
 * Sets the visibility of the StructureSet.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {boolean} visible Whether the StructureSet should visible or not.
 */
function _setStructureSetVisible(seriesInstanceUid, visible = true) {
  const StructureSet = getStructureSet(seriesInstanceUid);

  if (StructureSet) {
    StructureSet.visible = visible;

    refreshViewport();
  }
}

/**
 * Toggles the visibility of the StructureSet.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 */
function setToggleStructureSet(seriesInstanceUid) {
  const StructureSet = getStructureSet(seriesInstanceUid);

  if (StructureSet) {
    StructureSet.visible = !StructureSet.visible;

    refreshViewport();
  }
}

/**
 * Hides the ROIContour.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {number} ROINumber The ROINUmber of the ROIContour.
 */
function setHideROIContour(seriesInstanceUid, ROINumber) {
  _setROIContourVisible(seriesInstanceUid, ROINumber, false);
}

/**
 * Shows the ROIContour.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {number} ROINumber The ROINUmber of the ROIContour.
 */
function setShowROIContour(seriesInstanceUid, ROINumber) {
  _setROIContourVisible(seriesInstanceUid, ROINumber, true);
}

/**
 * Sets the visibility of the ROIContour.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {number} ROINumber The ROINUmber of the ROIContour.
 * @param {boolean} visible Whether the StructureSet should visible or not.
 */
function _setROIContourVisible(seriesInstanceUid, ROINumber, visible = true) {
  const ROIContour = getROIContour(seriesInstanceUid, ROINumber);

  if (ROIContour) {
    ROIContour.visible = visible;

    refreshViewport();
  }
}

/**
 * Toggles the visibility of the ROIContour.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {number} ROINumber The ROINUmber of the ROIContour.
 */
function setToggleROIContour(seriesInstanceUid, ROINumber) {
  const ROIContour = getROIContour(seriesInstanceUid, ROINumber);

  if (ROIContour) {
    ROIContour.visible = !ROIContour.visible;

    refreshViewport();
  }
}

/**
 * Returns an array of StructureSets which reference the given SeriesInstanceUID.
 * @param {string} referencedSeriesInstanceUid The SeriesInstanceUID to check.
 */
function getStructuresSetsWhichReferenceSeriesInstanceUid(
  referencedSeriesInstanceUid
) {
  const { StructureSets } = state;

  return StructureSets.filter(structureSet =>
    structureSetReferencesSeriesInstanceUid(
      structureSet,
      referencedSeriesInstanceUid
    )
  );
}

export default {
  getters: {
    structureSet: getStructureSet,
    ROIContour: getROIContour,
    structuresSetsWhichReferenceSeriesInstanceUid: getStructuresSetsWhichReferenceSeriesInstanceUid,
    imageIdOfCenterFrameOfROIContour: getImageIdOfCenterFrameOfROIContour,
  },
  setters: {
    structureSet: setStructureSet,
    hideROIContour: setHideROIContour,
    showROIContour: setShowROIContour,
    toggleROIContour: setToggleROIContour,
    hideStructureSet: setHideStructureSet,
    showStructureSet: setShowStructureSet,
    toggleStructureSet: setToggleStructureSet,
  },
  state,
};
