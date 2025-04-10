import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import showModal from '../common/showModal';
import StackBrowserModal from './StackBrowserModal';

const XNATViewportMenuStackSwitch = props => {
  const {
    stackData,
    updateViewportStackData,
    closeViewportMenu,
    viewportIndex,
    setViewportActive,
  } = props;
  const { viewportActiveStackInfo, stackInfoTree } = stackData;
  const selectedStackInfo = viewportActiveStackInfo[viewportIndex];

  const onSetStackActive = displaySetInstanceUID => {
    if (
      !displaySetInstanceUID ||
      selectedStackInfo.value === displaySetInstanceUID
    ) {
      return;
    }

    const displaySet = stackData.getStackDisplaySet({ displaySetInstanceUID });

    if (!displaySet) {
      return;
    }

    // Set selected stack info
    stackData.updateViewportActiveStackInfo({
      viewportIndex,
      displaySetInstanceUID,
    });

    updateViewportStackData(displaySet);
  };

  const onShowStackBrowser = () => {
    setViewportActive(viewportIndex);
    showModal(
      StackBrowserModal,
      {
        selectedStackValue: selectedStackInfo.value,
        stackInfoTree,
        onSetStackActive,
      },
      'Stack Browser'
    );
    closeViewportMenu();
  };

  return (
    <li className="ViewportMenuRow" onClick={onShowStackBrowser}>
      <div className="ViewportMenuIcon">
        <Icon name="xnat-stack" />
      </div>
      <div className="ViewportMenuLabel">{selectedStackInfo.label}</div>
      <div className="ViewportMenuIcon ActionIcon">
        <Icon name="angle-left" style={{ transform: 'rotate(180deg)' }} />
      </div>
    </li>
  );
};

XNATViewportMenuStackSwitch.propTypes = {
  stackData: PropTypes.object.isRequired,
  updateViewportStackData: PropTypes.func.isRequired,
  closeViewportMenu: PropTypes.func.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  setViewportActive: PropTypes.func.isRequired,
};

XNATViewportMenuStackSwitch.defaultProps = {};

export default XNATViewportMenuStackSwitch;
