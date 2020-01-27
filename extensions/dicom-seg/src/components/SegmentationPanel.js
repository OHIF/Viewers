import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import moment from 'moment';
import Select from 'react-select';

import { utils } from '@ohif/core';
import {
  Range,
  ScrollableArea,
  TableList,
  TableListItem,
  Icon,
} from '@ohif/ui';

import './SegmentationPanel.css';
import SegmentationSettings from './SegmentationSettings';

const { studyMetadataManager } = utils;

const segmentationModule = cornerstoneTools.getModule('segmentation');
const DEFAULT_BRUSH_RADIUS = segmentationModule.getters.radius || 10;

const refreshViewport = () => {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
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
const SegmentationPanel = ({ studies, viewports, activeIndex }) => {
  /* TODO: This technically defaults to 10 if undefined (bug?) */
  const [brushRadius, setBrushRadius] = useState(DEFAULT_BRUSH_RADIUS);
  const [brushColor, setBrushColor] = useState('rgba(221, 85, 85, 1)');
  const [selectedSegment, setSelectedSegment] = useState();
  const [showSegSettings, setShowSegSettings] = useState(false);

  const viewport = viewports[activeIndex];
  const firstImageId = _getFirstImageId(viewport);
  const { studyInstanceUid, seriesInstanceUid } = viewport;

  /* CornerstoneTools */
  const [brushStackState, setBrushStackState] = useState(
    segmentationModule.state.series[firstImageId]
  );
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    setBrushStackState(segmentationModule.state.series[firstImageId]);
  }, [studies, viewports, activeIndex, firstImageId]);

  useEffect(() => {
    const labelmapModifiedHandler = event => {
      console.warn('labelmap modified', event);
      setBrushStackState(segmentationModule.state.series[firstImageId]);
      setCounter(counter + 1);
    };

    /*
     * These are specific to each element;
     * Need to iterate cornerstone-tools tracked enabled elements?
     * Then only care about the one tied to active viewport?
     */
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement =>
      enabledElement.addEventListener(
        'cornersontetoolslabelmapmodified',
        labelmapModifiedHandler
      )
    );

    document.addEventListener('side-panel-change', handleSidePanelChange);

    return () => {
      cornerstoneTools.store.state.enabledElements.forEach(enabledElement =>
        enabledElement.removeEventListener(
          'cornersontetoolslabelmapmodified',
          labelmapModifiedHandler
        )
      );

      document.removeEventListener('side-panel-change', handleSidePanelChange);
    };
  });

  const handleSidePanelChange = () => {
    setShowSegSettings(false);
  };

  if (!brushStackState) {
    return null;
  }

  const labelmap3D =
    brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

  /*
   * 2. UseEffect to update state? or to a least trigger a re-render
   * 4. Toggle visibility of labelmap?
   * 5. Toggle visibility of seg?
   *
   * If the port is cornerstone, just need to call a re-render.
   * If the port is vtkjs, its a bit more tricky as we now need to create a new
   */

  const getLabelmapList = () => {
    /* Get list of SEG labelmaps specific to active viewport (reference series) */
    const referencedSegDisplaysets = _getReferencedSegDisplaysets(
      studyInstanceUid,
      seriesInstanceUid
    );

    return referencedSegDisplaysets.map((displaySet, index) => {
      const { labelmapIndex, seriesDate, seriesTime } = displaySet;

      /* Map to display representation */
      const dateStr = `${seriesDate}:${seriesTime}`.split('.')[0];
      const date = moment(dateStr, 'YYYYMMDD:HHmmss');
      const isActiveLabelmap =
        labelmapIndex === brushStackState.activeLabelmapIndex;
      const displayDate = date.format('ddd, MMM Do YYYY');
      const displayTime = date.format('h:mm:ss a');
      const displayDescription = displaySet.seriesDescription;

      return {
        value: labelmapIndex,
        title: displayDescription,
        description: displayDate,
        /*
         * TODO: CLICK BLOCKED BY DRAGGABLEAREA
         * Specific to UIDialogService
         */
        onClick: async () => {
          const activatedLabelmapIndex = await _setActiveLabelmap(
            viewport,
            studies,
            displaySet,
            firstImageId,
            brushStackState.activeLabelmapIndex
          );

          /* TODO: Notify of change? */
          setCounter(counter + 1);
        },
      };
    });
  };

  const labelmapList = getLabelmapList();

  const segmentList = [];

  if (labelmap3D) {
    /*
     * Newly created segments have no `meta`
     * So we instead build a list of all segment indexes in use
     * Then find any associated metadata
     */
    const uniqueSegmentIndexes = labelmap3D.labelmaps2D
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

    const colorLutTable =
      segmentationModule.state.colorLutTables[labelmap3D.colorLUTIndex];
    const hasLabelmapMeta = labelmap3D.metadata && labelmap3D.metadata.data;

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

      const ColouredCircle = () => {
        return (
          <div
            className="segment-color"
            style={{ backgroundColor: `rgba(${color.join(',')})` }}
          ></div>
        );
      };

      const sameSegment = selectedSegment === segmentNumber;
      const setCurrentSelectedSegment = () => {
        _setActiveSegment(firstImageId, segmentNumber, labelmap3D.activeSegmentIndex);
        setSelectedSegment(sameSegment ? null : segmentNumber);
      };

      segmentList.push(
        <TableListItem
          key={segmentNumber}
          itemKey={segmentNumber}
          itemIndex={segmentNumber}
          itemClass={`segment-item ${sameSegment && 'selected'}`}
          itemMeta={<ColouredCircle />}
          itemMetaClass="segment-color-section"
          onItemClick={setCurrentSelectedSegment}
        >
          <div>
            <div className="segment-label" style={{ marginBottom: 4 }}>
              {segmentLabel}
            </div>
            {false && <div className="segment-info">{'...'}</div>}
            <div className="segment-actions">
              <button
                className="btnAction"
                onClick={() => console.log('Relabelling...')}
              >
                <span style={{ marginRight: '4px' }}>
                  <Icon name="edit" width="14px" height="14px" />
                </span>
                Relabel
              </button>
              <button
                className="btnAction"
                onClick={() => console.log('Editing description...')}
              >
                <span style={{ marginRight: '4px' }}>
                  <Icon name="edit" width="14px" height="14px" />
                </span>
                Description
              </button>
            </div>
          </div>
        </TableListItem>
      );
    }

    /*
     * Let's iterate over segmentIndexes ^ above
     * If meta has a match, use it to show info
     * If now, add "no-meta" class
     * Show default name
     */
  }

  const updateBrushSize = evt => {
    const updatedRadius = Number(evt.target.value);

    if (updatedRadius !== brushRadius) {
      setBrushRadius(updatedRadius);
      segmentationModule.setters.radius(updatedRadius);
    }
  };

  const decrementSegment = event => {
    event.preventDefault();
    if (labelmap3D.activeSegmentIndex > 1) {
      labelmap3D.activeSegmentIndex--;
    }
    setActiveSegmentColor();
  };

  const incrementSegment = event => {
    event.preventDefault();
    labelmap3D.activeSegmentIndex++;
    setActiveSegmentColor();
  };

  const setActiveSegmentColor = () => {
    const color = getActiveSegmentColor();
    setBrushColor(color);
  };

  const getActiveSegmentColor = () => {
    if (!brushStackState) {
      return 'rgba(255, 255, 255, 1)';
    }

    const colorLutTable =
      segmentationModule.state.colorLutTables[labelmap3D.colorLUTIndex];
    const color = colorLutTable[labelmap3D.activeSegmentIndex];

    return `rgba(${color.join(',')})`;
  };

  const updateConfiguration = newConfiguration => {
    /* Supported configuration */
    configuration.renderFill = newConfiguration.renderFill;
    configuration.renderOutline = newConfiguration.renderOutline;
    configuration.shouldRenderInactiveLabelmaps = newConfiguration.shouldRenderInactiveLabelmaps;
    configuration.fillAlpha = newConfiguration.fillAlpha;
    configuration.outlineAlpha = newConfiguration.outlineAlpha;
    configuration.outlineWidth = newConfiguration.outlineWidth;
    configuration.fillAlphaInactive = newConfiguration.fillAlphaInactive;
    configuration.outlineAlphaInactive = newConfiguration.outlineAlphaInactive;
    refreshViewport();
  };

  const { configuration } = segmentationModule;

  if (showSegSettings) {
    return (
      <SegmentationSettings
        configuration={configuration}
        onBack={() => setShowSegSettings(false)}
        onChange={updateConfiguration}
      />
    );
  } else {
    return (
      <div className="labelmap-container">
        <Icon
          className="cog-icon"
          name="cog"
          width="25px"
          height="25px"
          onClick={() => setShowSegSettings(true)}
        />
        {false && (
          <form className="selector-form">
            <BrushColorSelector
              defaultColor={brushColor}
              index={labelmap3D.activeSegmentIndex}
              onNext={incrementSegment}
              onPrev={decrementSegment}
            />
            <BrushRadius value={brushRadius} onChange={updateBrushSize} />
          </form>
        )}
        <h3>Segmentations</h3>
        <div className="segmentations">
          <Select
            value={labelmapList.find(i => i.value === brushStackState.activeLabelmapIndex) || null}
            formatOptionLabel={SegmentationItem}
            options={labelmapList}
            styles={segmentationSelectStyles}
          />
        </div>
        <ScrollableArea>
          <TableList customHeader={<SegmentsHeader count={segmentList.length} />}>
            {segmentList}
          </TableList>
        </ScrollableArea>
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
    displaySetInstanceUid: PropTypes.string,
    framRate: PropTypes.any,
    instanceNumber: PropTypes.number,
    isMultiFrame: PropTypes.bool,
    isReconstructable: PropTypes.bool,
    modality: PropTypes.string,
    plugin: PropTypes.string,
    seriesDate: PropTypes.string,
    seriesDescription: PropTypes.string,
    seriesInstanceUid: PropTypes.string,
    seriesNumber: PropTypes.any,
    seriesTime: PropTypes.string,
    sopClassUids: PropTypes.arrayOf(PropTypes.string),
    studyInstanceUid: PropTypes.string,
  }),
  activeIndex: PropTypes.number.isRequired,
  studies: PropTypes.array.isRequired,
};
SegmentationPanel.defaultProps = {};

