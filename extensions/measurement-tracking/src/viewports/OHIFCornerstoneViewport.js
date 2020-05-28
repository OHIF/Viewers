import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF, { DicomMetadataStore } from '@ohif/core';
import { ViewportActionBar } from '@ohif/ui';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';

// const [
//   trackedMeasurements,
//   sendTrackedMeasurementsEvent,
// ] = useTrackedMeasurements();


// const cine = viewportSpecificData.cine;

// isPlaying = cine.isPlaying === true;
// frameRate = cine.cineFrameRate || frameRate;

const { StackManager } = OHIF.utils;

function OHIFCornerstoneViewport({
  children,
  dataSource,
  displaySet,
  viewportIndex,
}) {
  const [viewportData, setViewportData] = useState(null);
  // TODO: Still needed? Better way than import `OHIF` and destructure?
  // Why is this managed by `core`?
  useEffect(() => {
    return () => {
      StackManager.clearStacks();
    };
  }, []);

  useEffect(() => {
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      sopClassUids,
    } = displaySet;

    if (!StudyInstanceUID || !displaySetInstanceUID) {
      return;
    }

    if (sopClassUids && sopClassUids.length > 1) {
      console.warn(
        'More than one SOPClassUID in the same series is not yet supported.'
      );
    }

    _getViewportData(dataSource, displaySet).then(viewportData => {
      setViewportData({ ...viewportData });
    });
  }, [
    displaySet,
    displaySet.StudyInstanceUID,
    displaySet.displaySetInstanceUID,
    displaySet.frameIndex,
  ]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let childrenWithProps = null;

  if (!viewportData) {
    return null;
  }

  const {
    imageIds,
    currentImageIdIndex,
    // If this comes from the instance, would be a better default
    // `FrameTime` in the instance
    // frameRate = 0,
  } = viewportData.stack;

  // TODO: Does it make more sense to use Context?
  if (children && children.length) {
    childrenWithProps = children.map((child, index) => {
      return (
        child &&
        React.cloneElement(child, {
          viewportIndex,
          key: index,
        })
      );
    });
  }

  // We have...
  // StudyInstanceUid, DisplaySetInstanceUid
  // Use displaySetInstanceUid --> SeriesInstanceUid
  // Get meta for series, map to actionBar
  // const displaySet = DisplaySetService.getDisplaySetByUID(
  //   dSet.displaySetInstanceUID
  // );
  // TODO: This display contains the meta for all instances.
  // That can't be right...
  console.log('DISPLAYSET', displaySet)
  // const seriesMeta = DicomMetadataStore.getSeries(this.props.displaySet.StudyInstanceUID, '');
  // console.log(seriesMeta);

  const { Modality, SeriesDate, SeriesDescription, SeriesNumber } = displaySet;
  const {
    PatientID,
    PatientName,
    PatientSex,
    PatientAge,
    SliceThickness,
  } = displaySet.images[0];

  return (
    <>
      <ViewportActionBar
        onSeriesChange={direction => alert(`Series ${direction}`)}
        studyData={{
          label: '',
          isTracked: false,
          isLocked: false,
          studyDate: SeriesDate, // TODO: This is series date. Is that ok?
          currentSeries: SeriesNumber,
          seriesDescription: SeriesDescription,
          modality: Modality,
          patientInformation: {
            patientName: PatientName ? PatientName.Alphabetic || '' : '',
            patientSex: PatientSex || '',
            patientAge: PatientAge || '',
            MRN: PatientID || '',
            thickness: `${SliceThickness}mm`,
            spacing: '',
            scanner: '',
          },
        }}
      />
      <CornerstoneViewport
        viewportIndex={viewportIndex}
        imageIds={imageIds}
        imageIdIndex={currentImageIdIndex}
        // TODO: ViewportGrid Context?
        isActive={true} // todo
        isStackPrefetchEnabled={true} // todo
        isPlaying={false}
        frameRate={24}
      />
      {childrenWithProps}
    </>
  );
}

OHIFCornerstoneViewport.propTypes = {
  displaySet: PropTypes.object.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

OHIFCornerstoneViewport.defaultProps = {
  customProps: {},
};

/**
 * Obtain the CornerstoneTools Stack for the specified display set.
 *
 * @param {Object} displaySet
 * @param {Object} dataSource
 * @return {Object} CornerstoneTools Stack
 */
function _getCornerstoneStack(displaySet, dataSource) {
  const { frameIndex } = displaySet;

  // Get stack from Stack Manager
  const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

  // Clone the stack here so we don't mutate it
  const stack = Object.assign({}, storedStack);

  stack.currentImageIdIndex = frameIndex;

  return stack;
}

async function _getViewportData(dataSource, displaySet) {
  let viewportData;

  const stack = _getCornerstoneStack(displaySet, dataSource);

  viewportData = {
    StudyInstanceUID: displaySet.StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    stack,
  };

  return viewportData;
};

export default OHIFCornerstoneViewport;
