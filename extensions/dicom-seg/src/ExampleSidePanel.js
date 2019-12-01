import React, { useState, useEffect } from 'react';
import { utils } from '@ohif/core';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
//
import cornerstoneTools from 'cornerstone-tools';
import classnames from 'classnames';
import moment from 'moment';
import { Range } from '@ohif/ui';
import './ExampleSidePanel.css';

const { studyMetadataManager } = utils;

function ExampleSidePanel(props) {
  const {
    studies,
    viewports, // viewportSpecificData
    activeIndex, // activeViewportIndex
  } = props;

  const segModule = cornerstoneTools.getModule('segmentation');
  const viewport = viewports[activeIndex];
  const {
    studyInstanceUid,
    seriesInstanceUid,
    displaySetInstanceUid,
  } = viewport;
  // This technically defaults to 10 if undefined (bug?)
  const [brushRadius, setBrushRadius] = useState(
    segModule.getters.radius || 10
  );
  const [brushColor, setBrushColor] = useState('rgba(221, 85, 85, 1)');

  // meta
  const studyMetadata = studyMetadataManager.get(studyInstanceUid);
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
  );
  const firstImageId = displaySet.images[0].getImageId();

  // CORNERSTONE TOOLS
  const [brushStackState, setBrushStackState] = useState(
    segModule.state.series[firstImageId]
  );
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const labelmapModifiedHandler = function(evt) {
      console.warn('labelmap modified', evt);
      const segmentationModule = cornerstoneTools.getModule('segmentation');
      setBrushStackState(segmentationModule.state.series[firstImageId]);
      setUpdateCount(updateCount + 1);
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

  // Get list of SEG labelmaps specific to active viewport (reference series)
  const referencedSegDisplaysets = _getReferencedSegDisplaysets(
    studyInstanceUid,
    seriesInstanceUid
  );

  // 2. UseEffect to update state? or to a least trigger a re-render
  // 4. Toggle visibility of labelmap?
  // 5. Toggle visibility of seg?

  // If the port is cornerstone, just need to call a re-render.
  // If the port is vtkjs, its a bit more tricky as we now need to create a new

  const labelmapList = referencedSegDisplaysets.map(ds => {
    const { labelmapIndex, seriesDate, seriesTime } = ds;

    // Map to display representation
    const dateStr = `${seriesDate}:${seriesTime}`.split('.')[0];
    const date = moment(dateStr, 'YYYYMMDD:HHmmss');
    const isActiveLabelmap =
      labelmapIndex === brushStackState.activeLabelmapIndex;
    const displayDate = date.format('ddd, MMM Do YYYY');
    const displayTime = date.format('h:mm:ss a');
    const displayDescription = ds.seriesDescription;

    return (
      <li
        key={`${seriesDate}${seriesTime}`}
        className={classnames('labelmap-item', {
          isActive: isActiveLabelmap,
        })}
        // CLICK BLOCKED BY DRAGGABLEAREA
        // Specific to UIDialogService
        onClick={async () => {
          const activatedLabelmapIndex = await _setActiveLabelmap(
            viewport,
            studies,
            ds,
            firstImageId,
            brushStackState.activeLabelmapIndex
          );

          // TODO: Notify of change?
          setUpdateCount(updateCount + 1);
        }}
      >
        <Icon
          style={{
            marginRight: '8px',
            marginTop: '12px',
            minWidth: '14px',
            color: isActiveLabelmap ? '#FFF' : '#000',
          }}
          name="star"
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: '1',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {displayDescription}
          </div>
          <div style={{ color: '#BABABA' }}>{displayDate}</div>
        </div>
      </li>
    );
  });

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
      segModule.state.colorLutTables[labelmap3D.colorLUTIndex];
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

      segmentList.push(
        <li key={segmentNumber} className="segment-list-item">
          <div
            className="segment-color"
            style={{ backgroundColor: `rgba(${color.join(',')})` }}
          >
            {segmentNumber}
          </div>
          <div className="segment-label">{segmentLabel}</div>
        </li>
      );
    }

    // Let's iterate over segmentIndexes ^ above
    // If meta has a match, use it to show info
    // If now, add "no-meta" class
    // Show default name
  }

  function updateBrushSize(evt) {
    const updatedRadius = Number(evt.target.value);

    if (updatedRadius !== brushRadius) {
      setBrushRadius(updatedRadius);
      segModule.setters.radius(updatedRadius);
    }
  }

  function incrementSegment(shouldIncrement = true) {
    if (shouldIncrement) {
      labelmap3D.activeSegmentIndex++;
    } else {
      if (labelmap3D.activeSegmentIndex > 1) {
        labelmap3D.activeSegmentIndex--;
      }
    }

    const color = getActiveSegmentColor();
    setBrushColor(color);
  }

  function getActiveSegmentColor() {
    if (!brushStackState) {
      return 'rgba(255, 255, 255, 1)';
    }

    const colorLutTable =
      segModule.state.colorLutTables[labelmap3D.colorLUTIndex];
    const color = colorLutTable[labelmap3D.activeSegmentIndex];

    return `rgba(${color.join(',')})`;
  }

  return (
    <div className="labelmap-container">
      <h2 style={{ marginLeft: '16px' }}>Segmentation</h2>

      <form style={{ padding: '0px 16px' }}>
        <div
          style={{
            display: 'flex',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              borderRadius: '100%',
              backgroundColor: brushColor,
              width: '32px',
              height: '32px',
              marginTop: '8px',
              marginRight: '8px',
              textAlign: 'center',
              lineHeight: '32px',
            }}
          >
            {labelmap3D.activeSegmentIndex}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: '1',
            }}
          >
            <button
              className="db-button"
              onClick={evt => {
                evt.preventDefault();
                incrementSegment();
              }}
            >
              Next
            </button>
            <button
              className="db-button"
              onClick={evt => {
                evt.preventDefault();
                incrementSegment(false);
              }}
            >
              Previous
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="brush-radius"
            style={{
              display: 'block',
              marginBottom: '8px',
            }}
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
      </form>

      <h3 style={{ marginTop: '32px', marginLeft: '16px' }}>Labelmaps</h3>
      <ul className="unlist labelmap-list" style={{ marginBottom: '24px' }}>
        {labelmapList}
      </ul>

      <h3 style={{ marginTop: '32px', marginLeft: '16px' }}>Segments</h3>
      <ul className="unlist">{segmentList}</ul>
    </div>
  );
}

