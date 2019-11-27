import React, { useState, useEffect } from 'react';
import { utils } from '@ohif/core';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
//
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import classnames from 'classnames';
import moment from 'moment';
import './ExampleSidePanel.css';

const { studyMetadataManager } = utils;

function ExampleSidePanel(props) {
  const {
    studies,
    viewports, // viewportSpecificData
  } = props;

  // TODO: Needs to be activeViewport
  const viewport = viewports[0];

  // No viewports, nothing to render
  // if (!viewport) {
  //   return null;
  // }

  const {
    studyInstanceUid,
    seriesInstanceUid,
    displaySetInstanceUid,
  } = viewport;
  const [state, setState] = useState({
    activeLabelmapIndex: undefined,
    firstImageId: undefined,
  });

  // Find our activeLabelmapIndex and activeLabelmap
  // TODO: Another useEffect that captures cornerstone events where these are modified
  useEffect(() => {
    const segmentationModule = cornerstoneTools.getModule('segmentation');
    const studyMetadata = studyMetadataManager.get(studyInstanceUid);
    const displaySet = studyMetadata.findDisplaySet(
      displaySet => displaySet.displaySetInstanceUid === displaySetInstanceUid
    );
    const firstImageId = displaySet.images[0].getImageId();

    if (segmentationModule.state.series[firstImageId]) {
      const activeBrushStackState =
        segmentationModule.state.series[firstImageId];

      setState({
        activeLabelmapIndex: activeBrushStackState.activeLabelmapIndex,
        firstImageId: firstImageId,
      });
      //activeLabelmap3D = activeBrushStackState.labelmaps3D[activeLabelmapIndex];
    }
  }, [displaySetInstanceUid, studyInstanceUid]);

  useEffect(() => {
    const labelmapModifiedHandler = function(evt) {
      console.log(evt);
    };
    cornerstone.events.addEventListener(
      'cornersontetoolslabelmapmodified',
      labelmapModifiedHandler
    );

    return () => {
      cornerstone.events.removeEventListener(
        'cornersontetoolslabelmapmodified',
        labelmapModifiedHandler
      );
    };
  });

  // Get list of SEG labelmaps specific to active viewport (reference series)
  const segModule = cornerstoneTools.getModule('segmentation');
  console.log('SEG MODULE', segModule);
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
    const { activeLabelmapIndex } = state;

    // Map to display representation
    const dateStr = `${seriesDate}:${seriesTime}`.split('.')[0];
    const date = moment(dateStr, 'YYYYMMDD:HHmmss');
    const isActiveLabelmap = labelmapIndex === activeLabelmapIndex;
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
            state.firstImageId,
            state.activeLabelmapIndex
          );

          if (typeof activatedLabelmapIndex == 'number') {
            setState(
              Object.assign({}, state, {
                activeLabelmapIndex: activatedLabelmapIndex,
              })
            );
          }
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

  if (state.activeLabelmapIndex !== undefined) {
    const brushStackState = segModule.state.series[state.firstImageId];
    const labelmap3D = brushStackState.labelmaps3D[state.activeLabelmapIndex];

    if (labelmap3D) {
      const colorLutTable =
        segModule.state.colorLutTables[labelmap3D.colorLUTIndex];
      const segmentsMeta = labelmap3D.metadata.data;
      for (
        let segmentIndex = 0;
        segmentIndex < segmentsMeta.length;
        segmentIndex++
      ) {
        const segment = segmentsMeta[segmentIndex];

        if (!segment) {
          continue;
        }
        const color = colorLutTable[segmentIndex];

        segmentList.push(
          <li key={segment.SegmentNumber} className="segment-list-item">
            <div
              className="segment-color"
              style={{ backgroundColor: `rgba(${color.join(',')})` }}
            ></div>
            <div className="segment-label">{segment.SegmentLabel}</div>
          </li>
        );
      }
    }
  }

  return (
    <div className="labelmap-container">
      <h2 style={{ marginLeft: '16px' }}>Labelmaps</h2>
      <ul className="unlist labelmap-list">{labelmapList}</ul>

      <h3 style={{ marginLeft: '16px' }}>Segments</h3>
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
