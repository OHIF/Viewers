import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { utils, log } from '@ohif/core';
import {
  ScrollableArea,
  TableList,
  TableListItem,
  MeasurementTableItem,
  Icon,
  useModal,
} from '@ohif/ui';

import TimecourseModal from './timecourseModal/TimecourseContent';
import TOOL_NAMES from '../tools/toolNames';
import './MRUrographyPanel.css';

const globalImageIdSpecificToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

const refreshViewport = () => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
};

// TODO KINDERSPITAL this will be removed soon when task 9 is done
const mockPoints = new Array(100).fill(0).map((item, index) => {
  return [index * 10, Math.ceil(Math.random() * 10)];
});

const showTimecourseModal = uiModal => {
  if (uiModal) {
    uiModal.show({
      content: TimecourseModal,
      title: 'Evaluate Timecourse',
      contentProps: {
        timecourse: mockPoints,
        measurementId: 'mockMeasurentId',
        onClose: uiModal.hide,
      },
    });
  }
};

/**
 * SegmentationPanel component
 *
 * @param {Object} props
 * @param {Array} props.studies
 * @param {Array} props.viewports - viewportSpecificData
 * @param {number} props.activeIndex - activeViewportIndex
 * @returns component
 */
const MRUrographyPanel = ({ studies, viewports, activeIndex, isOpen }) => {
  const modal = useModal();

  const [state, setState] = useState({
    regionList: [],
    selectedKey: null,
  });

  const updateState = (field, value) => {
    setState(state => ({ ...state, [field]: value }));
  };

  useEffect(() => {
    updateState('regionList', getRegionList());
  }, [studies, viewports, activeIndex]);

  const onRelabelClick = event => {
    console.log(event);
    console.log('todo -> relabel');
  };

  const onDeleteClick = event => {
    console.log(event);
    console.log('todo -> delete');
  };

  const onEditDescriptionClick = event => {
    console.log(event);
    console.log('todo -> edit description');
  };

  const onItemClick = (event, measurementData) => {
    updateState('selectedKey', measurementData.measurementNumber);
  };

  const getRegionList = () => {
    console.log(viewports);

    const regionList = [];
    const selectedKey = 0;
    const toolState = globalImageIdSpecificToolStateManager.saveToolState();
    const toolName = TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL;

    const key = 0;

    Object.keys(toolState).forEach(imageId => {
      const imageIdSpecificToolState = toolState[imageId];

      if (
        !imageIdSpecificToolState[toolName] ||
        !imageIdSpecificToolState[toolName].data ||
        !imageIdSpecificToolState[toolName].data.length
      ) {
        return;
      }

      const measurements = imageIdSpecificToolState[toolName].data;

      measurements.forEach(measurement => {
        debugger;
        regionList.push(
          <MeasurementTableItem
            key={key}
            itemIndex={key}
            itemClass={selectedKey === i ? 'selected' : ''}
            measurementData={measurement}
            onItemClick={onItemClick}
            onRelabel={onRelabelClick}
            onDelete={onDeleteClick}
            onEditDescription={onEditDescriptionClick}
          />
        );

        key++;
      });
    });

    return regionList;

    /*
     * Let's iterate over segmentIndexes ^ above
     * If meta has a match, use it to show info
     * If now, add "no-meta" class
     * Show default name
     */
  };

  const RegionsHeader = ({ count = 0 }) => {
    return (
      <React.Fragment>
        <div className="tableListHeaderTitle">Regions</div>
        <div className="numberOfItems">{count}</div>
      </React.Fragment>
    );
  };

  console.log(state);

  return (
    <div className="dcmseg-segmentation-panel">
      <TableList
        customHeader={
          <RegionsHeader count={state.regionList.length}></RegionsHeader>
        }
      >
        <ScrollableArea>{state.regionList}</ScrollableArea>
      </TableList>

      <button onClick={() => showTimecourseModal(modal)}></button>
    </div>
  );
};

MRUrographyPanel.propTypes = {
  /*
   * An object, with int index keys?
   * Maps to: state.viewports.viewportSpecificData, in `viewer`
   * Passed in MODULE_TYPES.PANEL when specifying component in viewer
   */
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
};
MRUrographyPanel.defaultProps = {};

export default MRUrographyPanel;
