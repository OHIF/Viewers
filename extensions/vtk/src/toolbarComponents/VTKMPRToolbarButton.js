import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

let isVisible = true;

const _isDisplaySetReconstructable = (viewportSpecificData = {}, activeViewportIndex) => {
  if (!viewportSpecificData[activeViewportIndex]) {
    return false;
  };

  const { displaySetInstanceUID, StudyInstanceUID } = viewportSpecificData[
    activeViewportIndex
  ];

  const studies = studyMetadataManager.all();

  const study = studies.find(
    study => study.studyInstanceUID === StudyInstanceUID
  );

  if (!study) {
    return false;
  }

  const displaySet = study._displaySets.find(set => set.displaySetInstanceUID === displaySetInstanceUID);

  if (!displaySet) {
    return false;
  }

  // 2D MPR is not currently available for 4D datasets.

  // Assuming that slices at different time have the same position, here we just check if
  // there are multiple slices for the same ImagePositionPatient and disable MPR.

  // A better heuristic would be checking 4D tags, e.g. the presence of multiple TemporalPositionIdentifier values.
  // However, some studies (e.g. https://github.com/OHIF/Viewers/issues/2113) do not have such tags.

  for (let ii = 0; ii < displaySet.numImageFrames; ++ii) {
    const image = displaySet.images[ii];
    if (!image) continue;

    const imageIdControl = image.getImageId()
    const instanceMetadataControl = cornerstone.metaData.get('instance', imageIdControl)

    if (!instanceMetadataControl ||
      instanceMetadataControl === undefined ||
      !instanceMetadataControl.ImagePositionPatient ||
      instanceMetadataControl.ImagePositionPatient === undefined) {
      // if ImagePositionPatient is missing, skip the 4D datasets check.
      // do not return false, because it could be a 3D dataset.
      continue;
    }

    let xImagePositionPatientControl = instanceMetadataControl.ImagePositionPatient[0];
    let yImagePositionPatientControl = instanceMetadataControl.ImagePositionPatient[1];
    let zImagePositionPatientControl = instanceMetadataControl.ImagePositionPatient[2];

    for (let jj = ii + 1; jj < displaySet.numImageFrames; ++jj) {
      const image = displaySet.images[jj];
      if (!image) continue;

      const imageId = image.getImageId()
      const instanceMetadata = cornerstone.metaData.get('instance', imageId)

      if (!instanceMetadata ||
        instanceMetadata === undefined ||
        !instanceMetadata.ImagePositionPatient ||
        instanceMetadata.ImagePositionPatient === undefined) {
        // if ImagePositionPatient is missing, skip the 4D datasets check.
        // do not return false, because it could be a 3D dataset.
        continue;
      }

      let xImagePositionPatient = instanceMetadata.ImagePositionPatient[0];
      let yImagePositionPatient = instanceMetadata.ImagePositionPatient[1];
      let zImagePositionPatient = instanceMetadata.ImagePositionPatient[2];

      if (xImagePositionPatientControl === xImagePositionPatient &&
        yImagePositionPatientControl === yImagePositionPatient &&
        zImagePositionPatientControl === zImagePositionPatient) {
        return false;
      }
    }
  }

  return displaySet.isReconstructable;
};

function VTKMPRToolbarButton({
  parentContext,
  toolbarClickCallback,
  button,
  activeButtons,
  isActive,
  className,
}) {
  const { id, label, icon } = button;
  const { viewportSpecificData, activeViewportIndex } = useSelector(state => {
    const { viewports = {} } = state;
    const { viewportSpecificData, activeViewportIndex } = viewports;

    return {
      viewportSpecificData,
      activeViewportIndex,
    }
  });

  isVisible = _isDisplaySetReconstructable(
    viewportSpecificData,
    activeViewportIndex,
  );

  return (
    <React.Fragment>
      {isVisible && (
        <ToolbarButton
          key={id}
          label={label}
          icon={icon}
          onClick={evt => toolbarClickCallback(button, evt)}
          isActive={isActive}
        />
      )}
    </React.Fragment>
  );
}

VTKMPRToolbarButton.propTypes = {
  parentContext: PropTypes.object.isRequired,
  toolbarClickCallback: PropTypes.func.isRequired,
  button: PropTypes.object.isRequired,
  activeButtons: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  className: PropTypes.string,
};

export default VTKMPRToolbarButton;
