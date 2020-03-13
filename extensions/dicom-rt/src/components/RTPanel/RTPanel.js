import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

import { utils, log } from '@ohif/core';
import { ScrollableArea, TableList, Icon } from '@ohif/ui';

import './RTPanel.css';
import RTPanelSettings from '../RTSettings/RTSettings';

/**
 * RTPanel component
 *
 * @param {Object} props
 * @param {Array} props.studies
 * @param {Array} props.viewports - viewportSpecificData
 * @param {number} props.activeIndex - activeViewportIndex
 * @returns component
 */
const RTPanel = ({ studies, viewports, activeIndex, isOpen }) => {
  const [showSettings, setShowSettings] = useState(false);
  const configuration = cornerstoneTools.getModule('rtstruct').configuration;

  const PanelSection = ({ title }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <div
        className="panel-section"
        style={{ marginBottom: isExpanded ? 0 : 10 }}
      >
        <div className="header">
          <p>{title}</p>
          <Icon
            className="eye-icon"
            name="eye"
            width="20px"
            height="20px"
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </div>
    );
  };

  const configurationChangeHandler = newConfiguration => {
    configuration.lineWidth = newConfiguration.lineWidth;
    configuration.opacity = newConfiguration.opacity;
  };

  if (showSettings) {
    return (
      <RTPanelSettings
        configuration={configuration}
        onBack={() => setShowSettings(false)}
        onChange={configurationChangeHandler}
      />
    );
  }

  return (
    <div className="dcmrt-panel">
      <div className="dcmrt-panel-header">
        <h3>RT Structure Sets</h3>
        <Icon
          className="cog-icon"
          name="cog"
          width="25px"
          height="25px"
          onClick={() => setShowSettings(true)}
        />
      </div>
      <PanelSection title="My Structure Set" />
      <PanelSection title="Other Sets" />
    </div>
  );
};

RTPanel.propTypes = {
  viewports: PropTypes.shape({
    displaySetInstanceUID: PropTypes.string,
    frameRate: PropTypes.any,
    InstanceNumber: PropTypes.number,
    isMultiFrame: PropTypes.bool,
    isReconstructable: PropTypes.bool,
    Modality: PropTypes.string,
    plugin: PropTypes.string,
    SeriesDate: PropTypes.string,
    SeriesDescription: PropTypes.string,
    SeriesInstanceUID: PropTypes.string,
    SeriesNumber: PropTypes.any,
    SeriesTime: PropTypes.string,
    sopClassUIDs: PropTypes.arrayOf(PropTypes.string),
    StudyInstanceUID: PropTypes.string,
  }),
  activeIndex: PropTypes.number.isRequired,
  studies: PropTypes.array.isRequired,
  isOpen: PropTypes.bool.isRequired,
};
RTPanel.defaultProps = {};

export default RTPanel;
