import React, { Component } from 'react';
import { utils } from '@ohif/core';
import PropTypes from 'prop-types';

const { studyMetadataManager } = utils;

class ExampleSidePanel extends Component {
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
  };
  static defaultProps = {};

  render() {
    const viewport = this.props.viewports[0];
    if (!viewport) {
      return null;
    }

    const { studyInstanceUid, seriesInstanceUid } = viewport;
    const derivedReferencedDisplaysets = _getDerivedDisplaysetsThatReferenceSeries(
      studyInstanceUid,
      seriesInstanceUid
    );
    console.log(derivedReferencedDisplaysets);
    const groupedAndSortedDatasets = _groupAnddSortDisplaysetsByPlugin(
      derivedReferencedDisplaysets
    );
    console.log(groupedAndSortedDatasets);

    return <div style={{ color: 'white' }}>Hello :wave:</div>;
  }
}

function _getDerivedDisplaysetsThatReferenceSeries(
  studyInstanceUid,
  seriesInstanceUid
) {
  const studyMetadata = studyMetadataManager.get(studyInstanceUid);

  return (
    studyMetadata.getDerivedDatasets({
      referencedSeriesInstanceUID: seriesInstanceUid,
    }) || []
  );
}

function _groupAnddSortDisplaysetsByPlugin(displaysets) {
  const displaySetsPerPlugin = {};

  // Group
  displaysets.forEach(displaySet => {
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

  return displaySetsPerPlugin;
}

export default ExampleSidePanel;
