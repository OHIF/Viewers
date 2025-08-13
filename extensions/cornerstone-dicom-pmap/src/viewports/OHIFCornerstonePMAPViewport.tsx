import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useViewportGrid } from '@ohif/ui-next';
import { OHIFCornerstoneViewport } from '@ohif/extension-cornerstone';

function OHIFCornerstonePMAPViewport(props: withAppTypes) {
  const { displaySets, children, viewportOptions, displaySetOptions, servicesManager } = props;
  const viewportId = viewportOptions.viewportId;
  const { displaySetService, segmentationService, uiNotificationService, customizationService } =
    servicesManager.services;

  // PMAP viewport will always have a single display set
  if (displaySets.length !== 1) {
    throw new Error('PMAP viewport must have a single display set');
  }

  const LoadingIndicatorTotalPercent = customizationService.getCustomization(
    'ui.loadingIndicatorTotalPercent'
  );

  const pmapDisplaySet = displaySets[0];
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const referencedDisplaySetRef = useRef(null);
  const { viewports, activeViewportId } = viewportGrid;
  const referencedDisplaySet = pmapDisplaySet.getReferenceDisplaySet();
  const referencedDisplaySetMetadata = _getReferencedDisplaySetMetadata(
    referencedDisplaySet,
    pmapDisplaySet
  );

  referencedDisplaySetRef.current = {
    displaySet: referencedDisplaySet,
    metadata: referencedDisplaySetMetadata,
  };

  const [pmapIsLoading, setPmapIsLoading] = useState(!pmapDisplaySet.isLoaded);

  // Add effect to listen for loading complete
  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_LOADING_COMPLETE,
      evt => {
        if (evt.pmapDisplaySet?.displaySetInstanceUID === pmapDisplaySet.displaySetInstanceUID) {
          setPmapIsLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [pmapDisplaySet]);

  const getCornerstoneViewport = useCallback(() => {
    const { displaySet: referencedDisplaySet } = referencedDisplaySetRef.current;

    displaySetOptions.unshift({});
    const [pmapDisplaySetOptions] = displaySetOptions;

    // Make sure `options` exists
    pmapDisplaySetOptions.options = pmapDisplaySetOptions.options ?? {};

    Object.assign(pmapDisplaySetOptions.options, {
      colormap: {
        name: 'rainbow_2',
        opacity: [
          { value: 0, opacity: 0 },
          { value: 0.25, opacity: 0.25 },
          { value: 0.5, opacity: 0.5 },
          { value: 0.75, opacity: 0.75 },
          { value: 0.9, opacity: 0.99 },
        ],
      },
      voi: {
        windowCenter: 50,
        windowWidth: 100,
      },
    });

    uiNotificationService.show({
      title: 'Parametric Map',
      type: 'warning',
      message: 'The values are multiplied by 100 in the viewport for better visibility',
    });

    return (
      <OHIFCornerstoneViewport
        {...props}
        // Referenced + PMAP displaySets must be passed as parameter in this order
        displaySets={[referencedDisplaySet, pmapDisplaySet]}
        viewportOptions={{
          viewportType: 'volume',
          orientation: viewportOptions.orientation,
          viewportId: viewportOptions.viewportId,
          presentationIds: viewportOptions.presentationIds,
        }}
        displaySetOptions={[{}, pmapDisplaySetOptions]}
      />
    );
  }, [
    displaySetOptions,
    props,
    pmapDisplaySet,
    viewportOptions.orientation,
    viewportOptions.viewportId,
    viewportOptions.presentationIds,
    uiNotificationService,
  ]);

  // Cleanup the PMAP viewport when the viewport is destroyed
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
  }, [activeViewportId, displaySetService, viewportGridService, viewports]);

  let childrenWithProps = null;

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
        {pmapIsLoading && (
          <LoadingIndicatorTotalPercent
            className="h-full w-full"
            totalNumbers={null}
            percentComplete={null}
            loadingText="Loading Parametric Map..."
          />
        )}
        {getCornerstoneViewport()}
        {childrenWithProps}
      </div>
    </>
  );
}

OHIFCornerstonePMAPViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
};

function _getReferencedDisplaySetMetadata(referencedDisplaySet, pmapDisplaySet) {
  const { SharedFunctionalGroupsSequence } = pmapDisplaySet.instance;

  const SharedFunctionalGroup = Array.isArray(SharedFunctionalGroupsSequence)
    ? SharedFunctionalGroupsSequence[0]
    : SharedFunctionalGroupsSequence;

  const { PixelMeasuresSequence } = SharedFunctionalGroup;

  const PixelMeasures = Array.isArray(PixelMeasuresSequence)
    ? PixelMeasuresSequence[0]
    : PixelMeasuresSequence;

  const { SpacingBetweenSlices, SliceThickness } = PixelMeasures;

  const image0 = referencedDisplaySet.images[0];
  const referencedDisplaySetMetadata = {
    PatientID: image0.PatientID,
    PatientName: image0.PatientName,
    PatientSex: image0.PatientSex,
    PatientAge: image0.PatientAge,
    SliceThickness: image0.SliceThickness || SliceThickness,
    StudyDate: image0.StudyDate,
    SeriesDescription: image0.SeriesDescription,
    SeriesInstanceUID: image0.SeriesInstanceUID,
    SeriesNumber: image0.SeriesNumber,
    ManufacturerModelName: image0.ManufacturerModelName,
    SpacingBetweenSlices: image0.SpacingBetweenSlices || SpacingBetweenSlices,
  };

  return referencedDisplaySetMetadata;
}

export default OHIFCornerstonePMAPViewport;