const _getFirstImageId = ({ studyInstanceUid, displaySetInstanceUid }) => {
  try {
    const studyMetadata = studyMetadataManager.get(studyInstanceUid);
    const displaySet = studyMetadata.findDisplaySet(
      displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
    );
    return displaySet.images[0].getImageId();
  } catch (error) {
    console.error('Failed to retrieve image metadata');
    return null;
  }
};

/**
 * Returns SEG Displaysets that reference the target series, sorted by dateTime
 *
 * @param {string} studyInstanceUid
 * @param {string} seriesInstanceUid
 * @returns Array
 */
const _getReferencedSegDisplaysets = (studyInstanceUid, seriesInstanceUid) => {
  /* Referenced DisplaySets */
  const studyMetadata = studyMetadataManager.get(studyInstanceUid);
  const referencedDisplaysets = studyMetadata.getDerivedDatasets({
    referencedSeriesInstanceUID: seriesInstanceUid,
    modality: 'SEG',
  });

  /* Sort */
  referencedDisplaysets.sort((a, b) => {
    const aNumber = Number(`${a.seriesDate}${a.seriesTime}`);
    const bNumber = Number(`${b.seriesDate}${b.seriesTime}`);
    return aNumber - bNumber;
  });

  return referencedDisplaysets;
};

