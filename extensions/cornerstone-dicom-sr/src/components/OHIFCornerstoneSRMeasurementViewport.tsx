import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { setTrackingUniqueIdentifiersForElement } from '../tools/modules/dicomSRModule';

import createReferencedImageDisplaySet from '../utils/createReferencedImageDisplaySet';
import { usePositionPresentationStore, OHIFCornerstoneViewport } from '@ohif/extension-cornerstone';
import { useViewportGrid } from '@ohif/ui-next';
import { useSystem } from '@ohif/core/src/contextProviders/SystemProvider';

const SR_TOOLGROUP_BASE_NAME = 'SRToolGroup';

function OHIFCornerstoneSRMeasurementViewport(props) {
  const { servicesManager } = useSystem();
  const { children, dataSource, displaySets, viewportOptions } = props as {
    children: React.ReactNode;
    dataSource: unknown;
    displaySets: AppTypes.DisplaySet[];
    viewportOptions: AppTypes.ViewportOptions;
  };

  const { displaySetService } = servicesManager.services;

  const viewportId = viewportOptions.viewportId;

  // SR viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SR viewport should only have a single display set');
  }

  const srDisplaySet = displaySets[0];

  const { setPositionPresentation } = usePositionPresentationStore();

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [measurementSelected, setMeasurementSelected] = useState(0);
  const [activeImageDisplaySetData, setActiveImageDisplaySetData] = useState(null);
  const [referencedDisplaySetMetadata, setReferencedDisplaySetMetadata] = useState(null);
  const [element, setElement] = useState(null);
  const { viewports, activeViewportId } = viewportGrid;

  const setTrackingIdentifiers = useCallback(
    measurementSelected => {
      const { measurements } = srDisplaySet;

      setTrackingUniqueIdentifiersForElement(
        element,
        measurements.map(measurement => measurement.TrackingUniqueIdentifier),
        measurementSelected
      );
    },
    [element, measurementSelected, srDisplaySet]
  );

  /**
   * OnElementEnabled callback which is called after the cornerstoneExtension
   * has enabled the element. Note: we delegate all the image rendering to
   * cornerstoneExtension, so we don't need to do anything here regarding
   * the image rendering, element enabling etc.
   */
  const onElementEnabled = evt => {
    setElement(evt.detail.element);
  };

  const updateViewport = useCallback(
    newMeasurementSelected => {
      const { StudyInstanceUID, displaySetInstanceUID } = srDisplaySet;

      if (!StudyInstanceUID || !displaySetInstanceUID) {
        return;
      }

      _getViewportReferencedDisplaySetData(
        srDisplaySet,
        newMeasurementSelected,
        displaySetService
      ).then(({ referencedDisplaySet, referencedDisplaySetMetadata }) => {
        if (!referencedDisplaySet || !referencedDisplaySetMetadata) {
          return;
        }

        setMeasurementSelected(newMeasurementSelected);

        setActiveImageDisplaySetData(referencedDisplaySet);
        setReferencedDisplaySetMetadata(referencedDisplaySetMetadata);

        const { presentationIds } = viewportOptions;
        const measurement = srDisplaySet.measurements[newMeasurementSelected];
        setPositionPresentation(presentationIds.positionPresentationId, {
          viewReference: measurement.viewReference || {
            referencedImageId: measurement.imageId,
          },
        });
      });
    },
    [dataSource, srDisplaySet, activeImageDisplaySetData, viewportId]
  );

  const getCornerstoneViewport = useCallback(() => {
    if (!activeImageDisplaySetData) {
      return null;
    }

    const { measurements } = srDisplaySet;
    const measurement = measurements[measurementSelected];

    if (!measurement) {
      return null;
    }

    return (
      <OHIFCornerstoneViewport
        {...props}
        // should be passed second since we don't want SR displaySet to
        // override the activeImageDisplaySetData
        displaySets={[activeImageDisplaySetData]}
        // It is possible that there is a hanging protocol applying viewportOptions
        // for the SR, so inherit the viewport options
        // TODO: Ensure the viewport options are set correctly with respect to
        // stack etc, in the incoming viewport options.
        viewportOptions={{
          ...viewportOptions,
          toolGroupId: `${SR_TOOLGROUP_BASE_NAME}`,
          // viewportType should not be required, as the stack type should be
          // required already in order to view SR, but sometimes segmentation
          // views set the viewport type without fixing the allowed display
          viewportType: 'stack',
          // The positionIds for the viewport aren't meaningful for the child display sets
          positionIds: null,
        }}
        onElementEnabled={evt => {
          props.onElementEnabled?.(evt);
          onElementEnabled(evt);
        }}
        isJumpToMeasurementDisabled={true}
      />
    );
  }, [activeImageDisplaySetData, viewportId, measurementSelected]);

  /**
   Cleanup the SR viewport when the viewport is destroyed
   */
  useEffect(() => {
    const onDisplaySetsRemovedSubscription = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_REMOVED,
      ({ displaySetInstanceUIDs }) => {
        const activeViewport = viewports.get(activeViewportId);
        if (displaySetInstanceUIDs.includes(activeViewport.displaySetInstanceUID)) {
          viewportGridService.setDisplaySetsForViewport({
            viewportId: activeViewportId,
            displaySetInstanceUIDs: [],
          });
        }
      }
    );

    return () => {
      onDisplaySetsRemovedSubscription.unsubscribe();
    };
  }, []);

  /**
   * Loading the measurements from the SR viewport, which goes through the
   * isHydratable check, the outcome for the isHydrated state here is always FALSE
   * since we don't do the hydration here. Todo: can't we just set it as false? why
   * we are changing the state here? isHydrated is always false at this stage, and
   * if it is hydrated we don't even use the SR viewport.
   */
  useEffect(() => {
    const loadSR = async () => {
      if (!srDisplaySet.isLoaded) {
        await srDisplaySet.load();
      }
      updateViewport(measurementSelected);
    };
    loadSR();
  }, [srDisplaySet]);

  /**
   * Hook to update the tracking identifiers when the selected measurement changes or
   * the element changes
   */
  useEffect(() => {
    const updateSR = async () => {
      if (!srDisplaySet.isLoaded) {
        await srDisplaySet.load();
      }
      if (!element || !srDisplaySet.isLoaded) {
        return;
      }
      setTrackingIdentifiers(measurementSelected);
    };
    updateSR();
  }, [measurementSelected, element, setTrackingIdentifiers, srDisplaySet]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let childrenWithProps = null;

  if (!activeImageDisplaySetData || !referencedDisplaySetMetadata) {
    return null;
  }

  if (children && children.length) {
    childrenWithProps = children.map((child, index) => {
      return (
        child &&
        React.cloneElement(child, {
          viewportId,
          key: index,
        })
      );
    });
  }

  return (
    <>
      <div className="relative flex h-full w-full flex-row overflow-hidden">
        {getCornerstoneViewport()}
        {childrenWithProps}
      </div>
    </>
  );
}

OHIFCornerstoneSRMeasurementViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  viewportLabel: PropTypes.string,
  viewportOptions: PropTypes.object,
};

async function _getViewportReferencedDisplaySetData(
  displaySet,
  measurementSelected,
  displaySetService
) {
  const { measurements } = displaySet;
  const measurement = measurements[measurementSelected];

  const { displaySetInstanceUID } = measurement;
  if (!displaySet.keyImageDisplaySet) {
    // Create a new display set, and preserve a reference to it here,
    // so that it can be re-displayed and shown inside the SR viewport.
    // This is only for ease of redisplay - the display set is stored in the
    // usual manner in the display set service.
    displaySet.keyImageDisplaySet = createReferencedImageDisplaySet(displaySetService, displaySet);
  }

  if (!displaySetInstanceUID) {
    return { referencedDisplaySetMetadata: null, referencedDisplaySet: null };
  }

  const referencedDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  if (!referencedDisplaySet?.images) {
    return { referencedDisplaySetMetadata: null, referencedDisplaySet: null };
  }

  const image0 = referencedDisplaySet.images[0];
  const referencedDisplaySetMetadata = {
    PatientID: image0.PatientID,
    PatientName: image0.PatientName,
    PatientSex: image0.PatientSex,
    PatientAge: image0.PatientAge,
    SliceThickness: image0.SliceThickness,
    StudyDate: image0.StudyDate,
    SeriesDescription: image0.SeriesDescription,
    SeriesInstanceUID: image0.SeriesInstanceUID,
    SeriesNumber: image0.SeriesNumber,
    ManufacturerModelName: image0.ManufacturerModelName,
    SpacingBetweenSlices: image0.SpacingBetweenSlices,
  };

  return { referencedDisplaySetMetadata, referencedDisplaySet };
}

export default OHIFCornerstoneSRMeasurementViewport;
