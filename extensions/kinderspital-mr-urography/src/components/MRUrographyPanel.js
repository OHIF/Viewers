import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { utils, log } from '@ohif/core';
import { ScrollableArea, TableList, useModal, Icon } from '@ohif/ui';
import findDisplaySetFromDisplaySetInstanceUID from '../utils/findDisplaySetFromDisplaySetInstanceUID';
import MRUrographyTableItem from './MRUrographyTabelItem';
import * as dcmjs from 'dcmjs';
import TimecourseModal from './timecourseModal/TimecourseContent';
import ResultsModal from './ResultsModal';
import TOOL_NAMES from '../tools/toolNames';
import { measurementConfig } from '../tools/KinderspitalFreehandRoiTool';
import calculateAreaUnderCurve from '../utils/calculateAreaUnderCurve';
import './MRUrographyPanel.css';
import computeSegmentationFromContours from '../utils/computeSegmentationFromContours';
import loadSegmentation from '../utils/loadSegmentation';
import { labelToSegmentNumberMap } from '../constants/labels';
import kispiClient from '../api';
import saveEvaluatePlotScreenshot from '../utils/saveEvaluatePlotScreenshot';
import generatePDFReport from '../utils/generatePDFReport';

const { KINDERSPITAL_FREEHAND_ROI_TOOL } = TOOL_NAMES;

const { datasetToBlob, datasetToBuffer } = dcmjs.data;

const scrollToIndex = cornerstoneTools.importInternal('util/scrollToIndex');

const globalImageIdSpecificToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

const { EVENTS } = cornerstoneTools;

const refreshViewport = () => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
};

// TEMP - Calculate on server
function _generateMockTimeCoursesAndVolumes() {
  const labels = _getLabels();
  const labelNumbers = labels.map(label => labelToSegmentNumberMap[label]);

  return labelNumbers.map(labelNumber => {
    return {
      labelNumber,
      timecourse: _generateMockTimecourse(),
      volume: _generateMockVolume(),
    };
  });
}

const _generateMockTimecourse = () => {
  return new Array(100).fill(0).map((item, index) => {
    return [index * 10, Math.ceil(Math.random() * 10)];
  });
};

const _generateMockVolume = () => {
  return Math.floor(Math.random() * 100) + 1;
};

const _getLabels = () => {
  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();

  const labels = [];

  const imageIds = Object.keys(globalToolState);
  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const imageIdSpecificToolState = globalToolState[imageId];

    const freehandToolData =
      imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL];

    if (
      freehandToolData &&
      freehandToolData.data &&
      freehandToolData.data.length
    ) {
      freehandToolData.data.forEach(data => {
        labels.push(data.label);
      });
    }
  }

  return labels;
};

//TEMP

const showTimecourseModal = (
  uiModal,
  targetMeasurementNumber,
  measurements,
  onPlacePoints
) => {
  let currentTargetMeasurementNumber = targetMeasurementNumber;

  // NOTE: We have to do this in order to save the correct chart onClose.
  // Just a quirk of the way the modal system is implemented, the modal does not
  // have access to its childs state.
  function onSetCurrentTargetMeasurementNumber(number) {
    currentTargetMeasurementNumber = number;
  }

  if (uiModal) {
    uiModal.show({
      content: TimecourseModal,
      title: 'Evaluate Timecourse',
      onClose: () => {
        saveEvaluatePlotScreenshot(currentTargetMeasurementNumber);
      },
      contentProps: {
        measurements,
        targetMeasurementNumber,
        onPlacePoints,
        onSetCurrentTargetMeasurementNumber,
      },
    });
  }
};

