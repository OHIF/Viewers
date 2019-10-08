import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import './PluginSwitch.css';

class PluginSwitch extends Component {
  static propTypes = {
    mpr: PropTypes.func,
    activeContexts: PropTypes.arrayOf(PropTypes.string).isRequired,
    activeViewportIndex: PropTypes.number,
    viewportSpecificData: PropTypes.object,
    studies: PropTypes.array,
  };

  static defaultProps = {};

  render() {
    return (
      <>
        {_shouldRenderMpr2DButton.call(this) && (
          <div className="PluginSwitch">
            <ToolbarButton
              label="2D MPR"
              icon="cube"
              onClick={this.props.mpr}
            />
          </div>
        )}
      </>
    );
  }
}

function _shouldRenderMpr2DButton() {
  const { viewportSpecificData, studies, activeViewportIndex } = this.props;

  if (!viewportSpecificData[0]) {
    return;
  }

  const { displaySetInstanceUid, studyInstanceUid } = viewportSpecificData[
    activeViewportIndex
  ];

  const displaySet = _getDisplaySet(
    studies,
    studyInstanceUid,
    displaySetInstanceUid
  );

  if (!displaySet) {
    return;
  }

  return displaySet.isReconstructable;
}

function _getDisplaySet(studies, studyInstanceUid, displaySetInstanceUid) {
  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );

  if (!study) {
    return;
  }

  const displaySet = study.displaySets.find(set => {
    return set.displaySetInstanceUid === displaySetInstanceUid;
  });

  return displaySet;
}

export default PluginSwitch;
