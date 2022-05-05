import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import moment from 'moment';
import classNames from 'classnames';
import { utils, log } from '@ohif/core';
import { ScrollableArea, TableList, Icon } from '@ohif/ui';
import DICOMSegTempCrosshairsTool from '../../tools/DICOMSegTempCrosshairsTool';

import setActiveLabelmap from '../../utils/setActiveLabelMap';
import refreshViewports from '../../utils/refreshViewports';

import {
  BrushColorSelector,
  BrushRadius,
  SegmentationItem,
  SegmentItem,
  SegmentationSelect,
} from '../index';

import './SegmentationPanel.css';
import SegmentationSettings from '../SegmentationSettings/SegmentationSettings';

const { studyMetadataManager } = utils;

/**
 * SegmentationPanel component
 *
 * @param {Array} props.studies - Studies data
 * @param {Array} props.viewports - Viewports data (viewportSpecificData)
 * @param {number} props.activeIndex - Active viewport index
 * @param {boolean} props.isOpen - Boolean that indicates if the panel is expanded
 * @param {Function} props.onSegmentItemClick - Segment click handler
 * @param {Function} props.onSegmentVisibilityChange - Segment visibiliy change handler
 * @param {Function} props.onConfigurationChange - Configuration change handler
 * @param {Function} props.activeContexts - List of active application contexts
 * @param {Function} props.contexts - List of available application contexts
 * @returns component
 */
