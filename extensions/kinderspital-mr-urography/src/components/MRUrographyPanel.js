import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { utils, log } from '@ohif/core';
import { ScrollableArea, TableList, Icon, useModal } from '@ohif/ui';

import TimecourseModal from './timecourseModal/TimecourseContent';

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
  return (
    <div className="dcmseg-segmentation-panel">
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
