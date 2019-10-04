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
  const { viewportSpecificData, activeContexts, studies } = this.props;

  if (!viewportSpecificData[0]) {
    return false;
  }

  // Can only construct data which is displayed in these types of viewports.
  const appropriateViewport =
    activeContexts.includes('ACTIVE_VIEWPORT::CORNERSTONE') ||
    activeContexts.includes('ACTIVE_VIEWPORT::VTK');

  if (!appropriateViewport) {
    return false;
  }

  const { displaySetInstanceUid, studyInstanceUid } = viewportSpecificData[0];

  const displaySet = _getDisplaySet(
    studies,
    studyInstanceUid,
    displaySetInstanceUid
  );

  debugger;

  if (!displaySet) {
    return false;
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