/**
 *
 *
 * @param {*} viewportSpecificData
 * @param {*} studies
 * @param {*} displaySet
 * @param {*} firstImageId
 * @param {*} activeLabelmapIndex
 * @returns
 */
const _setActiveLabelmap = async (
  viewportSpecificData,
  studies,
  displaySet,
  firstImageId,
  activeLabelmapIndex
) => {
  if (displaySet.labelmapIndex === activeLabelmapIndex) {
    console.warn(`${activeLabelmapIndex} is already the active labelmap`);
    return;
  }

  if (!displaySet.isLoaded) {
    // What props does this expect `viewportSpecificData` to have?
    // TODO: Should this return the `labelmapIndex`?
    await displaySet.load(viewportSpecificData, studies);
  }

  const { state } = cornerstoneTools.getModule('segmentation');
  const brushStackState = state.series[firstImageId];

  brushStackState.activeLabelmapIndex = displaySet.labelmapIndex;

  refreshViewport();

  return displaySet.labelmapIndex;
};

/**
 *
 * @param {*} firstImageId
 * @param {*} activeSegmentIndex
 * @returns
 */
const _setActiveSegment = (
  firstImageId,
  segmentIndex,
  activeSegmentIndex
) => {
  if (segmentIndex === activeSegmentIndex) {
    console.warn(`${activeSegmentIndex} is already the active segment`);
    return;
  }

  const { state } = cornerstoneTools.getModule('segmentation');
  const brushStackState = state.series[firstImageId];

  const labelmap3D =
    brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];
  labelmap3D.activeSegmentIndex = segmentIndex;

  refreshViewport();

  return segmentIndex;
};