ExampleSidePanel.propTypes = {
  // An object, with int index keys?
  // Maps to: state.viewports.viewportSpecificData, in `viewer`
  // Passed in MODULE_TYPES.PANEL when specifying component in viewer
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
    // dom:
  }),
  studies: PropTypes.array.isRequired,
};
ExampleSidePanel.defaultProps = {};

/**
 * Returns SEG Displaysets that reference the target series, sorted by dateTime
 *
 * @param {string} studyInstanceUid
 * @param {string} seriesInstanceUid
 * @returns Array
 */
function _getReferencedSegDisplaysets(studyInstanceUid, seriesInstanceUid) {
  // Referenced DisplaySets
  const studyMetadata = studyMetadataManager.get(studyInstanceUid);
  const referencedDisplaysets = studyMetadata.getDerivedDatasets({
    referencedSeriesInstanceUID: seriesInstanceUid,
    modality: 'SEG',
  });

  // Sort
  function sortNumber(a, b) {
    const aNumber = Number(`${a.seriesDate}${a.seriesTime}`);
    const bNumber = Number(`${b.seriesDate}${b.seriesTime}`);

    return aNumber - bNumber;
  }

  referencedDisplaysets.sort(sortNumber);

  return referencedDisplaysets;
}

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
async function _setActiveLabelmap(
  viewportSpecificData,
  studies,
  displaySet,
  firstImageId,
  activeLabelmapIndex
) {
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
}

export default ExampleSidePanel;