const SegmentationPanel = ({
  studies,
  viewports,
  activeIndex,
  isOpen,
  onSegmentItemClick,
  onSegmentVisibilityChange,
  onConfigurationChange,
  onDisplaySetLoadFailure,
  onSelectedSegmentationChange,
  activeContexts = [],
  contexts = {},
}) => {
  const isVTK = () => activeContexts.includes(contexts.VTK);
  const isCornerstone = () => activeContexts.includes(contexts.CORNERSTONE);

  /*
   * TODO: wrap get/set interactions with the cornerstoneTools
   * store with context to make these kind of things less blurry.
   */
  const { configuration } = cornerstoneTools.getModule('segmentation');
  const DEFAULT_BRUSH_RADIUS = configuration.radius || 10;

  /*
   * TODO: We shouldn't hardcode brushColor color, in the future
   * the SEG may set the colorLUT to whatever it wants.
   */
  const [state, setState] = useState({
    brushRadius: DEFAULT_BRUSH_RADIUS,
    brushColor: 'rgba(221, 85, 85, 1)',
    selectedSegment: 0,
    selectedSegmentation: 0,
    showSettings: false,
    labelMapList: [],
    segmentList: [],
    segmentsHidden: [],
    segmentNumbers: [],
    isLoading: false,
    isDisabled: true,
  });

  const getActiveViewport = () => viewports[activeIndex];

  const getFirstImageId = () => {
    const { StudyInstanceUID, displaySetInstanceUID } = getActiveViewport();
    const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
    return studyMetadata.getFirstImageId(displaySetInstanceUID);
  };

  const getActiveLabelMaps3D = () => {
    const { labelmaps3D, activeLabelmapIndex } = getBrushStackState();
    return labelmaps3D[activeLabelmapIndex];
  };

  const getActiveLabelMapIndex = () => {
    const { activeLabelmapIndex } = getBrushStackState();
    return activeLabelmapIndex;
  };

  const getActiveSegmentIndex = () => {
    const { activeSegmentIndex } = getActiveLabelMaps3D();
    return activeSegmentIndex;
  };

  const getActiveLabelMaps2D = () => {
    const { labelmaps2D } = getActiveLabelMaps3D();
    return labelmaps2D;
  };

  const getCurrentDisplaySet = () => {
    const { StudyInstanceUID, displaySetInstanceUID } = getActiveViewport();
    const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
    const allDisplaySets = studyMetadata.getDisplaySets();
    return allDisplaySets.find(
      ds => ds.displaySetInstanceUID === displaySetInstanceUID
    );
  };

  const setActiveSegment = segmentIndex => {
    const activeSegmentIndex = getActiveSegmentIndex();
    const activeViewport = getActiveViewport();

    if (segmentIndex === activeSegmentIndex) {
      log.info(`${activeSegmentIndex} is already the active segment`);
      return;
    }

    const labelmap3D = getActiveLabelMaps3D();
    labelmap3D.activeSegmentIndex = segmentIndex;

    /**
     * Activates the correct label map if clicked segment
     * does not belong to the active labelmap
     */
    const { StudyInstanceUID } = activeViewport;
    const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
    const allDisplaySets = studyMetadata.getDisplaySets();
    let selectedSegmentation;
    let newLabelmapIndex = getActiveLabelMapIndex();
    allDisplaySets.forEach(displaySet => {
      if (displaySet.labelmapSegments) {
        Object.keys(displaySet.labelmapSegments).forEach(labelmapIndex => {
          if (
            displaySet.labelmapSegments[labelmapIndex].includes(segmentIndex)
          ) {
            newLabelmapIndex = labelmapIndex;
            selectedSegmentation =
              displaySet.hasOverlapping === true
                ? displaySet.originLabelMapIndex
                : labelmapIndex;
          }
        });
      }
    });

    const brushStackState = getBrushStackState();
    brushStackState.activeLabelmapIndex = newLabelmapIndex;
    if (selectedSegmentation) {
      setState(state => ({ ...state, selectedSegmentation }));
    }

    refreshViewports();

    return segmentIndex;
  };

  useEffect(() => {
    const labelmapModifiedHandler = event => {
      log.warn('Segmentation Panel: labelmap modified', event);
      refreshSegmentations();
    };

    /*
     * TODO: Improve the way we notify parts of the app that depends on segs to be loaded.
     *
     * Currently we are using a non-ideal implementation through a custom event to notify the segmentation panel
     * or other components that could rely on loaded segmentations that
     * the segments were loaded so that e.g. when the user opens the panel
     * before the segments are fully loaded, the panel can subscribe to this custom event
     * and update itself with the new segments.
     *
     * This limitation is due to the fact that the cs segmentation module is an object (which will be
     * updated after the segments are loaded) that React its not aware of its changes
     * because the module object its not passed in to the panel component as prop but accessed externally.
     *
     * Improving this event approach to something reactive that can be tracked inside the react lifecycle,
     * allows us to easily watch the module or the segmentations loading process in any other component
     * without subscribing to external events.
     */
    document.addEventListener(
      'extensiondicomsegmentationsegloaded',
      refreshSegmentations
    );
    document.addEventListener(
      'extensiondicomsegmentationsegselected',
      updateSegmentationComboBox
    );

    /*
     * These are specific to each element;
     * Need to iterate cornerstone-tools tracked enabled elements?
     * Then only care about the one tied to active viewport?
     */
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement =>
      enabledElement.addEventListener(
        'cornerstonetoolslabelmapmodified',
        labelmapModifiedHandler
      )
    );

    return () => {
      document.removeEventListener(
        'extensiondicomsegmentationsegloaded',
        refreshSegmentations
      );
      document.removeEventListener(
        'extensiondicomsegmentationsegselected',
        updateSegmentationComboBox
      );
      cornerstoneTools.store.state.enabledElements.forEach(enabledElement =>
        enabledElement.removeEventListener(
          'cornerstonetoolslabelmapmodified',
          labelmapModifiedHandler
        )
      );
    };
  }, [
    activeIndex,
    viewports,
  ]);

  const updateSegmentationComboBox = e => {
    const index = e.detail.activatedLabelmapIndex;
    if (index !== -1) {
      setState(state => ({ ...state, selectedSegmentation: index }));
    }
  };

  const refreshSegmentations = () => {
    const activeViewport = getActiveViewport();
    const isDisabled = !activeViewport || !activeViewport.StudyInstanceUID;
    if (!isDisabled) {
      const brushStackState = getBrushStackState();
      if (brushStackState) {
        const labelMapList = getLabelMapList();
        const {
          items: segmentList,
          numbers: segmentNumbers,
          segmentsHidden,
        } = getSegmentList();
        setState(state => ({
          ...state,
          segmentsHidden,
          segmentNumbers,
          labelMapList,
          segmentList,
          isDisabled,
        }));
      } else {
        setState(state => ({
          ...state,
          segmentsHidden: [],
          segmentNumbers: [],
          labelMapList: [],
          segmentList: [],
          isDisabled,
        }));
      }
    }
  };

  useEffect(() => {
    refreshSegmentations();
  }, [
    viewports,
    activeIndex,
    isOpen,
    state.selectedSegmentation,
    activeContexts,
    state.isLoading,
  ]);

  /* Handle open/closed panel behaviour */
  useEffect(() => {
    setState(state => ({
      ...state,
      showSettings: state.showSettings && !isOpen,
    }));
  }, [isOpen]);

  const getLabelMapList = () => {
    const activeViewport = getActiveViewport();

    /* Get list of SEG labelmaps specific to active viewport (reference series) */
    const referencedSegDisplaysets = _getReferencedSegDisplaysets(
      activeViewport.StudyInstanceUID,
      activeViewport.SeriesInstanceUID
    );

    const filteredReferencedSegDisplaysets = referencedSegDisplaysets.filter(
      segDisplay => segDisplay.loadError !== true
    );

    return filteredReferencedSegDisplaysets.map((displaySet, index) => {
      const {
        labelmapIndex,
        originLabelMapIndex,
        hasOverlapping,
        SeriesDate,
        SeriesTime,
      } = displaySet;

      /* Map to display representation */
      const dateStr = `${SeriesDate}:${SeriesTime}`.split('.')[0];
      const date = moment(dateStr, 'YYYYMMDD:HHmmss');
      const displayDate = date.format('ddd, MMM Do YYYY, h:mm:ss a');
      const displayDescription = displaySet.SeriesDescription;

      return {
        value: hasOverlapping === true ? originLabelMapIndex : labelmapIndex,
        title: displayDescription,
        description: displayDate,
        onClick: async () => {
          const activatedLabelmapIndex = await setActiveLabelmap(
            activeViewport,
            studies,
            displaySet,
            onSelectedSegmentationChange,
            onDisplaySetLoadFailure
          );
          setState(state => ({
            ...state,
            selectedSegmentation: activatedLabelmapIndex,
          }));
        },
      };
    });
  };

  const setCurrentSelectedSegment = segmentNumber => {
    setActiveSegment(segmentNumber);

    const sameSegment = state.selectedSegment === segmentNumber;
    if (!sameSegment) {
      setState(state => ({ ...state, selectedSegment: segmentNumber }));
    }

    const validIndexList = [];
    getActiveLabelMaps2D().forEach((labelMap2D, index) => {
      if (labelMap2D.segmentsOnLabelmap.includes(segmentNumber)) {
        validIndexList.push(index);
      }
    });

    const avg = array => array.reduce((a, b) => a + b) / array.length;
    const average = avg(validIndexList);
    const closest = validIndexList.reduce((prev, curr) => {
      return Math.abs(curr - average) < Math.abs(prev - average) ? curr : prev;
    });

    if (isCornerstone()) {
      const element = getEnabledElement();
      const toolState = cornerstoneTools.getToolState(element, 'stack');

      if (!toolState) return;

      const imageIds = toolState.data[0].imageIds;
      const imageId = imageIds[closest];
      const frameIndex = imageIds.indexOf(imageId);

      const SOPInstanceUID = cornerstone.metaData.get(
        'SOPInstanceUID',
        imageId
      );
      const StudyInstanceUID = cornerstone.metaData.get(
        'StudyInstanceUID',
        imageId
      );

      DICOMSegTempCrosshairsTool.addCrosshair(element, imageId, segmentNumber);

      onSegmentItemClick({
        StudyInstanceUID,
        SOPInstanceUID,
        frameIndex,
        activeViewportIndex: activeIndex,
      });
    }

    if (isVTK()) {
      const labelMaps3D = getActiveLabelMaps3D();
      const currentDisplaySet = getCurrentDisplaySet();
      const frame = labelMaps3D.labelmaps2D[closest];

      onSegmentItemClick({
        studies,
        StudyInstanceUID: currentDisplaySet.StudyInstanceUID,
        displaySetInstanceUID: currentDisplaySet.displaySetInstanceUID,
        SOPClassUID: getActiveViewport().sopClassUIDs[0],
        SOPInstanceUID: currentDisplaySet.SOPInstanceUID,
        segmentNumber,
        frameIndex: closest,
        frame,
      });
    }
  };

  const getColorLUTTable = () => {
    const { state } = cornerstoneTools.getModule('segmentation');
    const { colorLUTIndex } = getActiveLabelMaps3D();
    return state.colorLutTables[colorLUTIndex];
  };

  const getEnabledElement = () => {
    const enabledElements = cornerstone.getEnabledElements();
    return enabledElements[activeIndex].element;
  };

  const onSegmentVisibilityChangeHandler = (
    isVisible,
    segmentNumber,
    labelmap3D
  ) => {
    let segmentsHidden = [];
    if (labelmap3D.metadata.hasOverlapping) {
      /** Get all labelmaps with this segmentNumber and that
       * are from the same series (overlapping segments) */
      const { labelmaps3D } = getBrushStackState();

      const sameSeriesLabelMaps3D = labelmaps3D.filter(({ metadata }) => {
        return (
          labelmap3D.metadata.segmentationSeriesInstanceUID ===
          metadata.segmentationSeriesInstanceUID
        );
      });

      const possibleLabelMaps3D = sameSeriesLabelMaps3D.filter(
        ({ labelmaps2D }) => {
          return labelmaps2D.some(({ segmentsOnLabelmap }) =>
            segmentsOnLabelmap.includes(segmentNumber)
          );
        }
      );

      possibleLabelMaps3D.forEach(labelmap3D => {
        labelmap3D.segmentsHidden[segmentNumber] = !isVisible;

        segmentsHidden = [
          ...new Set([...segmentsHidden, ...labelmap3D.segmentsHidden]),
        ];
      });
    } else {
      labelmap3D.segmentsHidden[segmentNumber] = !isVisible;
      segmentsHidden = [...labelmap3D.segmentsHidden];
    }

    setState(state => ({ ...state, segmentsHidden }));

    refreshSegmentations();
    refreshViewports();

    if (isVTK()) {
      onSegmentVisibilityChange(segmentNumber, isVisible);
    }
  };

  const getSegmentList = () => {
    /*
     * Newly created segments have no `meta`
     * So we instead build a list of all segment indexes in use
     * Then find any associated metadata
     */
    const uniqueSegmentIndexes = getActiveLabelMaps2D()
      .reduce((acc, labelmap2D) => {
        if (labelmap2D) {
          const segmentIndexes = labelmap2D.segmentsOnLabelmap;

          for (let i = 0; i < segmentIndexes.length; i++) {
            if (!acc.includes(segmentIndexes[i]) && segmentIndexes[i] !== 0) {
              acc.push(segmentIndexes[i]);
            }
          }
        }

        return acc;
      }, [])
      .sort((a, b) => a - b);

    const labelmap3D = getActiveLabelMaps3D();
    const colorLutTable = getColorLUTTable();
    const hasLabelmapMeta = labelmap3D.metadata && labelmap3D.metadata.data;

    const segmentList = [];
    const segmentNumbers = [];
    for (let i = 0; i < uniqueSegmentIndexes.length; i++) {
      const segmentIndex = uniqueSegmentIndexes[i];

      const color = colorLutTable[segmentIndex];
      let segmentLabel = '(unlabeled)';
      let segmentNumber = segmentIndex;

      /* Meta */
      if (hasLabelmapMeta) {
        const segmentMeta = labelmap3D.metadata.data[segmentIndex];
        if (segmentMeta) {
          segmentNumber = segmentMeta.SegmentNumber;
          segmentLabel = segmentMeta.SegmentLabel;
        }
      }

      const sameSegment = state.selectedSegment === segmentNumber;

      segmentNumbers.push(segmentNumber);
      segmentList.push(
        <SegmentItem
          key={segmentNumber}
          itemClass={`segment-item ${sameSegment && 'selected'}`}
          onClick={setCurrentSelectedSegment}
          label={segmentLabel}
          index={segmentNumber}
          color={color}
          labelmap3D={labelmap3D}
          visible={!labelmap3D.segmentsHidden[segmentIndex]}
          onVisibilityChange={onSegmentVisibilityChangeHandler}
        />
      );
    }

    return {
      items: segmentList,
      numbers: segmentNumbers,
      segmentsHidden: labelmap3D.segmentsHidden,
    };

    /*
     * Let's iterate over segmentIndexes ^ above
     * If meta has a match, use it to show info
     * If now, add "no-meta" class
     * Show default name
     */
  };

  const updateBrushSize = evt => {
    const updatedRadius = Number(evt.target.value);

    if (updatedRadius !== brushRadius) {
      setState(state => ({ ...state, brushRadius: updatedRadius }));
      const module = cornerstoneTools.getModule('segmentation');
      module.setters.radius(updatedRadius);
    }
  };

  const decrementSegment = event => {
    const activeSegmentIndex = getActiveSegmentIndex();
    event.preventDefault();
    if (activeSegmentIndex > 1) {
      activeSegmentIndex--;
    }
    setState(state => ({ ...state, selectedSegment: activeSegmentIndex }));
    updateActiveSegmentColor();
  };

  const incrementSegment = event => {
    const activeSegmentIndex = getActiveSegmentIndex();
    event.preventDefault();
    activeSegmentIndex++;
    setState(state => ({ ...state, selectedSegment: activeSegmentIndex }));
    updateActiveSegmentColor();
  };

  const updateActiveSegmentColor = () => {
    const color = getActiveSegmentColor();
    setState(state => ({ ...state, brushColor: color }));
  };

  const getBrushStackState = () => {
    const module = cornerstoneTools.getModule('segmentation');
    const firstImageId = getFirstImageId();
    const brushStackState = module.state.series[firstImageId];
    return brushStackState;
  };

  const getActiveSegmentColor = () => {
    const brushStackState = getBrushStackState();
    if (!brushStackState) {
      return 'rgba(255, 255, 255, 1)';
    }

    const colorLutTable = getColorLUTTable();
    const color = colorLutTable[labelmap3D.activeSegmentIndex];
    return `rgba(${color.join(',')})`;
  };

  const updateConfiguration = newConfiguration => {
    configuration.renderFill = newConfiguration.renderFill;
    configuration.renderOutline = newConfiguration.renderOutline;
    configuration.shouldRenderInactiveLabelmaps =
      newConfiguration.shouldRenderInactiveLabelmaps;
    configuration.fillAlpha = newConfiguration.fillAlpha;
    configuration.outlineAlpha = newConfiguration.outlineAlpha;
    configuration.outlineWidth = newConfiguration.outlineWidth;
    configuration.fillAlphaInactive = newConfiguration.fillAlphaInactive;
    configuration.outlineAlphaInactive = newConfiguration.outlineAlphaInactive;
    onConfigurationChange(newConfiguration);
    refreshViewports();
  };

  const onVisibilityChangeHandler = isVisible => {
    let segmentsHidden = [];
    state.segmentNumbers.forEach(segmentNumber => {
      if (isVTK()) {
        onSegmentVisibilityChange(segmentNumber, isVisible);
      }

      /** Get all labelmaps with this segmentNumber (overlapping segments) */
      const { labelmaps3D } = getBrushStackState();
      const possibleLabelMaps3D = labelmaps3D.filter(({ labelmaps2D }) => {
        return labelmaps2D.some(({ segmentsOnLabelmap }) =>
          segmentsOnLabelmap.includes(segmentNumber)
        );
      });

      possibleLabelMaps3D.forEach(labelmap3D => {
        labelmap3D.segmentsHidden[segmentNumber] = !isVisible;
        segmentsHidden = [
          ...new Set([...segmentsHidden, ...labelmap3D.segmentsHidden]),
        ];
      });
    });

    setState(state => ({ ...state, segmentsHidden }));

    refreshSegmentations();
    refreshViewports();
  };

  const disabledConfigurationFields = [
    'outlineAlpha',
    'shouldRenderInactiveLabelmaps',
  ];

  const selectedSegmentationOption = state.labelMapList.find(
    i => i.value === state.selectedSegmentation
  );

  if (state.showSettings) {
    return (
      <SegmentationSettings
        disabledFields={isVTK() ? disabledConfigurationFields : []}
        configuration={configuration}
        onBack={() => setState(state => ({ ...state, showSettings: false }))}
        onChange={updateConfiguration}
      />
    );
  } else {
    return (
      <div
        className={classNames('dcmseg-segmentation-panel', {
          disabled: state.isDisabled,
        })}
      >
        {false && (
          <form className="selector-form">
            <BrushColorSelector
              defaultColor={state.brushColor}
              index={state.selectedSegment}
              onNext={incrementSegment}
              onPrev={decrementSegment}
            />
            <BrushRadius
              value={state.brushRadius}
              onChange={updateBrushSize}
              min={configuration.minRadius}
              max={configuration.maxRadius}
            />
          </form>
        )}
        <Icon
          className="cog-icon"
          name="cog"
          width="25px"
          height="25px"
          onClick={() => setState(state => ({ ...state, showSettings: true }))}
        />
        <h3>Segmentations</h3>
        <div className="segmentations">
          <SegmentationSelect
            value={selectedSegmentationOption}
            formatOptionLabel={SegmentationItem}
            options={state.labelMapList}
          />
        </div>
        <SegmentsSection
          count={state.segmentList.length}
          isVisible={
            state.segmentsHidden.filter(isHidden => isHidden === true).length <
            state.segmentNumbers.length && state.segmentNumbers.length > 0
          }
          onVisibilityChange={onVisibilityChangeHandler}
        >
          <ScrollableArea>
            <TableList headless>{state.segmentList}</TableList>
          </ScrollableArea>
        </SegmentsSection>
      </div>
    );
  }
};

