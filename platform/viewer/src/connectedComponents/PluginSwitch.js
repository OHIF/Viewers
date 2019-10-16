import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import './PluginSwitch.css';

class PluginSwitch extends Component {
  static propTypes = {
    mpr: PropTypes.func,
    activeViewportIndex: PropTypes.number,
    viewportSpecificData: PropTypes.object,
    studies: PropTypes.array,
    exitMpr: PropTypes.func,
  };

  static defaultProps = {};
  constructor(props) {
    super(props);
    this.state = {
      isPlugSwitchOn: false,
      label: '2D MPR',
      icon: 'cube',
    };
  }

  handleClick = () => {
    if (this.state.isPlugSwitchOn) {
      this.setState({
        isPlugSwitchOn: false,
        label: '2D MPR',
        icon: 'cube',
      });
      this.props.exitMpr();
    } else {
      this.setState({
        isPlugSwitchOn: true,
        label: 'Exit 2D MPR',
        icon: 'times',
      });
      this.props.mpr();
    }
  };

  render() {
    const { label, icon } = this.state;

    // Render exit mpr if switched on, otherwise check if mpr button should be displayed.
    const shouldRender =
      this.state.isPlugSwitchOn || _shouldRenderMpr2DButton.call(this);

    return (
      <>
        {shouldRender && (
          <div className="PluginSwitch">
            <ToolbarButton
              label={label}
              icon={icon}
              onClick={this.handleClick}
            />
          </div>
        )}
      </>
    );
  }
}

function _shouldRenderMpr2DButton() {
  const { viewportSpecificData, studies, activeViewportIndex } = this.props;

  if (!viewportSpecificData[activeViewportIndex]) {
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
