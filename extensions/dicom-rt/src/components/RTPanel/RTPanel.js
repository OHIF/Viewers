import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

import { utils, redux } from '@ohif/core';
import { ScrollableArea, TableList, Icon } from '@ohif/ui';

const { studyMetadataManager } = utils;
const { setViewportSpecificData } = redux.actions;

import './RTPanel.css';
import StructureSetItem from '../StructureSetItem/StructureSetItem';
import RTPanelSettings from '../RTSettings/RTSettings';
import PanelSection from '../PanelSection/PanelSection';

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
 * @param {number} props.isOpen - isOpen
 * @returns component
 */
const RTPanel = ({ studies, viewports, activeIndex, isOpen, onContourItemClick }) => {
  const DEFAULT_SET_INDEX = 0;
  const DEFAULT_STATE = {
    sets: [],
    contours: [],
    selectedSet: null,
    selectedContour: null,
  };

  const [state, setState] = useState(DEFAULT_STATE);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    document.addEventListener('rtloaded', updateStructureSets);

    return () => {
      document.removeEventListener('rtloaded', updateStructureSets);
    };
  }, []);

  const updateStructureSets = () => {
    const module = cornerstoneTools.getModule('rtstruct');
    const StructureSets = module.state.StructureSets;

    if (StructureSets && StructureSets.length) {
      const viewportSets = module.getters.structuresSetsWhichReferenceSeriesInstanceUid(
        viewports[activeIndex].SeriesInstanceUID
      );

      if (viewportSets.length) {
        const defaultSet = viewportSets[DEFAULT_SET_INDEX];
        setState({
          selectedSet: defaultSet,
          contours: defaultSet.ROIContours,
          sets: viewportSets
        });
      } else {
        setState(DEFAULT_STATE);
      }
    }
  };

  useEffect(() => {
    updateStructureSets();
  }, [studies, viewports, activeIndex]);

  useEffect(() => {
    setShowSettings(showSettings && !isOpen);
  }, [isOpen]);

  const toContourItem = ({ ROINumber, ROIName, RTROIObservations, colorArray, visible }) => {
    let interpretedType = '';
    if (RTROIObservations && RTROIObservations.RTROIInterpretedType) {
      interpretedType = `(${RTROIObservations.RTROIInterpretedType})`;
    }

    const isSameContour = state.selectedContour && state.selectedContour === ROINumber;
    return (
      <StructureSetItem
        key={ROINumber}
        selected={isSameContour}
        onClick={() => {
          setState(state => ({ ...state, selectedContour: isSameContour ? null : ROINumber }));

          const enabledElements = cornerstone.getEnabledElements();
          const element = enabledElements[activeIndex].element;
          const toolState = cornerstoneTools.getToolState(element, 'stack');

          if (!toolState) {
            return;
          }

          const imageIds = toolState.data[0].imageIds;

          const module = cornerstoneTools.getModule('rtstruct');
          const imageId = module.getters.imageIdOfCenterFrameOfROIContour(
            state.selectedSet.SeriesInstanceUID,
            ROINumber,
            imageIds
          );

          const frameIndex = imageIds.indexOf(imageId);
          const SOPInstanceUID = cornerstone.metaData.get('SOPInstanceUID', imageId);
          const StudyInstanceUID = cornerstone.metaData.get('StudyInstanceUID', imageId);

          onContourItemClick({
            StudyInstanceUID,
            SOPInstanceUID,
            frameIndex,
            activeViewportIndex: activeIndex
          });
        }}
        label={`${ROIName} ${interpretedType}`}
        index={ROINumber}
        color={colorArray}
        visible={visible}
        onVisibilityChange={() => {
          const module = cornerstoneTools.getModule('rtstruct');
          module.setters.toggleROIContour(state.selectedSet.SeriesInstanceUID, ROINumber);
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
      {state.sets.map(({ StructureSetLabel, SeriesInstanceUID, visible }) => {
        return (
          <PanelSection
            key={SeriesInstanceUID}
            title={StructureSetLabel}
            visible={visible}
            expanded={state.selectedSet.SeriesInstanceUID === SeriesInstanceUID}
            onVisibilityChange={() => {
              const module = cornerstoneTools.getModule('rtstruct');
              module.setters.toggleStructureSet(state.selectedSet.SeriesInstanceUID);
            }}
          >
            <ScrollableArea>
              <TableList headless>
                {state.contours.map(toContourItem)}
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
