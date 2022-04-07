import cornerstone from 'cornerstone-core';
import getImageIdOfCenterFrameOfROIContour from './lib/getImageIdOfCenterFrameOfROIContour';
import structureSetReferencesSeriesInstanceUid from './lib/structureSetReferencesSeriesInstanceUid';

// We should put this as a helper somewhere as we are using it in mutliple places.
function refreshViewport() {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    if (enabledElement.image) {
      cornerstone.updateImage(enabledElement.element);
    }
  });
}

const configuration = {
  lineWidth: 3,
  opacity: 0.75,
  highlightOpacity: 0.5,
};

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
    structureSet => structureSet.SeriesInstanceUID === SeriesInstanceUID
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
function setShowStructureSet(SeriesInstanceUID) {
  _setStructureSetVisible(SeriesInstanceUID, true);
}

/**
 * Sets the visibility of the StructureSet.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {boolean} visible Whether the StructureSet should visible or not.
 */
function _setStructureSetVisible(SeriesInstanceUID, visible = true) {
  const StructureSet = getStructureSet(SeriesInstanceUID);

  if (StructureSet) {
    StructureSet.ROIContours.forEach(ROIContour => {
      ROIContour.visible = visible;
    });

    refreshViewport();
  }
}

/**
 * Toggles the visibility of the StructureSet.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 */
function setToggleStructureSet(SeriesInstanceUID) {
  const StructureSet = getStructureSet(SeriesInstanceUID);

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
function setHideROIContour(SeriesInstanceUID, ROINumber) {
  _setROIContourVisible(SeriesInstanceUID, ROINumber, false);
}

/**
 * Shows the ROIContour.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {number} ROINumber The ROINUmber of the ROIContour.
 */
function setShowROIContour(SeriesInstanceUID, ROINumber) {
  _setROIContourVisible(SeriesInstanceUID, ROINumber, true);
}

/**
 * Sets the visibility of the ROIContour.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID of the StructureSet.
 * @param {number} ROINumber The ROINUmber of the ROIContour.
 * @param {boolean} visible Whether the StructureSet should visible or not.
 */
function _setROIContourVisible(SeriesInstanceUID, ROINumber, visible = true) {
  const ROIContour = getROIContour(SeriesInstanceUID, ROINumber);

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
function setToggleROIContour(SeriesInstanceUID, ROINumber) {
  const ROIContour = getROIContour(SeriesInstanceUID, ROINumber);

  if (ROIContour) {
    ROIContour.visible = !ROIContour.visible;

    refreshViewport();
  }
}

/**
 * Returns an array of StructureSets which reference the given SeriesInstanceUID.
 * @param {string} SeriesInstanceUID The SeriesInstanceUID to check.
 */
function getStructuresSetsWhichReferenceSeriesInstanceUid(SeriesInstanceUID) {
  const { StructureSets } = state;
  return StructureSets.filter(StructureSet =>
    structureSetReferencesSeriesInstanceUid(StructureSet, SeriesInstanceUID)
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
  configuration,
};