const segmentationSelectStyles = {
  control: (base, state) => ({
    ...base,
    cursor: 'pointer',
    background: '#151A1F',
    borderRadius: state.isFocused ? '5px 5px 5px 5px' : 5,
    borderColor: state.isFocused ? '#20a5d6' : '#9CCEF9',
    boxShadow: state.isFocused ? null : null,
    minHeight: '50px',
    '&:hover': {
      borderColor: '#20a5d6',
    },
  }),
  menu: base => ({
    ...base,
    borderRadius: 5,
    background: '#151A1F',
  }),
  option: (base, state) => ({
    ...base,
    cursor: 'pointer',
    '&:first-of-type': {
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
    },
    '&:last-of-type': {
      borderBottomLeftRadius: 5,
      borderBottomRightRadius: 5,
    },
    background: state.isSelected ? '#16202B' : '#151A1F',
    '&:hover': {
      background: '#16202B',
    },
  }),
};

const SegmentationItem = ({ onClick, title, description }) => {
  return (
    <li className="segmentation-item" onClick={onClick}>
      <div className="segmentation-meta">
        <div className="segmentation-meta-title">{title}</div>
        <div className="segmentation-meta-description">{description}</div>
      </div>
    </li>
  );
};

SegmentationItem.propTypes = {
  onClick: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
};

const BrushColorSelector = ({ defaultColor, index, onNext, onPrev }) => (
  <div>
    <div
      className="selector-active-segment"
      style={{ backgroundColor: defaultColor }}
    >
      {index}
    </div>
    <div className="selector-buttons">
      <button className="db-button" onClick={onPrev}>
        Previous
      </button>
      <button className="db-button" onClick={onNext}>
        Next
      </button>
    </div>
  </div>
);

const SegmentsHeader = ({ count }) => {
  return (
    <React.Fragment>
      <div className="tableListHeaderTitle">Segments</div>
      <div className="numberOfItems">{count}</div>
    </React.Fragment>
  );
};

const BrushRadius = ({ value, onChange }) => (
  <div className="brush-radius">
    <label htmlFor="brush-radius">Brush Radius</label>
    <Range
      value={value}
      min={1}
      max={50}
      step={1}
      onChange={onChange}
      id="brush-radius"
    />
  </div>
);

export default SegmentationPanel;
