import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import showModal from '../common/showModal';
import DisplaySetGroupBrowserModal from './DisplaySetGroupBrowserModal';

const XNATViewportMenuDisplaySetSwitch = props => {
  const {
    subDisplaySetGroupData: groupData,
    viewportIndex,
    updateViewportStackData,
    closeViewportMenu,
    setViewportActive,
  } = props;
  const selectedDisplaySetInfo = groupData.getViewportDisplaySetInfo(viewportIndex);

  const onSetDisplaySetActive = displaySetInstanceUID => {
    if (
      !displaySetInstanceUID ||
      selectedDisplaySetInfo.uid === displaySetInstanceUID
    ) {
      return;
    }

    const displaySet = groupData.getDisplaySet({ displaySetInstanceUID });

    if (!displaySet) {
      return;
    }

    // Set selected stack info
    groupData.updateViewportDisplaySet({
      viewportIndex,
      displaySetInstanceUID,
    });

    updateViewportStackData(displaySet);
  };

  const onShowDisplaySetGroupBrowser = () => {
    setViewportActive(viewportIndex);
    showModal(
      DisplaySetGroupBrowserModal,
      {
        selectedDisplaySetUID: selectedDisplaySetInfo.uid,
        displaySetInfoList: groupData.displaySetInfoList,
        onSetDisplaySetActive,
      },
      'Scan Instance Browser'
    );
    closeViewportMenu();
  };

  return (
    <li className="ViewportMenuRow" onClick={onShowDisplaySetGroupBrowser}>
      <div className="ViewportMenuIcon">
        <Icon name="xnat-scan-group" />
      </div>
      <div className="ViewportMenuLabel">{selectedDisplaySetInfo.label}</div>
      <div className="ViewportMenuIcon ActionIcon">
        <Icon name="angle-left" style={{ transform: 'rotate(180deg)' }} />
      </div>
    </li>
  );
};

XNATViewportMenuDisplaySetSwitch.propTypes = {
  subDisplaySetGroupData: PropTypes.object.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  updateViewportStackData: PropTypes.func.isRequired,
  closeViewportMenu: PropTypes.func.isRequired,
  setViewportActive: PropTypes.func.isRequired,
};

XNATViewportMenuDisplaySetSwitch.defaultProps = {};

export default XNATViewportMenuDisplaySetSwitch;
