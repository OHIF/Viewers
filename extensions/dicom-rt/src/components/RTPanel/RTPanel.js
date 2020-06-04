import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';

import { ScrollableArea, TableList, Icon } from '@ohif/ui';

import { utils } from '@ohif/core';

import './RTPanel.css';
import StructureSetItem from '../StructureSetItem/StructureSetItem';
import RTPanelSettings from '../RTSettings/RTSettings';
import PanelSection from '../PanelSection/PanelSection';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';

const { studyMetadataManager } = utils;

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
  const [selectedContour, setSelectedContour] = useState();
  const DEFAULT_SET_INDEX = 0;
  const DEFAULT_STATE = {
    referencedDisplaysets: [],
    sets: [],
    selectedSet: null,
  };

  const [state, setState] = useState(DEFAULT_STATE);
  const [showSettings, setShowSettings] = useState(false);
  const activeViewport = viewports[activeIndex];

  /*
   * TODO: Improve the way we notify parts of the app that depends on rts to be loaded.
   *
   * Currently we are using a non-ideal implementation through a custom event to notify the rtstruct panel
   * or other components that could rely on loaded rtstructs that
   * the first batch of structs were loaded so that e.g. when the user opens the panel
   * before the structs are fully loaded, the panel can subscribe to this custom event
   * and update itself with the new structs.
   *
   * This limitation is due to the fact that the rtmodule is an object (which will be
   * updated after the structs are loaded) that React its not aware of its changes
   * because the module object its not passed in to the panel component as prop but accessed externally.
   *
   * Improving this event approach to something reactive that can be tracked inside the react lifecycle,
   * allows us to easily watch the module or the rtstruct loading process in any other component
   * without subscribing to external events.
   */
  useEffect(() => {
    document.addEventListener('extensiondicomrtrtloaded', updateStructureSets);

    return () => {
      document.removeEventListener('extensiondicomrtrtloaded', updateStructureSets);
    };
  }, []);

  const updateStructureSets = () => {
    const module = cornerstoneTools.getModule('rtstruct');
    const StructureSets = module.state.StructureSets;

    if (StructureSets && StructureSets.length) {
      const viewportSets = module.getters.structuresSetsWhichReferenceSeriesInstanceUid(
        activeViewport.SeriesInstanceUID
      );

      const studyMetadata = studyMetadataManager.get(activeViewport.StudyInstanceUID);
      const referencedDisplaysets = studyMetadata.getDerivedDatasets({
        referencedSeriesInstanceUID: activeViewport.SeriesInstanceUID,
        Modality: 'RTSTRUCT',
      });

      if (viewportSets.length) {
        const defaultSet = viewportSets[DEFAULT_SET_INDEX];
        setState({
          referencedDisplaysets,
          selectedSet: defaultSet,
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

  const toContourItem = ({ ROINumber, ROIName, RTROIObservations, colorArray, visible }, loadedSet) => {
    let interpretedType = '';
    if (RTROIObservations && RTROIObservations.RTROIInterpretedType) {
      interpretedType = `(${RTROIObservations.RTROIInterpretedType})`;
    }

    const isSameContour = selectedContour && selectedContour === ROINumber;
    return (
      <StructureSetItem
        key={ROINumber}
        selected={isSameContour}
        onClick={() => {
          setSelectedContour(isSameContour ? null : ROINumber);

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
      {!state.referencedDisplaysets.length && <LoadingIndicator expand height="70px" width="70px" />}
      {state.sets && state.referencedDisplaysets.map(displaySet => {
        const { SeriesInstanceUID, metadata, isLoaded } = displaySet;

        const module = cornerstoneTools.getModule('rtstruct');
        const sets = module.getters.structuresSetsWhichReferenceSeriesInstanceUid(viewports[activeIndex].SeriesInstanceUID);

        const loadedSet = sets.find(set => set.SeriesInstanceUID === SeriesInstanceUID);
        return (
          <PanelSection
            key={SeriesInstanceUID}
            title={metadata.StructureSetLabel}
            loading={!isLoaded || !loadedSet}
            visible={isLoaded && loadedSet.visible}
            hideVisibleButton={!isLoaded}
            expanded={isLoaded && loadedSet.SeriesInstanceUID === state.selectedSet.SeriesInstanceUID}
            onVisibilityChange={newVisibility => {
              const module = cornerstoneTools.getModule('rtstruct');
              loadedSet.ROIContours.forEach(({ ROINumber }) => {
                module.setters.toggleROIContour(loadedSet.SeriesInstanceUID, ROINumber);
              });
              const sets = module.getters.structuresSetsWhichReferenceSeriesInstanceUid(viewports[activeIndex].SeriesInstanceUID);
              setState(state => ({ ...state, sets }));
              refreshViewport();
            }}
            onExpandChange={async () => {
              if (!isLoaded) {
                await displaySet.load(viewports[activeIndex], studies);
                const module = cornerstoneTools.getModule('rtstruct');
                const sets = module.getters.structuresSetsWhichReferenceSeriesInstanceUid(viewports[activeIndex].SeriesInstanceUID);
                const selectedSet = sets.find(set => set.SeriesInstanceUID === SeriesInstanceUID);
                setState(state => ({ ...state, selectedSet, sets }));
              }
            }}
          >
            <ScrollableArea>
              <TableList headless>
                {isLoaded && loadedSet.ROIContours.map(c => toContourItem(c, loadedSet))}
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