SegmentationPanel.propTypes = {
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
  isOpen: PropTypes.bool.isRequired,
};
SegmentationPanel.defaultProps = {};

/**
 * Returns SEG DisplaySets that reference the target series, sorted by dateTime
 *
 * @param {string} StudyInstanceUID
 * @param {string} SeriesInstanceUID
 * @returns Array
 */
const _getReferencedSegDisplaysets = (StudyInstanceUID, SeriesInstanceUID) => {
  /* Referenced DisplaySets */
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const referencedDisplaysets = studyMetadata.getDerivedDatasets({
    referencedSeriesInstanceUID: SeriesInstanceUID,
    Modality: 'SEG',
  });

  /* Sort */
  referencedDisplaysets.sort((a, b) => {
    const aNumber = Number(`${a.SeriesDate}${a.SeriesTime}`);
    const bNumber = Number(`${b.SeriesDate}${b.SeriesTime}`);
    return bNumber - aNumber;
  });

  return referencedDisplaysets;
};

const SegmentsSection = ({
  count,
  children,
  isVisible: defaultVisibility,
  onVisibilityChange,
}) => {
  const [isVisible, setIsVisible] = useState(defaultVisibility);

  const onVisibilityChangeHandler = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    onVisibilityChange(newVisibility);
  };

  useEffect(() => {
    setIsVisible(defaultVisibility);
  }, [defaultVisibility]);

  return (
    <div className="SegmentsSection">
      <div className="header">
        <div>Segments</div>
        <div className="icons">
          <Icon
            className={`eye-icon ${isVisible && 'expanded'}`}
            name={isVisible ? 'eye' : 'eye-closed'}
            width="20px"
            height="20px"
            onClick={onVisibilityChangeHandler}
          />
          <div className="count">{count}</div>
        </div>
      </div>
      {children}
    </div>
  );
};

const noop = () => {};

SegmentsSection.defaultProps = {
  onVisibilityChange: noop,
};

export default SegmentationPanel;
