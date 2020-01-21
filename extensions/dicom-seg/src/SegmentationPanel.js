import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import classnames from 'classnames';
import moment from 'moment';

import { utils } from '@ohif/core';
import {
  Icon,
  Range,
  ScrollableArea,
  TableList,
  TableListItem,
} from '@ohif/ui';

import './SegmentationPanel.css';

const { studyMetadataManager } = utils;

const segmentationModule = cornerstoneTools.getModule('segmentation');
const DEFAULT_BRUSH_RADIUS = segmentationModule.getters.radius || 10;

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

  const viewport = viewports[activeIndex];
  const firstImageId = _getFirstImageId(viewport);
  const { studyInstanceUid, seriesInstanceUid } = viewport;

  /* CornerstoneTools */
  const [brushStackState, setBrushStackState] = useState(
    segmentationModule.state.series[firstImageId]
  );
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const labelmapModifiedHandler = event => {
      console.warn('labelmap modified', event);
      setBrushStackState(segmentationModule.state.series[firstImageId]);
      setCounter(counter + 1);
    };

    // These are specific to each element;
    // Need to iterate cornerstone-tools tracked enabled elements?
    // Then only care about the one tied to active viewport?
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement =>
      enabledElement.addEventListener(
        'cornersontetoolslabelmapmodified',
        labelmapModifiedHandler
      )
    );

    return () => {
      cornerstoneTools.store.state.enabledElements.forEach(enabledElement =>
        enabledElement.removeEventListener(
          'cornersontetoolslabelmapmodified',
          labelmapModifiedHandler
        )
      );
    };
  });

  if (!brushStackState) {
    return null;
  }

  const labelmap3D =
    brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

  /* Get list of SEG labelmaps specific to active viewport (reference series) */
  const referencedSegDisplaysets = _getReferencedSegDisplaysets(
    studyInstanceUid,
    seriesInstanceUid
  );

  // 2. UseEffect to update state? or to a least trigger a re-render
  // 4. Toggle visibility of labelmap?
  // 5. Toggle visibility of seg?

  // If the port is cornerstone, just need to call a re-render.
  // If the port is vtkjs, its a bit more tricky as we now need to create a new

  const labelmapList = referencedSegDisplaysets.map(displaySet => {
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
      title: displayDescription,
      description: displayDate,
      isActive: isActiveLabelmap,
      className: classnames('labelmap-item', {
        isActive: isActiveLabelmap,
      }),
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

        // TODO: Notify of change?
        setCounter(counter + 1);
      },
    };
  });

  const SegmentationItem = ({
    onClick,
    className,
    title,
    isActive,
    description,
  }) => {
    return (
      <li className={className} onClick={onClick}>
        <Icon
          className="segmentation-icon"
          style={{ color: isActive ? '#FFF' : '#000' }}
          name="star"
        />
        <div className="segmentation-meta">
          <div className="segmentation-meta-title">{title}</div>
          <div style={{ color: '#BABABA' }}>{description}</div>
        </div>
      </li>
    );
  };
  SegmentationItem.propTypes = {
    onClick: PropTypes.func,
    className: PropTypes.string,
    isActive: PropTypes.bool,
    title: PropTypes.string,
    description: PropTypes.string,
  };

  const segmentList = [];

  if (labelmap3D) {
    // Newly created segments have no `meta`
    // So we instead build a list of all segment indexes in use
    // Then find any associated metadata
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

      // META
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
        setSelectedSegment(sameSegment ? null : segmentNumber);
      };

      segmentList.push(
        <TableListItem
          key={segmentNumber}
          itemKey={segmentNumber}
          itemIndex={segmentNumber}
          itemClass={`segment-item ${sameSegment && 'selected'}`}
          itemMeta={<ColouredCircle />}
          onItemClick={setCurrentSelectedSegment}
        >
          <div>
            <div className="segment-label">{segmentLabel}</div>
            <div>
              <div className="segment-info">
                {segmentLabel ? segmentLabel : '...'}
              </div>
            </div>
            <div className="segment-actions"></div>
          </div>
        </TableListItem>
      );
    }

    // Let's iterate over segmentIndexes ^ above
    // If meta has a match, use it to show info
    // If now, add "no-meta" class
    // Show default name
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

  const SegmentsHeader = () => {
    return (
      <React.Fragment>
        <div className="tableListHeaderTitle">Segments</div>
        <div className="numberOfItems">{segmentList.length}</div>
      </React.Fragment>
    );
  };

  return (
    <div className="labelmap-container">
      {false && <h2 style={{ marginLeft: '16px' }}>Segmentation</h2>}

      <form className="selector-form">
        {false && (
          <div>
            <div className="selector-active-segment">
              {labelmap3D.activeSegmentIndex}
            </div>
            <div className="selector-buttons">
              <button className="db-button" onClick={incrementSegment}>
                Next
              </button>
              <button className="db-button" onClick={decrementSegment}>
                Previous
              </button>
            </div>
          </div>
        )}

        {false && (
          <div>
            <label
              htmlFor="brush-radius"
              style={{ display: 'block', marginBottom: '8px' }}
            >
              Brush Radius
            </label>
            <Range
              value={brushRadius}
              min={1}
              max={50}
              step={1}
              onChange={updateBrushSize}
              id="brush-radius"
            />
          </div>
        )}
      </form>

      <h3 style={{ marginLeft: '16px' }}>Segmentations</h3>
      <div className="labelmap-list-container">
        <ScrollableArea>
          <ul className="unlist labelmap-list" style={{ marginBottom: '24px' }}>
            {labelmapList.map((item, index) => <SegmentationItem {...item} key={index} />)}
          </ul>
        </ScrollableArea>
      </div>
      <ScrollableArea>
        <TableList customHeader={<SegmentsHeader />}>{segmentList}</TableList>
      </ScrollableArea>
    </div>
  );
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
  const studyMetadata = studyMetadataManager.get(studyInstanceUid);
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
  );
  return displaySet.images[0].getImageId();
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

  return displaySet.labelmapIndex;
};

export default SegmentationPanel;
