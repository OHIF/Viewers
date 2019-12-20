import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';

let isVisible = true;

const _isDisplaySetReconstructable = (studies, viewportSpecificData = {}, activeViewportIndex) => {
  if (!viewportSpecificData[activeViewportIndex]) {
    return false;
  };

  const { displaySetInstanceUid, studyInstanceUid } = viewportSpecificData[
    activeViewportIndex
  ];


  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );

  if (!study) {
    return false;
  }

  const displaySet = study.displaySets.find(set => {
    return set.displaySetInstanceUid === displaySetInstanceUid;
  });

  if (!displaySet) {
    return false;
  };

  return displaySet.isReconstructable;
};

function VTKMPRToolbarComponent({
  parentContext,
  toolbarClickCallback,
  button,
  activeButtons,
  isActive,
  className,
  extensionManager,
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

  // TODO: Refactor this and find a better way to get current studies
  // Maybe use studyMeatadataManager?
  const { studies } = parentContext.props;

  const isDisplaySetReconstructable = _isDisplaySetReconstructable(
    studies,
    viewportSpecificData,
    activeViewportIndex,
  );
  const isVTKExtensionRegistered = extensionManager.registeredExtensionIds.includes('vtk');

  isVisible = isDisplaySetReconstructable && isVTKExtensionRegistered;


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

VTKMPRToolbarComponent.propTypes = {
  parentContext: PropTypes.object.isRequired,
  toolbarClickCallback: PropTypes.func.isRequired,
  button: PropTypes.object.isRequired,
  activeButtons: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  className: PropTypes.string,
  extensionManager: PropTypes.object,
};

export default VTKMPRToolbarComponent;
