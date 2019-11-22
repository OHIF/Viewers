import React, { Component } from 'react';
import { utils } from '@ohif/core';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
//
import cornerstoneTools from 'cornerstone-tools';
import classnames from 'classnames';

const { studyMetadataManager } = utils;

class ExampleSidePanel extends Component {
  constructor(props) {
    super(props);

    // this.switchSegmentation = this.switchSegmentation.bind(this);
  }

  static propTypes = {
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
  static defaultProps = {};

  // TODO -> Check if the segmentation has a defined labelmapIndex:
  // -> if not, call `load` first.
  // -> If so, proceed:

  //Set the active labelmap like this:

  // Get imageIds for stack -> get first imageId. (see loadSegmentation.js)
  // Get the brushStackState by:
  //  const { state } = cornerstoneTools.getModule('segmentation');
  //  const brushStackState = state[firstImageId];
  // Set the labelmapIndex to active:
  //    brushStackState.activeLabelmapIndex = segmentation.labelmapIndex.

  // If the port is cornerstone, just need to call a re-render.
  // If the port is vtkjs, its a bit more tricky as we now need to create a new
  // volume -> Not sure how we pass that information down there to parse the different volume.
  // Might need to be an event.

  render() {
    const viewport = this.props.viewports[0];
    if (!viewport) {
      return null;
    }

    // May need to update in useEffect
    const { studyInstanceUid, seriesInstanceUid } = viewport;
    const referencedSegDisplaysets = _getReferencedSegDisplaysets(
      studyInstanceUid,
      seriesInstanceUid
    );
    const mappedSegDisplaysets = referencedSegDisplaysets.map(ds => {
      return {
        seriesDate: ds.seriesDate,
        seriesTime: ds.seriesTime,
        isLoaded: ds.isLoaded, // bool
        load: ds.load, // fn
        labelmapIndex: ds.labelmapIndex, // csTools
      };
    });
    // displaySetInstanceUid? (string)
    // seriesInstanceUid? (string)
    // sopInstanceUid?
    // sopClassModule? (bool)
    // referencedSeriesSequence{
    //   referencedInstanceSequence[] --> referencedSOPClassUID, referencedSOPInstanceUID
    //   referencedSeriesInstanceUID: string
    // }
    console.log(referencedSegDisplaysets);

    const segmentationModule = cornerstoneTools.getModule('segmentation');
    const { getters, setters } = segmentationModule;
    const {
      activeLabelmapIndex,
      activeSegmentIndex,
      brushColor,
      metadata,
    } = getters;
    // const { activeLabelmapIndex, decrementActiveSegmentIndex, incrementActiveSegmentIndex, undo, redo } = setters;

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
        {mappedSegDisplaysets.map(ds => (
          <div
            key={`${ds.seriesDate}${ds.seriesTime}`}
            className={classnames({
              isActive: ds.labelmapIndex === activeLabelmapIndex,
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
              console.log('CLICK');
              console.log(ds);
              _setActiveLabelmap(viewport, this.props.studies, ds);
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
}

/**
 *
 * @param {*} studyInstanceUid
 * @param {*} seriesInstanceUid
 */
function _getReferencedSegDisplaysets(studyInstanceUid, seriesInstanceUid) {
  // Referenced DisplaySets
  const studyMetadata = studyMetadataManager.get(studyInstanceUid);

  const referencedDisplaysets = studyMetadata.getDerivedDatasets({
    referencedSeriesInstanceUID: seriesInstanceUid,
    // modality: 'SEG',
  });

  const displaySetsPerPlugin = {};

  // Group
  referencedDisplaysets.forEach(displaySet => {
    const plugin = displaySet.plugin;

    if (displaySetsPerPlugin[plugin] === undefined) {
      displaySetsPerPlugin[plugin] = [];
    }

    displaySetsPerPlugin[plugin].push(displaySet);
  });

  // Sort
  function sortNumber(a, b) {
    const aNumber = Number(`${a.seriesDate}${a.seriesTime}`);
    const bNumber = Number(`${b.seriesDate}${b.seriesTime}`);

    return aNumber - bNumber;
  }
  Object.keys(displaySetsPerPlugin).forEach(key => {
    const displaySets = displaySetsPerPlugin[key];
    // const isLoaded = displaySets.some(displaySet => displaySet.isLoaded);
    displaySets.sort(sortNumber);
  });

  // Filter
  const filteredDisplaysets = displaySetsPerPlugin['seg'] || [];

  return filteredDisplaysets;
}

/**
 *
 * @param {*} ds
 */
function _setActiveLabelmap(viewportSpecificData, studies, displaySet) {
  const { getters, setters } = cornerstoneTools.getModule('segmentation');
  const { activeLabelmapIndex, metadata } = getters;

  console.log(
    'viwportSpecificData: ',
    viewportSpecificData,
    studies,
    displaySet
  );
  const { state } = cornerstoneTools.getModule('segmentation');
  // const brushStackState = state[firstImageId];
  // Set the labelmapIndex to active:
  //    brushStackState.activeLabelmapIndex = segmentation.labelmapIndex.

  console.log('clicked', displaySet);
  console.log('meta', metadata());

  if (displaySet.labelmapIndex == activeLabelmapIndex) {
    return;
  }

  if (!displaySet.isLoaded) {
    // Instance of `viewportSpecificData` (for activeViewport)
    // All studies?
    console.log(viewportSpecificData);
    // const studyMetadata = studyMetadataManager.get(
    //   viewportSpecificData.studyInstanceUid
    // );
    const doesThisGiveMeAnId = displaySet.load(viewportSpecificData, studies);
    console.log('loading...', doesThisGiveMeAnId);

    const { studyInstanceUid, seriesInstanceUid } = viewportSpecificData;
    const referencedSegDisplaysets = _getReferencedSegDisplaysets(
      studyInstanceUid,
      seriesInstanceUid
    );
    const mappedSegDisplaysets = referencedSegDisplaysets.map(ds => {
      return {
        seriesDate: ds.seriesDate,
        seriesTime: ds.seriesTime,
        isLoaded: ds.isLoaded, // bool
        load: ds.load, // fn
        labelmapIndex: ds.labelmapIndex, // csTools
      };
    });

    console.log(mappedSegDisplaysets);
  }

  // setters.activeLabelmapIndex(doesThisGiveMeAnId);
}

export default ExampleSidePanel;
