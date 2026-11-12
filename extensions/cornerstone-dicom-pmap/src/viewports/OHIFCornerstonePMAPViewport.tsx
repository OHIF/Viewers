import React, { useEffect, useState } from 'react';
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
  const { viewports, activeViewportId } = viewportGrid;
  const referencedDisplaySet = pmapDisplaySet.getReferenceDisplaySet();
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

  const getCornerstoneViewport = () => {
    // A local, not a mutation of the `displaySetOptions` prop: the array handed
    // to the viewport below is assembled fresh, so the previous `unshift` only
    // served to manufacture this object - while growing the caller's array on
    // every call.
    const pmapDisplaySetOptions = {
      options: {
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
      },
    };

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
  };

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

export default OHIFCornerstonePMAPViewport;
