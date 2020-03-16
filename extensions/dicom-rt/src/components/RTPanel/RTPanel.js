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
  const DEFAULT_SET_INDEX = 0;
  const [showSettings, setShowSettings] = useState(false);

  const [contours, setContours] = useState([]);
  const [selectedContour, setSelectedContour] = useState(null);

  const [structureSets, setStructureSets] = useState([]);
  const [selectedStructureSet, setSelectedStructureSet] = useState(null);

  useEffect(() => {
    const module = cornerstoneTools.getModule('rtstruct');
    const sets = module.state.StructureSets;
    if (sets && sets.length) {
      const defaultSet = sets[DEFAULT_SET_INDEX];
      setSelectedStructureSet(defaultSet);
      setContours(defaultSet.ROIContours);
      setStructureSets(sets);
    }
  }, [studies, viewports, activeIndex]);

  const PanelSection = ({
    title,
    children,
    visible = false,
    expanded = false,
    onVisibilityChange = () => { }
  }) => {
    const [isExpanded, setIsExpanded] = useState(expanded);
    const [isVisible, setIsVisible] = useState(visible);
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
            className={`eye-icon ${isVisible && 'expanded'}`}
            name="eye"
            width="20px"
            height="20px"
            onClick={() => {
              const newVisibility = !isVisible;
              setIsVisible(newVisibility);
              onVisibilityChange(newVisibility);
            }}
          />
          <Icon
            className={`angle-double-${isExpanded ? 'down' : 'up'} ${isExpanded && 'expanded'}`}
            name={`angle-double-${isExpanded ? 'down' : 'up'}`}
            width="20px"
            height="20px"
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
        {children}
      </div>
    );
  };

  const toContourItem = ({ ROINumber, ROIName, RTROIObservations, colorArray, visible }) => {
    let interpretedType = '';
    if (RTROIObservations && RTROIObservations.RTROIInterpretedType) {
      interpretedType = `(${RTROIObservations.RTROIInterpretedType})`;
    }

    const isSameContour = selectedContour ? (selectedContour.ROINumber === ROINumber) : false;
    return (
      <StructureSetItem
        key={ROINumber}
        itemClass={`structure-set-item ${isSameContour && 'selected'}`}
        onClick={() => { }}
        label={`${ROIName} ${interpretedType}`}
        index={ROINumber}
        color={colorArray}
        itemVisibility={visible}
        onItemVisibilityCLick={() => {
          const module = cornerstoneTools.getModule('rtstruct');
          module.setters.toggleROIContour(selectedStructureSet.SeriesInstanceUID, ROINumber);
        }}
      />
    );
  };

  const configurationChangeHandler = newConfiguration => {
    const module = cornerstoneTools.getModule('rtstruct');
    module.configuration.lineWidth = newConfiguration.lineWidth;
    module.configuration.opacity = newConfiguration.opacity;
    refreshViewport();
  };

  if (showSettings) {
    const module = cornerstoneTools.getModule('rtstruct');
    return (
      <RTPanelSettings
        configuration={module.configuration}
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
      {structureSets.map(({ StructureSetLabel, SeriesInstanceUID, visible }) => {
        return (
          <PanelSection
            title={StructureSetLabel}
            visible={visible}
            expanded={selectedStructureSet.SeriesInstanceUID === SeriesInstanceUID}
            onVisibilityChange={() => {
              const module = cornerstoneTools.getModule('rtstruct');
              module.setters.toggleStructureSet(selectedStructureSet.SeriesInstanceUID);
            }}
          >
            <ScrollableArea>
              <TableList headless>
                {contours.map(toContourItem)}
              </TableList>
            </ScrollableArea>
          </PanelSection>
        );
      })}
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
