import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import OHIF, { utils } from '@ohif/core';
import classNames from 'classnames';
import { eventTarget, cache, Enums } from '@cornerstonejs/core';
import { segmentation as cstSegmentation } from '@cornerstonejs/tools';
import {
  Notification,
  ViewportActionBar,
  useViewportGrid,
  useViewportDialog,
  Icon,
  Tooltip,
} from '@ohif/ui';

import createSEGToolGroupAndAddTools from '../utils/initSEGToolGroup';
import _hydrateSEGDisplaySet from '../utils/_hydrateSEG';
import promptHydrateSEG from '../utils/promptHydrateSEG';

const { formatDate } = utils;

const SEG_TOOLGROUP_BASE_NAME = 'SEGToolGroup';

function OHIFCornerstoneSEGViewport(props) {
  const {
    children,
    displaySets,
    viewportIndex,
    viewportLabel,
    servicesManager,
    extensionManager,
  } = props;

  const {
    DisplaySetService,
    ToolGroupService,
    SegmentationService,
  } = servicesManager.services;

  // SEG viewport will always have a single display set
  if (displaySets.length > 1) {
    throw new Error('SEG viewport should only have a single display set');
  }

  const segDisplaySet = displaySets[0];

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [viewportDialogState, viewportDialogApi] = useViewportDialog();

  // States
  const [toolGroupId, setToolGroupId] = useState(null);
  const referencedDisplaySetRef = useRef(null);

  const [isHydrated, setIsHydrated] = useState(segDisplaySet.isHydrated);
  const [element, setElement] = useState(null);
  const { viewports, activeViewportIndex } = viewportGrid;

  /**
   * OnElementEnabled callback which is called after the cornerstoneExtension
   * has enabled the element. Note: we delegate all the image rendering to
   * cornerstoneExtension, so we don't need to do anything here regarding
   * the image rendering, element enabling etc.
   */
  const onElementEnabled = evt => {
    setElement(evt.detail.element);
  };

  const onElementDisabled = () => {
    setElement(null);
    // remove the segmentation representations as well
    SegmentationService.removeSegmentationRepresentationFromToolGroup(
      toolGroupId
    );

    // Note: toolgroup should be removed after the segmentation representations
    // are removed, since cornerstone need to remove the labelmap before removing
    // the toolgroup
    ToolGroupService.destroyToolGroup(toolGroupId);
  };

  const getCornerstoneViewport = useCallback(() => {
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    const {
      displaySet: referencedDisplaySet,
    } = referencedDisplaySetRef.current;

    const displaySets = [referencedDisplaySet, segDisplaySet];

    console.debug('ref ds', referencedDisplaySet.SeriesDescription);

    // if (segmentationIsLoaded) {
    //   displaySets.push(segDisplaySet);
    // }

    // const { measurements } = segDisplaySet;
    // const measurement = measurements[measurementSelected];

    // if (!measurement) {
    //   return null;
    // }

    // const initialImageIndex = referencedDisplaySet.images.findIndex(
    //   image => image.imageId === measurement.imageId
    // );

    return (
      <Component
        {...props}
        displaySets={displaySets}
        viewportOptions={{
          viewportType: 'volume',
          orientation: 'axial', // todo: make this default orientation
          toolGroupId,
        }}
        onElementEnabled={onElementEnabled}
        onElementDisabled={onElementDisabled}
        // initialImageIndex={initialImageIndex}
      ></Component>
    );
  }, [viewportIndex, segDisplaySet, toolGroupId]);

  const onSegmentChange = useCallback(direction => {
    // let newMeasurementSelected = measurementSelected;
    // if (direction === 'right') {
    //   newMeasurementSelected++;
    //   if (newMeasurementSelected >= measurementCount) {
    //     newMeasurementSelected = 0;
    //   }
    // } else {
    //   newMeasurementSelected--;
    //   if (newMeasurementSelected < 0) {
    //     newMeasurementSelected = measurementCount - 1;
    //   }
    // }
    // setTrackingIdentifiers(newMeasurementSelected);
    // updateViewport(newMeasurementSelected);
  }, []);

  /**
   Cleanup the SEG viewport when the viewport is destroyed
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

  useEffect(() => {
    if (toolGroupId !== null) {
      return;
    }

    const _toolGroupId = createSEGToolGroupAndAddTools(
      ToolGroupService,
      viewportIndex,
      extensionManager
    );

    setToolGroupId(_toolGroupId);

    return () => {
      // we don't need a cleanup function, because the tool group is destroyed
      // when the element is disabled automatically
      // _removeToolGroup(toolGroupId);
    };
  }, [toolGroupId]);

  useEffect(() => {
    console.debug('getting new ference displayset');
    const referencedDisplaySet = segDisplaySet.getReferenceDisplaySet();

    const referencedDisplaySetMetadata = _getReferencedDisplaySetMetadata(
      referencedDisplaySet
    );

    referencedDisplaySetRef.current = {
      displaySet: referencedDisplaySet,
      metadata: referencedDisplaySetMetadata,
    };
    setIsHydrated(segDisplaySet.isHydrated);

    return () => {
      console.debug('cleanup ****************');
      referencedDisplaySetRef.current = null;
    };
  }, [segDisplaySet]);

  useEffect(() => {
    const { unsubscribe } = ToolGroupService.subscribe(
      ToolGroupService.EVENTS.VIEWPORT_ADDED,
      ({ toolGroupId: tlgId }) => {
        if (toolGroupId !== tlgId) {
          return;
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [segDisplaySet, toolGroupId]);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let childrenWithProps = null;

  console.debug(
    'trying to pass with SEG display set',
    segDisplaySet.SeriesDescription
  );
  const referencedDisplaySet = segDisplaySet.getReferenceDisplaySet();

  if (
    !referencedDisplaySetRef.current ||
    referencedDisplaySet.displaySetInstanceUID !==
      referencedDisplaySetRef.current.displaySet.displaySetInstanceUID
  ) {
    return null;
  }

  console.debug('passed with ref', referencedDisplaySetRef.current.metadata);

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
  } = referencedDisplaySetRef.current.metadata;

  const onPillClick = () => {
    const isHydrated = promptHydrateSEG({
      servicesManager,
      viewportIndex,
      segDisplaySet,
      toolGroupId,
    });

    if (isHydrated) {
      setIsHydrated(true);
    }
  };

  return (
    <>
      <ViewportActionBar
        onDoubleClick={evt => {
          evt.stopPropagation();
          evt.preventDefault();
        }}
        onSeriesChange={onSegmentChange}
        getStatusComponent={() => {
          return _getStatusComponent({
            isHydrated,
            onPillClick,
          });
        }}
        studyData={{
          label: viewportLabel,
          useAltStyling: true,
          studyDate: formatDate(StudyDate),
          currentSeries: SeriesNumber,
          seriesDescription: `SEG Viewport ${SeriesDescription}`,
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

OHIFCornerstoneSEGViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportIndex: PropTypes.number.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  customProps: PropTypes.object,
};

OHIFCornerstoneSEGViewport.defaultProps = {
  customProps: {},
};

function _getStatusComponent({ isHydrated, onPillClick }) {
  let ToolTipMessage = null;
  let StatusIcon = null;

  switch (isHydrated) {
    case true:
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
        <div>This Segmentation is loaded in the segmentation panel</div>
      );
      break;
    case false:
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

      ToolTipMessage = () => <div>Click to load segmentation.</div>;
  }

  const StatusPill = () => (
    <div
      className={classNames(
        'group relative flex items-center justify-center px-2 rounded-full cursor-default bg-customgreen-100',
        {
          'hover:bg-customblue-100': !isHydrated,
          'cursor-pointer': !isHydrated,
        }
      )}
      style={{
        height: '24px',
        width: '55px',
      }}
      onClick={() => {
        if (!isHydrated) {
          if (onPillClick) {
            onPillClick();
          }
        }
      }}
    >
      <div className="pr-1 text-base font-bold leading-none text-black">
        SEG
      </div>
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

function _getReferencedDisplaySetMetadata(referencedDisplaySet) {
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

  return referencedDisplaySetMetadata;
}

export default OHIFCornerstoneSEGViewport;
