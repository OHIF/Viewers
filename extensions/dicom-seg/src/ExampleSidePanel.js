import React, { useState, useEffect } from 'react';
import { utils } from '@ohif/core';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
//
import cornerstoneTools from 'cornerstone-tools';
import classnames from 'classnames';

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

  // Get list of SEG labelmaps specific to active viewport (reference series)
  const referencedSegDisplaysets = _getReferencedSegDisplaysets(
    studyInstanceUid,
    seriesInstanceUid
  );

  // 1. Update labelmap...
  // 2. UseEffect to update state? or to a least trigger a re-render
  // 3. Pull in seg names for each labelmap
  // 4. Toggle visibility of labelmap?
  // 5. Toggle visibility of seg?
  // 6. Jump to seg?

  // If the port is cornerstone, just need to call a re-render.
  // If the port is vtkjs, its a bit more tricky as we now need to create a new

  return (
    <div
      style={{
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px',
      }}
    >
      <h3>Labelmaps</h3>
      {referencedSegDisplaysets.map(ds => (
        <div
          key={`${ds.seriesDate}${ds.seriesTime}`}
          className={classnames({
            isActive: ds.labelmapIndex === state.activeLabelmapIndex,
          })}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            cursor: 'pointer',
            borderBottom: '1px solid var(--ui-gray-light)',
            padding: '8px',
            margin: '4px',
          }}
          // CLICK BLOCKED BY DRAGGABLEAREA
          onClick={() => {
            // TODO: Await?
            _setActiveLabelmap(
              viewport,
              studies,
              ds,
              state.firstImageId,
              state.activeLabelmapIndex
            );
            setState(
              Object.assign({}, state, {
                activeLabelmapIndex: ds.labelmapIndex,
              })
            );
          }}
        >
          <Icon name="exclamation-triangle" />
          <div
            style={{
              backgroundColor: 'dodgerblue',
            }}
          >
            {ds.seriesDate}:{ds.seriesTime}
          </div>
        </div>
      ))}
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

  console.log('UPDATED DISPLAYSET', displaySet, displaySet.labelmapIndex);

  const { state } = cornerstoneTools.getModule('segmentation');
  const brushStackState = state.series[firstImageId];

  // Set the labelmapIndex to active:
  console.log('setting active labelmap index to: ', displaySet.labelmapIndex);
  brushStackState.activeLabelmapIndex = displaySet.labelmapIndex;

  return displaySet.labelmapIndex;
}

export default ExampleSidePanel;
