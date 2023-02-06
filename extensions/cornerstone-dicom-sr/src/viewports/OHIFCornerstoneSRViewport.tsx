import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import OHIF, { utils } from '@ohif/core';
import { useTranslation } from 'react-i18next';
import { setTrackingUniqueIdentifiersForElement } from '../tools/modules/dicomSRModule';

import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
  Tooltip,
  Icon,
} from '@ohif/ui';
import classNames from 'classnames';
import hydrateStructuredReport from '../utils/hydrateStructuredReport';

const { formatDate } = utils;

const MEASUREMENT_TRACKING_EXTENSION_ID =
  '@ohif/extension-measurement-tracking';

const SR_TOOLGROUP_BASE_NAME = 'SRToolGroup';

function OHIFCornerstoneSRViewport(props) {
  const {
    children,
    dataSource,
    displaySets,
    viewportIndex,
    viewportLabel,
    servicesManager,
    extensionManager,
  } = props;

  const { t } = useTranslation('SRViewport');

  const {
    DisplaySetService,
    CornerstoneViewportService,
    MeasurementService,
  } = servicesManager.services;

  // SR viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SR viewport should only have a single display set');
  }

  const srDisplaySet = displaySets[0];

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();
  const [measurementSelected, setMeasurementSelected] = useState(0);
  const [measurementCount, setMeasurementCount] = useState(1);
  const [activeImageDisplaySetData, setActiveImageDisplaySetData] = useState(
    null
  );
  const [
    referencedDisplaySetMetadata,
    setReferencedDisplaySetMetadata,
  ] = useState(null);
  const [isHydrated, setIsHydrated] = useState(srDisplaySet.isHydrated);
  const [element, setElement] = useState(null);
  const { viewports, activeViewportIndex } = viewportGrid;

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
      MeasurementService.clearMeasurements();
      const { SeriesInstanceUIDs } = hydrateStructuredReport(
        { servicesManager, extensionManager },
        displaySetInstanceUID
      );
      const displaySets = DisplaySetService.getDisplaySetsForSeries(
        SeriesInstanceUIDs[0]
      );
      if (displaySets.length) {
        viewportGridService.setDisplaySetsForViewport({
          viewportIndex: activeViewportIndex,
          displaySetInstanceUIDs: [displaySets[0].displaySetInstanceUID],
        });
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
      const {
        StudyInstanceUID,
        displaySetInstanceUID,
        sopClassUids,
      } = srDisplaySet;

      if (!StudyInstanceUID || !displaySetInstanceUID) {
        return;
      }

      if (sopClassUids && sopClassUids.length > 1) {
        // Todo: what happens if there are multiple SOP Classes? Why we are
        // not throwing an error?
        console.warn(
          'More than one SOPClassUID in the same series is not yet supported.'
        );
      }

      _getViewportReferencedDisplaySetData(
        srDisplaySet,
        newMeasurementSelected,
        DisplaySetService
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
          // are the same we just need to use MeasurementService to jump to the
          // new measurement
          const viewportInfo = CornerstoneViewportService.getViewportInfoByIndex(
            viewportIndex
          );

          const csViewport = CornerstoneViewportService.getCornerstoneViewport(
            viewportInfo.getViewportId()
          );

          const imageIds = csViewport.getImageIds();

          const imageIdIndex = imageIds.indexOf(
            measurements[newMeasurementSelected].imageId
          );

          if (imageIdIndex !== -1) {
            csViewport.setImageIdIndex(imageIdIndex);
          }
        }
      });
    },
    [dataSource, srDisplaySet, activeImageDisplaySetData, viewportIndex]
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
        viewportOptions={{
          toolGroupId: `${SR_TOOLGROUP_BASE_NAME}`,
        }}
        onElementEnabled={onElementEnabled}
        initialImageIndex={initialImageIndex}
      ></Component>
    );
  }, [activeImageDisplaySetData, viewportIndex, measurementSelected]);

  const onMeasurementChange = useCallback(
    direction => {
      let newMeasurementSelected = measurementSelected;

      if (direction === 'right') {
        newMeasurementSelected++;

        if (newMeasurementSelected >= measurementCount) {
          newMeasurementSelected = 0;
        }
      } else {
        newMeasurementSelected--;

        if (newMeasurementSelected < 0) {
          newMeasurementSelected = measurementCount - 1;
        }
      }

      setTrackingIdentifiers(newMeasurementSelected);
      updateViewport(newMeasurementSelected);
    },
    [
      measurementSelected,
      measurementCount,
      updateViewport,
      setTrackingIdentifiers,
    ]
  );

  /**
   Cleanup the SR viewport when the viewport is destroyed
   */
  useEffect(() => {
    const onDisplaySetsRemovedSubscription = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_REMOVED,
      ({ displaySetInstanceUIDs }) => {
        const activeViewport = viewports[activeViewportIndex];
        if (
          displaySetInstanceUIDs.includes(activeViewport.displaySetInstanceUID)
        ) {
          viewportGridService.setDisplaySetsForViewport({
            viewportIndex: activeViewportIndex,
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
   * if it is hydrated we don't event use the SR viewport.
   */
  useEffect(() => {
    if (!srDisplaySet.isLoaded) {
      srDisplaySet.load();
    }
    setIsHydrated(srDisplaySet.isHydrated);

    const numMeasurements = srDisplaySet.measurements.length;
    setMeasurementCount(numMeasurements);
  }, [srDisplaySet]);

  /**
   * Hook to update the tracking identifiers when the selected measurement changes or
   * the element changes
   */
  useEffect(() => {
    if (!element || !srDisplaySet.isLoaded) {
      return;
    }
    setTrackingIdentifiers(measurementSelected);
  }, [measurementSelected, element, setTrackingIdentifiers, srDisplaySet]);

  /**
   * Todo: what is this, not sure what it does regarding the react aspect,
   * it is updating a local variable? which is not state.
   */
  let isLocked = trackedMeasurements?.context?.trackedSeries?.length > 0;
  useEffect(() => {
    isLocked = trackedMeasurements?.context?.trackedSeries?.length > 0;
  }, [trackedMeasurements]);

  /**
   * Data fetching for the SR displaySet, which updates the measurements and
   * also gets the referenced image displaySet that SR is based on.
   */
  useEffect(() => {
    updateViewport(measurementSelected);
  }, [dataSource, srDisplaySet]);

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
          viewportIndex,
          key: index,
        })
      );
    });
  }

  const {
    PatientID,
    PatientName,
    PatientSex,
    PatientAge,
    SliceThickness,
    ManufacturerModelName,
    StudyDate,
    SeriesDescription,
    SpacingBetweenSlices,
    SeriesNumber,
  } = referencedDisplaySetMetadata;

  // TODO -> disabled double click for now: onDoubleClick={_onDoubleClick}
  return (
    <>
      <ViewportActionBar
        onDoubleClick={evt => {
          evt.stopPropagation();
          evt.preventDefault();
        }}
        onArrowsClick={onMeasurementChange}
        getStatusComponent={() =>
          _getStatusComponent({
            srDisplaySet,
            viewportIndex,
            isTracked: false,
            isRehydratable: srDisplaySet.isRehydratable,
            isLocked,
            sendTrackedMeasurementsEvent,
          })
        }
        studyData={{
          label: viewportLabel,
          useAltStyling: true,
          studyDate: formatDate(StudyDate),
          currentSeries: SeriesNumber,
          seriesDescription: SeriesDescription || '',
          patientInformation: {
            patientName: PatientName
              ? OHIF.utils.formatPN(PatientName.Alphabetic)
              : '',
            patientSex: PatientSex || '',
            patientAge: PatientAge || '',
            MRN: PatientID || '',
            thickness: SliceThickness ? `${SliceThickness.toFixed(2)}mm` : '',
            spacing:
              SpacingBetweenSlices !== undefined
                ? `${SpacingBetweenSlices.toFixed(2)}mm`
                : '',
            scanner: ManufacturerModelName || '',
          },
        }}
      />

      <div className="relative flex flex-row w-full h-full overflow-hidden">
        {getCornerstoneViewport()}
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

OHIFCornerstoneSRViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

OHIFCornerstoneSRViewport.defaultProps = {
  customProps: {},
};

async function _getViewportReferencedDisplaySetData(
  displaySet,
  measurementSelected,
  DisplaySetService
) {
  const { measurements } = displaySet;
  const measurement = measurements[measurementSelected];

  const { displaySetInstanceUID } = measurement;

  const referencedDisplaySet = DisplaySetService.getDisplaySetByUID(
    displaySetInstanceUID
  );

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
  viewportIndex,
  isRehydratable,
  isLocked,
  sendTrackedMeasurementsEvent,
}) {
  const onPillClick = () => {
    sendTrackedMeasurementsEvent('RESTORE_PROMPT_HYDRATE_SR', {
      displaySetInstanceUID: srDisplaySet.displaySetInstanceUID,
      viewportIndex,
    });
  };

  // 1 - Incompatible
  // 2 - Locked
  // 3 - Rehydratable / Open
  const state =
    isRehydratable && !isLocked ? 3 : isRehydratable && isLocked ? 2 : 1;
  let ToolTipMessage = null;
  let StatusIcon = null;

  switch (state) {
    case 1:
      StatusIcon = () => (
        <div
          className="flex items-center justify-center -mr-1 rounded-full"
          style={{
            width: '18px',
            height: '18px',
            backgroundColor: '#98e5c1',
            border: 'solid 1.5px #000000',
          }}
        >
          <Icon
            name="exclamation"
            style={{ color: '#000', width: '12px', height: '12px' }}
          />
        </div>
      );

      ToolTipMessage = () => (
        <div>
          This structured report is not compatible
          <br />
          with this application.
        </div>
      );
      break;
    case 2:
      StatusIcon = () => (
        <div
          className="flex items-center justify-center -mr-1 bg-black rounded-full"
          style={{
            width: '18px',
            height: '18px',
          }}
        >
          <Icon
            name="lock"
            style={{ color: '#05D97C', width: '8px', height: '11px' }}
          />
        </div>
      );

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
        <div
          className="flex items-center justify-center -mr-1 bg-white rounded-full group-hover:bg-customblue-200"
          style={{
            width: '18px',
            height: '18px',
            border: 'solid 1.5px #000000',
          }}
        >
          <Icon
            name="arrow-left"
            style={{ color: '#000', width: '14px', height: '14px' }}
          />
        </div>
      );

      ToolTipMessage = () => <div>Click to restore measurements.</div>;
  }

  const StatusPill = () => (
    <div
      className={classNames(
        'group relative flex items-center justify-center px-2 rounded-full cursor-default bg-customgreen-100',
        {
          'hover:bg-customblue-100': state === 3,
          'cursor-pointer': state === 3,
        }
      )}
      style={{
        height: '24px',
        width: '55px',
      }}
      onClick={() => {
        if (state === 3) {
          if (onPillClick) {
            onPillClick();
          }
        }
      }}
    >
      <span className="pr-1 text-lg font-bold leading-none text-black">SR</span>
      <StatusIcon />
    </div>
  );

  return (
    <>
      {ToolTipMessage && (
        <Tooltip content={<ToolTipMessage />} position="bottom-left">
          <StatusPill />
        </Tooltip>
      )}
      {!ToolTipMessage && <StatusPill />}
    </>
  );
}

// function _onDoubleClick() {
//   const cancelActiveManipulatorsForElement = cornerstoneTools.getModule(
//     'manipulatorState'
//   ).setters.cancelActiveManipulatorsForElement;
//   const enabledElements = cornerstoneTools.store.state.enabledElements;
//   enabledElements.forEach(element => {
//     cancelActiveManipulatorsForElement(element);
//   });
// }

export default OHIFCornerstoneSRViewport;
