import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF, { DicomMetadataStore, utils } from '@ohif/core';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
} from '@ohif/ui';
import { useTrackedMeasurements } from './../getContextModule';

import ViewportOverlay from './ViewportOverlay';

const { formatDate } = utils;

// TODO -> Get this list from the list of tracked measurements.
const {
  ArrowAnnotateTool,
  BidirectionalTool,
  EllipticalRoiTool,
  LengthTool,
} = cornerstoneTools;

const BaseAnnotationTool = cornerstoneTools.importInternal(
  'base/BaseAnnotationTool'
);

// const cine = viewportSpecificData.cine;
// isPlaying = cine.isPlaying === true;
// frameRate = cine.cineFrameRate || frameRate;

const { StackManager } = OHIF.utils;

function TrackedCornerstoneViewport({
  children,
  dataSource,
  displaySet,
  viewportIndex,
  ToolBarService,
}) {
  const [trackedMeasurements] = useTrackedMeasurements();
  const [
    { activeViewportIndex, viewports },
    viewportGridService,
  ] = useViewportGrid();
  // viewportIndex, onSubmit
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();
  const [viewportData, setViewportData] = useState(null);
  const [element, setElement] = useState(null);
  const [isTracked, setIsTracked] = useState(false);
  // TODO: Still needed? Better way than import `OHIF` and destructure?
  // Why is this managed by `core`?
  useEffect(() => {
    return () => {
      StackManager.clearStacks();
    };
  }, []);

  useEffect(() => {
    if (!element) {
      return;
    }
    const allTools = cornerstoneTools.store.state.tools;
    const toolsForElement = allTools.filter(tool => tool.element === element);

    toolsForElement.forEach(tool => {
      if (
        tool instanceof ArrowAnnotateTool ||
        tool instanceof BidirectionalTool ||
        tool instanceof EllipticalRoiTool ||
        tool instanceof LengthTool
      ) {
        const configuration = tool.configuration;

        configuration.renderDashed = !isTracked;

        tool.configuration = configuration;
      }
    });

    const enabledElement = cornerstone.getEnabledElement(element);

    if (enabledElement.image) {
      cornerstone.updateImage(element);
    }
  }, [isTracked]);

  const onElementEnabled = evt => {
    const eventData = evt.detail;
    const targetElement = eventData.element;

    const allTools = cornerstoneTools.store.state.tools;

    const toolsForElement = allTools.filter(
      tool => tool.element === targetElement
    );

    toolsForElement.forEach(tool => {
      if (
        tool instanceof ArrowAnnotateTool ||
        tool instanceof BidirectionalTool ||
        tool instanceof EllipticalRoiTool ||
        tool instanceof LengthTool
      ) {
        const configuration = tool.configuration;

        configuration.renderDashed = !isTracked;

        tool.configuration = configuration;
      } else if (tool instanceof BaseAnnotationTool) {
        const configuration = tool.configuration;

        configuration.renderDashed = true;

        tool.configuration = configuration;
      }
    });

    const enabledElement = cornerstone.getEnabledElement(targetElement);

    if (enabledElement.image) {
      cornerstone.updateImage(targetElement);
    }

    setElement(targetElement);

    const OHIFCornerstoneEnabledElementEvent = new CustomEvent(
      'ohif-cornerstone-enabled-element-event',
      {
        detail: {
          enabledElement: targetElement,
          viewportIndex,
        },
      }
    );

    document.dispatchEvent(OHIFCornerstoneEnabledElementEvent);
  };

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

    /*
     * This grabs `imageIndex from first matching
     * We actually want whichever is at our `viewportIndex`
     */
    const { imageIndex } = viewports[viewportIndex];
    displaySet.imageIndex = imageIndex;

    _getViewportData(dataSource, displaySet).then(setViewportData);
  }, [dataSource, displaySet, viewports, viewportIndex]);

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
  // console.log('DISPLAYSET', displaySet);
  // const seriesMeta = DicomMetadataStore.getSeries(this.props.displaySet.StudyInstanceUID, '');
  // console.log(seriesMeta);

  // TODO: Share this logic so it isn't out of sync where we retrieve
  const firstViewportIndexWithMatchingDisplaySetUid = viewports.findIndex(
    vp => vp.displaySetInstanceUID === displaySet.displaySetInstanceUID
  );
  const { trackedSeries } = trackedMeasurements.context;

  const {
    Modality,
    SeriesDate,
    SeriesDescription,
    SeriesInstanceUID,
    SeriesNumber,
  } = displaySet;

  const {
    PatientID,
    PatientName,
    PatientSex,
    PatientAge,
    SliceThickness,
    PixelSpacing,
    ManufacturerModelName,
  } = displaySet.images[0];

  if (trackedSeries.includes(SeriesInstanceUID) !== isTracked) {
    setIsTracked(!isTracked);
  }

  const label =
    viewports.length > 1
      ? _viewportLabels[firstViewportIndexWithMatchingDisplaySetUid]
      : '';

  return (
    <>
      <ViewportActionBar
        onSeriesChange={direction => alert(`Series ${direction}`)}
        showNavArrows={viewportIndex === activeViewportIndex}
        studyData={{
          label,
          isTracked: trackedSeries.includes(SeriesInstanceUID),
          isLocked: false,
          studyDate: formatDate(SeriesDate), // TODO: This is series date. Is that ok?
          currentSeries: SeriesNumber,
          seriesDescription: SeriesDescription,
          modality: Modality,
          patientInformation: {
            patientName: PatientName
              ? OHIF.utils.formatPN(PatientName.Alphabetic)
              : '',
            patientSex: PatientSex || '',
            patientAge: PatientAge || '',
            MRN: PatientID || '',
            thickness: SliceThickness ? `${SliceThickness.toFixed(2)}mm` : '',
            spacing:
              PixelSpacing && PixelSpacing.length
                ? `${PixelSpacing[0].toFixed(2)}mm x ${PixelSpacing[1].toFixed(
                  2
                )}mm`
                : '',
            scanner: ManufacturerModelName || '',
          },
        }}
      />
      {/* TODO: Viewport interface to accept stack or layers of content like this? */}
      <div className="relative flex flex-row w-full h-full">
        <CornerstoneViewport
          onElementEnabled={onElementEnabled}
          viewportIndex={viewportIndex}
          imageIds={imageIds}
          imageIdIndex={currentImageIdIndex}
          onNewImageDebounceTime={700}
          onNewImage={({ currentImageIdIndex }) => {
            viewportGridService.setDisplaysetForViewport({
              viewportIndex: activeViewportIndex,
              displaySetInstanceUID: displaySet.displaySetInstanceUID,
              imageIndex: currentImageIdIndex,
            });
          }}
          // TODO: ViewportGrid Context?
          isActive={true} // todo
          isStackPrefetchEnabled={true} // todo
          isPlaying={false}
          frameRate={24}
          isOverlayVisible={true}
          viewportOverlayComponent={props => {
            return (
              <ViewportOverlay
                {...props}
                activeTools={ToolBarService.getActiveTools()}
              />
            );
          }}
        />
        <div className="absolute w-full">
          {viewportDialogState.viewportIndex === viewportIndex && (
            <Notification
              message={viewportDialogState.message}
              type={viewportDialogState.type}
              actions={viewportDialogState.actions}
              onSubmit={viewportDialogState.onSubmit}
              onOutsideClick={viewportDialogState.onOutsideClick}
            />
          )}
        </div>
        {childrenWithProps}
      </div>
    </>
  );
}

TrackedCornerstoneViewport.propTypes = {
  displaySet: PropTypes.object.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

TrackedCornerstoneViewport.defaultProps = {
  customProps: {},
};

const _viewportLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

/**
 * Obtain the CornerstoneTools Stack for the specified display set.
 *
 * @param {Object} displaySet
 * @param {Object} dataSource
 * @return {Object} CornerstoneTools Stack
 */
function _getCornerstoneStack(displaySet, dataSource) {
  const { imageIndex } = displaySet;

  // Get stack from Stack Manager
  const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

  // Clone the stack here so we don't mutate it
  const stack = Object.assign({}, storedStack);

  stack.currentImageIdIndex = imageIndex;

  return stack;
}

/**
 * Builds the viewport data from a datasource and a displayset.
 *
 * @param {Object} dataSource
 * @param {Object} displaySet
 * @return {Object} viewport data
 */
async function _getViewportData(dataSource, displaySet) {
  const stack = _getCornerstoneStack(displaySet, dataSource);

  const viewportData = {
    StudyInstanceUID: displaySet.StudyInstanceUID,
    displaySetInstanceUID: displaySet.displaySetInstanceUID,
    stack,
  };

  return viewportData;
}

export default TrackedCornerstoneViewport;
