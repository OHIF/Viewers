import PropTypes from 'prop-types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExtensionManager } from '@ohif/core';

import { setTrackingUniqueIdentifiersForElement } from '../tools/modules/dicomSRModule';

import { Icon, Tooltip, useViewportGrid, ViewportActionArrows } from '@ohif/ui';
import hydrateStructuredReport from '../utils/hydrateStructuredReport';
import { useAppConfig } from '@state';
import createReferencedImageDisplaySet from '../utils/createReferencedImageDisplaySet';

const MEASUREMENT_TRACKING_EXTENSION_ID = '@ohif/extension-measurement-tracking';

const SR_TOOLGROUP_BASE_NAME = 'SRToolGroup';

function OHIFCornerstoneSRViewport(props: withAppTypes) {
  const { children, dataSource, displaySets, viewportOptions, servicesManager, extensionManager } =
    props;

  const [appConfig] = useAppConfig();

  const {
    displaySetService,
    cornerstoneViewportService,
    measurementService,
    viewportActionCornersService,
  } = servicesManager.services;

  const viewportId = viewportOptions.viewportId;

  // SR viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SR viewport should only have a single display set');
  }

  const srDisplaySet = displaySets[0];

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [measurementSelected, setMeasurementSelected] = useState(0);
  const [measurementCount, setMeasurementCount] = useState(1);
  const [activeImageDisplaySetData, setActiveImageDisplaySetData] = useState(null);
  const [referencedDisplaySetMetadata, setReferencedDisplaySetMetadata] = useState(null);
  const [element, setElement] = useState(null);
  const { viewports, activeViewportId } = viewportGrid;

  const { t } = useTranslation('Common');

  // Optional hook into tracking extension, if present.
  let trackedMeasurements;
  let sendTrackedMeasurementsEvent;

  const hasMeasurementTrackingExtension = extensionManager.registeredExtensionIds.includes(
    MEASUREMENT_TRACKING_EXTENSION_ID
  );

  if (hasMeasurementTrackingExtension) {
    const contextModule = extensionManager.getModuleEntry(
      '@ohif/extension-measurement-tracking.contextModule.TrackedMeasurementsContext'
    );

    const tracked = useContext(contextModule.context);
    trackedMeasurements = tracked?.[0];
    sendTrackedMeasurementsEvent = tracked?.[1];
  }
  if (!sendTrackedMeasurementsEvent) {
    // if no panels from measurement-tracking extension is used, this code will run
    trackedMeasurements = null;
    sendTrackedMeasurementsEvent = (eventName, { displaySetInstanceUID }) => {
      measurementService.clearMeasurements();
      const { SeriesInstanceUIDs } = hydrateStructuredReport(
        { servicesManager, extensionManager, appConfig },
        displaySetInstanceUID
      );
      const displaySets = displaySetService.getDisplaySetsForSeries(SeriesInstanceUIDs[0]);
      if (displaySets.length) {
        viewportGridService.setDisplaySetsForViewports([
          {
            viewportId: activeViewportId,
            displaySetInstanceUIDs: [displaySets[0].displaySetInstanceUID],
          },
        ]);
      }
    };
  }

  /**
   * Store the tracking identifiers per viewport in order to be able to
   * show the SR measurements on the referenced image on the correct viewport,
   * when multiple viewports are used.
   */
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
      const { StudyInstanceUID, displaySetInstanceUID, sopClassUids } = srDisplaySet;

      if (!StudyInstanceUID || !displaySetInstanceUID) {
        return;
      }

      if (sopClassUids && sopClassUids.length > 1) {
        // Todo: what happens if there are multiple SOP Classes? Why we are
        // not throwing an error?
        console.warn('More than one SOPClassUID in the same series is not yet supported.');
      }

      // if (!srDisplaySet.measurements || !srDisplaySet.measurements.length) {
      //   return;
      // }

      _getViewportReferencedDisplaySetData(
        srDisplaySet,
        newMeasurementSelected,
        displaySetService
      ).then(({ referencedDisplaySet, referencedDisplaySetMetadata }) => {
        setMeasurementSelected(newMeasurementSelected);
        setActiveImageDisplaySetData(referencedDisplaySet);
        setReferencedDisplaySetMetadata(referencedDisplaySetMetadata);

        if (
          referencedDisplaySet.displaySetInstanceUID ===
          activeImageDisplaySetData?.displaySetInstanceUID
        ) {
          const { measurements } = srDisplaySet;

          // it means that we have a new referenced display set, and the
          // imageIdIndex will handle it by updating the viewport, but if they
          // are the same we just need to use measurementService to jump to the
          // new measurement
          const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

          const imageIds = csViewport.getImageIds();

          const imageIdIndex = imageIds.indexOf(measurements[newMeasurementSelected].imageId);

          if (imageIdIndex !== -1) {
            csViewport.setImageIdIndex(imageIdIndex);
          }
        }
      });
    },
    [dataSource, srDisplaySet, activeImageDisplaySetData, viewportId]
  );

  const getCornerstoneViewport = useCallback(() => {
    if (!activeImageDisplaySetData) {
      return null;
    }

    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    const { measurements } = srDisplaySet;
    const measurement = measurements[measurementSelected];

    if (!measurement) {
      return null;
    }

    const initialImageIndex = activeImageDisplaySetData.images.findIndex(
      image => image.imageId === measurement.imageId
    );

    return (
      <Component
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
        initialImageIndex={initialImageIndex}
        isJumpToMeasurementDisabled={true}
      ></Component>
    );
  }, [activeImageDisplaySetData, viewportId, measurementSelected]);

  const onMeasurementChange = useCallback(
    direction => {
      let newMeasurementSelected = measurementSelected;

      newMeasurementSelected += direction;
      if (newMeasurementSelected >= measurementCount) {
        newMeasurementSelected = 0;
      } else if (newMeasurementSelected < 0) {
        newMeasurementSelected = measurementCount - 1;
      }

      setTrackingIdentifiers(newMeasurementSelected);
      updateViewport(newMeasurementSelected);
    },
    [measurementSelected, measurementCount, updateViewport, setTrackingIdentifiers]
  );

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
      const numMeasurements = srDisplaySet.measurements.length;
      setMeasurementCount(numMeasurements);
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
    }
    updateSR();
  }, [measurementSelected, element, setTrackingIdentifiers, srDisplaySet]);

  /**
   * Todo: what is this, not sure what it does regarding the react aspect,
   * it is updating a local variable? which is not state.
   */
  const [isLocked, setIsLocked] = useState(trackedMeasurements?.context?.trackedSeries?.length > 0);
  useEffect(() => {
    setIsLocked(trackedMeasurements?.context?.trackedSeries?.length > 0);
  }, [trackedMeasurements]);

  useEffect(() => {
    viewportActionCornersService.setComponents([
      {
        viewportId,
        id: 'viewportStatusComponent',
        component: _getStatusComponent({
          srDisplaySet,
          viewportId,
          isRehydratable: srDisplaySet.isRehydratable,
          isLocked,
          sendTrackedMeasurementsEvent,
          t,
        }),
        indexPriority: -100,
        location: viewportActionCornersService.LOCATIONS.topLeft,
      },
      {
        viewportId,
        id: 'viewportActionArrowsComponent',
        index: 0,
        component: (
          <ViewportActionArrows
            key="actionArrows"
            onArrowsClick={onMeasurementChange}
          ></ViewportActionArrows>
        ),
        indexPriority: 0,
        location: viewportActionCornersService.LOCATIONS.topRight,
      },
    ]);
  }, [
    isLocked,
    onMeasurementChange,
    sendTrackedMeasurementsEvent,
    srDisplaySet,
    t,
    viewportActionCornersService,
    viewportId,
  ]);

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

OHIFCornerstoneSRViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  viewportLabel: PropTypes.string,
  viewportOptions: PropTypes.object,
  servicesManager: PropTypes.object.isRequired,
  extensionManager: PropTypes.instanceOf(ExtensionManager).isRequired,
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

  const referencedDisplaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

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

function _getStatusComponent({
  srDisplaySet,
  viewportId,
  isRehydratable,
  isLocked,
  sendTrackedMeasurementsEvent,
  t,
}) {
  const handleMouseUp = () => {
    sendTrackedMeasurementsEvent('HYDRATE_SR', {
      displaySetInstanceUID: srDisplaySet.displaySetInstanceUID,
      viewportId,
    });
  };

  const loadStr = t('LOAD');

  // 1 - Incompatible
  // 2 - Locked
  // 3 - Rehydratable / Open
  const state = isRehydratable && !isLocked ? 3 : isRehydratable && isLocked ? 2 : 1;
  let ToolTipMessage = null;
  let StatusIcon = null;

  switch (state) {
    case 1:
      StatusIcon = () => <Icon name="status-alert" />;

      ToolTipMessage = () => (
        <div>
          This structured report is not compatible
          <br />
          with this application.
        </div>
      );
      break;
    case 2:
      StatusIcon = () => <Icon name="status-locked" />;

      ToolTipMessage = () => (
        <div>
          This structured report is currently read-only
          <br />
          because you are tracking measurements in
          <br />
          another viewport.
        </div>
      );
      break;
    case 3:
      StatusIcon = () => (
        <Icon
          className="text-aqua-pale"
          name="status-untracked"
        />
      );

      ToolTipMessage = () => <div>{`Click ${loadStr} to restore measurements.`}</div>;
  }

  const StatusArea = () => (
    <div className="flex h-6 cursor-default text-sm leading-6 text-white">
      <div className="bg-customgray-100 flex min-w-[45px] items-center rounded-l-xl rounded-r p-1">
        <StatusIcon />
        <span className="ml-1">SR</span>
      </div>
      {state === 3 && (
        <div
          className="bg-primary-main hover:bg-primary-light ml-1 cursor-pointer rounded px-1.5 hover:text-black"
          // Using onMouseUp here because onClick is not working when the viewport is not active and is styled with pointer-events:none
          onMouseUp={handleMouseUp}
        >
          {loadStr}
        </div>
      )}
    </div>
  );

  return (
    <>
      {ToolTipMessage && (
        <Tooltip
          content={<ToolTipMessage />}
          position="bottom-left"
        >
          <StatusArea />
        </Tooltip>
      )}
      {!ToolTipMessage && <StatusArea />}
    </>
  );
}

export default OHIFCornerstoneSRViewport;
