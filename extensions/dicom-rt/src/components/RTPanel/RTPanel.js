import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

import { utils, log } from '@ohif/core';
import { ScrollableArea, TableList, Icon } from '@ohif/ui';

import './RTPanel.css';
import StructureSetItem from '../StructureSetItem/StructureSetItem';
import RTPanelSettings from '../RTSettings/RTSettings';

const refreshViewport = () => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
};

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
  const [structureSets, setStructureSets] = useState([1, 2, 3]);
  const [selectedStructureSet, setSelectedStructureSet] = useState();

  const rtstructModule = cornerstoneTools.getModule('rtstruct');
  console.log(rtstructModule.state);

  const PanelSection = ({ title, children }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <div
        className="panel-section"
        style={{
          marginBottom: isExpanded ? 0 : 2,
          height: isExpanded ? '100%' : 'unset'
        }}
      >
        <div className="header">
          <div>{title}</div>
          <Icon
            className={`eye-icon ${isExpanded && 'expanded'}`}
            name="eye"
            width="20px"
            height="20px"
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
        {children}
      </div>
    );
  };

  const toStructureSetItem = structureSet => {
    const sameStructureSet = selectedStructureSet === 'id of structure set';
    return (
      <StructureSetItem
        key={1}
        itemClass={`structure-set-item ${sameStructureSet && 'selected'}`}
        onClick={() => setSelectedStructureSet(0)}
        label={'test'}
        index={1}
        color={[221, 85, 85, 1]}
      />
    );
  };

  const configurationChangeHandler = newConfiguration => {
    rtstructModule.configuration.lineWidth = newConfiguration.lineWidth;
    rtstructModule.configuration.opacity = newConfiguration.opacity;
    refreshViewport();
  };

  if (showSettings) {
    return (
      <RTPanelSettings
        configuration={rtstructModule.configuration}
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
      <PanelSection title="My Structure Set">
        <ScrollableArea>
          <TableList headless>
            {structureSets.map(toStructureSetItem)}
          </TableList>
        </ScrollableArea>
      </PanelSection>
      <PanelSection title="Other Sets">
        <ScrollableArea>
          <TableList headless>
            {structureSets.map(toStructureSetItem)}
          </TableList>
        </ScrollableArea>
      </PanelSection>
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