const showResultsModal = (uiModal, measurements, imageIdPerMeasurement) => {
  if (uiModal) {
    uiModal.show({
      content: ResultsModal,
      title: 'Results',
      contentProps: {
        measurements,
        imageIdPerMeasurement,
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
const MRUrographyPanel = ({
  studies,
  viewports,
  activeIndex,
  isOpen,
  showLabellingDialog,
}) => {
  const modal = useModal();

  const [state, setState] = useState({
    regionList: [],
    selectedKey: 0,
    canFetchTimeCourses: false,
    canEvaluate: false,
  });

  const updateState = (field, value) => {
    setState(state => ({ ...state, [field]: value }));
  };

  useEffect(() => {
    const { canEvaluate, canFetchTimeCourses, regionList } = getRegionList();
    setState(state => ({
      ...state,
      regionList: regionList,
      canFetchTimeCourses: canFetchTimeCourses,
    }));
  }, [studies, viewports, activeIndex]);

  const onRelabelClick = (eventData, measurementData) => {
    showLabellingDialog(
      { centralize: true, isDraggable: false },
      measurementData,
      onLabelCallback
    );
  };

  const onLabelCallback = measurementData => {
    const selectedKey = measurementData.measurementNumber;
    const { canFetchTimeCourses, regionList } = getRegionList(selectedKey);

    setState(state => ({
      ...state,
      selectedKey: selectedKey,
      regionList: regionList,
      canFetchTimeCourses: canFetchTimeCourses,
    }));
  };

  const onDeleteClick = (event, measurementData) => {
    const measurementNumber = measurementData.measurementNumber;

    const toolState = globalImageIdSpecificToolStateManager.saveToolState();
    const toolName = TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL;

    const imageIds = Object.keys(toolState);

    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const imageIdSpecificToolState = toolState[imageId];

      if (
        !imageIdSpecificToolState[toolName] ||
        !imageIdSpecificToolState[toolName].data ||
        !imageIdSpecificToolState[toolName].data.length
      ) {
        continue;
      }

      const measurements = imageIdSpecificToolState[toolName].data;

      for (let j = measurements.length - 1; j >= 0; j--) {
        if (measurements[j].measurementNumber === measurementNumber) {
          measurements.splice(j, 1);
        } else if (measurements[j].measurementNumber > measurementNumber) {
          measurements[j].measurementNumber -= 1;
        }
      }
    }

    measurementConfig.measurementNumber--;
    refreshViewport();

    const { canEvaluate, canFetchTimeCourses, regionList } = getRegionList();
    setState(state => ({
      ...state,
      regionList,
      canFetchTimeCourses,
      canEvaluate,
    }));
  };

  const jumpToLesion = measurementData => {
    const measurementNumber = measurementData.measurementNumber;

    const activeViewport = viewports[activeIndex];

    const displaySet = findDisplaySetFromDisplaySetInstanceUID(
      studies,
      activeViewport.displaySetInstanceUID
    );

    const imageIds = [];

    // Assume 4D
    for (let i = 0; i < displaySet.images.length; i++) {
      imageIds.push(displaySet.images[i].map(image => image.getImageId()));
    }

    const toolState = globalImageIdSpecificToolStateManager.saveToolState();
    const toolName = TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL;

    const toolStateImageIds = Object.keys(toolState);

    let position;

    for (let i = 0; i < toolStateImageIds.length; i++) {
      const imageId = toolStateImageIds[i];
      const imageIdSpecificToolState = toolState[imageId];

      if (
        !imageIdSpecificToolState[toolName] ||
        !imageIdSpecificToolState[toolName].data ||
        !imageIdSpecificToolState[toolName].data.length
      ) {
        continue;
      }

      const measurements = imageIdSpecificToolState[toolName].data;

      for (let j = measurements.length - 1; j >= 0; j--) {
        if (measurements[j].measurementNumber === measurementNumber) {
          position = _getStackIndexAndImageIdIndexfromImageId(
            imageIds,
            imageId
          );
          break;
        }
      }
    }

    const enabledElements = cornerstone.getEnabledElements();
    const enabledElement = enabledElements[activeIndex];
    const { element } = enabledElement;

    const timeSeries = cornerstoneTools.getToolState(
      enabledElement.element,
      'timeSeries'
    );

    const currentStackIndex = timeSeries.data[0].currentStackIndex;

    // Switch imageIdIndex in stack
    scrollToIndex(element, position.imageIdIndex);

    // Switch timepoint
    cornerstoneTools.incrementTimePoint(
      element,
      position.stackIndex - currentStackIndex
    );

    cornerstone.updateImage(element);
  };

  const _getStackIndexAndImageIdIndexfromImageId = (imageIds, imageId) => {
    for (let stackIndex = 0; stackIndex < imageIds.length; stackIndex++) {
      const imageIdsForStack = imageIds[stackIndex];

      for (
        let imageIdIndex = 0;
        imageIdIndex < imageIdsForStack.length;
        imageIdIndex++
      ) {
        if (imageIdsForStack[imageIdIndex] === imageId) {
          return { stackIndex, imageIdIndex };
        }
      }
    }
  };

  const getMeasurements = () => {
    const toolState = globalImageIdSpecificToolStateManager.saveToolState();
    const toolName = TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL;
    //let targetIndex = 0;
    const measurements = [];
    const imageIds = Object.keys(toolState);

    const imageIdPerMeasurement = [];

    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const imageIdSpecificToolState = toolState[imageId];

      const currentSpecificToolState = imageIdSpecificToolState[toolName];
      if (
        !currentSpecificToolState ||
        !currentSpecificToolState.data ||
        !currentSpecificToolState.data.length
      ) {
        continue;
      }
      measurements.push(...imageIdSpecificToolState[toolName].data);

      const numMeausrementsOnImageId =
        imageIdSpecificToolState[toolName].data.length;

      for (let num = 0; num < numMeausrementsOnImageId; num++) {
        imageIdPerMeasurement.push(imageId);
      }
    }

    return { measurements, imageIdPerMeasurement };
  };

  const onEvaluateClick = measurementNumber => {
    const { measurements } = getMeasurements();
    showTimecourseModal(modal, measurementNumber, measurements, onPlacePoints);
  };

  const onPlacePoints = (
    peekIndex,
    glomerularIndex,
    measurementIndex,
    measurement,
    invalidateOthers
  ) => {
    const { timecourse, measurementNumber } = measurement;

    const area = calculateAreaUnderCurve(
      timecourse,
      peekIndex,
      glomerularIndex
    );

    const toolState = globalImageIdSpecificToolStateManager.saveToolState();
    const toolName = TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL;

    const imageIds = Object.keys(toolState);

    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const imageIdSpecificToolState = toolState[imageId];

      const currentSpecificToolState = imageIdSpecificToolState[toolName];
      if (
        !currentSpecificToolState ||
        !currentSpecificToolState.data ||
        !currentSpecificToolState.data.length
      ) {
        continue;
      }

      const measurements = imageIdSpecificToolState[toolName].data || [];

      for (let measurementData of measurements) {
        if (
          measurementData.measurementNumber === measurement.measurementNumber
        ) {
          measurementData.areaUnderCurve = area;
          measurementData.pIndex = peekIndex;
          measurementData.gIndex = glomerularIndex;
        } else if (invalidateOthers) {
          measurementData.areaUnderCurve = undefined;
          measurementData.pIndex = undefined;
          measurementData.gIndex = undefined;
        }
      }
    }

    const { canEvaluate, canFetchTimeCourses, regionList } = getRegionList();
    setState(state => ({
      ...state,
      regionList,
      canFetchTimeCourses,
      canEvaluate,
    }));
    return area;
  };

  const onComputeSegmentationTimeCoursesClick = async () => {
    // TODO -> Some nice loading UI as part of #7.

    const activeViewport = viewports[activeIndex];
    const displaySet = findDisplaySetFromDisplaySetInstanceUID(
      studies,
      activeViewport.displaySetInstanceUID
    );

    const segmentation = await computeSegmentationFromContours(displaySet);

    const segBlob = datasetToBlob(segmentation.dataset);

    // TEMP Whilst fixing backend
    const segBuffer = datasetToBuffer(segmentation.dataset).buffer;
    // TEMP Whilst fixing backend

    // TEMP - Create a URL for the binary.
    // TODO -> Post this somewhere along with the metadata.
    // var objectUrl = URL.createObjectURL(segBlob);
    // window.open(objectUrl);
    // ... data comes back as buffer:

    // DANNY STUFF goes here.

    // TEMP Whilst fixing backend
    /*

    const jobId = await kispiClient.createUrographySegmentationJobAsync(
      segBlob
    );
    // TODO: Long poll job id for completion...

    const { segmentationUrl, timeCourses, volumes } = await kispiClient.getJobResultsAsync(jobId);
      console.log(segmentationUrl)


    let segResults;
    if (segmentationUrl) {
      segResults = await kispiClient.getSegmentationAsync(
        segmentationUrl
      );
      // TODO: Do something with DCM or Seg binary
    } else {
      console.warn('no seg results...');
    }



    const segBuffer = segResults.buffer; // datasetToBuffer(segmentation.dataset).buffer;

       */
    // TEMP Whilst fixing backend
    const metadata = _generateMockTimeCoursesAndVolumes();

    loadSegmentation(segBuffer, metadata, displaySet);

    refreshViewport();

    const { canEvaluate, canFetchTimeCourses, regionList } = getRegionList();
    setState(state => ({
      ...state,
      regionList,
      canFetchTimeCourses,
      canEvaluate,
    }));
  };

  const onViewResultsClick = () => {
    if (state.canEvaluate) {
      const { measurements, imageIdPerMeasurement } = getMeasurements();

      showResultsModal(modal, measurements, imageIdPerMeasurement);
    }
  };

  const onItemClick = (event, measurementData) => {
    const selectedKey = measurementData.measurementNumber;
    const { canFetchTimeCourses, regionList } = getRegionList(selectedKey);

    jumpToLesion(measurementData);

    setState(state => ({
      ...state,
      selectedKey: selectedKey,
      regionList: regionList,
      canFetchTimeCourses: canFetchTimeCourses,
    }));
  };

  useEffect(() => {
    const measurementAddedHandler = event => {
      if (event.detail.toolType === TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL) {
        const {
          canEvaluate,
          canFetchTimeCourses,
          regionList,
        } = getRegionList();

        setState(state => ({
          ...state,
          regionList,
          canFetchTimeCourses,
          canEvaluate,
        }));
      }
    };

    const measurementRemovedHandler = event => {
      if (event.detail.toolType === TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL) {
        const {
          canEvaluate,
          canFetchTimeCourses,
          regionList,
        } = getRegionList();

        setState(state => ({
          ...state,
          regionList,
          canFetchTimeCourses,
          canEvaluate,
        }));
      }
    };

    /*
     * These are specific to each element;
     * Need to iterate cornerstone-tools tracked enabled elements?
     * Then only care about the one tied to active viewport?
     */
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement => {
      enabledElement.removeEventListener(
        EVENTS.MEASUREMENT_ADDED,
        measurementAddedHandler
      );
      enabledElement.removeEventListener(
        EVENTS.MEASUREMENT_REMOVED,
        measurementRemovedHandler
      );
      enabledElement.addEventListener(
        EVENTS.MEASUREMENT_ADDED,
        measurementAddedHandler
      );
      enabledElement.addEventListener(
        EVENTS.MEASUREMENT_REMOVED,
        measurementRemovedHandler
      );
    });
  }, [studies, viewports]);

  const getRegionList = selectedKey => {
    selectedKey = selectedKey !== undefined ? selectedKey : state.selectedKey;

    const regionList = [];
    const toolState = globalImageIdSpecificToolStateManager.saveToolState();
    const toolName = TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL;

    let canFetchTimeCourses = true;
    let canEvaluateComplete = true;

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
        const key = measurement.measurementNumber;

        if (!measurement.label) {
          canFetchTimeCourses = false;
        }

        if (!measurement.areaUnderCurve) {
          canEvaluateComplete = false;
        }

        const canEvaluate = measurement.timecourse !== undefined;

        regionList.push(
          <MRUrographyTableItem
            key={key}
            itemIndex={key}
            itemClass={selectedKey === key ? 'selected' : ''}
            measurementData={measurement}
            onItemClick={onItemClick}
            onRelabel={onRelabelClick}
            onDelete={onDeleteClick}
            onEvaluate={() => onEvaluateClick(key)}
            canEvaluate={canEvaluate}
          />
        );
      });
    });

    if (!regionList.length) {
      canFetchTimeCourses = false;
    }

    return {
      canEvaluate: canEvaluateComplete,
      regionList,
      canFetchTimeCourses,
    };

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

  const computeSegmentationTimeCoursesClasseNames = state.canFetchTimeCourses
    ? 'footerBtn'
    : 'footerBtn footerBtnDisabled';

  const viewResultsClassNames = state.canEvaluate
    ? 'footerBtn'
    : 'footerBtn footerBtnDisabled';

  return (
    <div className="mr-urography-panel">
      <TableList
        customHeader={
          <RegionsHeader count={state.regionList.length}></RegionsHeader>
        }
      >
        {state.regionList}
      </TableList>

      <div className="mr-urography-panel-footer">
        <button
          onClick={() => {
            if (state.canFetchTimeCourses) {
              onComputeSegmentationTimeCoursesClick();
            }
          }}
          className={computeSegmentationTimeCoursesClasseNames}
        >
          <Icon name="save" width="14px" height="14px" />
          Compute Segmentation and Timecourses
        </button>
        <button onClick={onViewResultsClick} className={viewResultsClassNames}>
          <Icon name="save" width="14px" height="14px" />
          View results
        </button>
      </div>
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
  showLabellingDialog: PropTypes.function,
};
MRUrographyPanel.defaultProps = {};

export default MRUrographyPanel;
