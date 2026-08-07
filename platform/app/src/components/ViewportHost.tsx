import React, { useEffect, useState } from 'react';
import { useViewportGrid, gridSelectors } from '@ohif/ui-next';
import EmptyViewport from './EmptyViewport';

const { selectViewport } = gridSelectors;

/**
 * Hosts the extension viewport component for a single viewportId. Subscribes
 * only to this viewport's composition, so it re-renders when ITS composition
 * changes (or a display set it shows changes), not on unrelated grid updates.
 */
function ViewportHost({ viewportId, servicesManager, dataSource, viewportComponents }) {
  const { displaySetService, uiNotificationService, viewportGridService } =
    servicesManager.services;

  const composition = useViewportGrid(selectViewport(viewportId));
  const isHangingProtocolLayout = useViewportGrid(state => state.isHangingProtocolLayout);
  // Label gate parity with the pre-store grid: gate on the number of viewport
  // ENTRIES, not panes, because setDisplaySetsForViewports can create a
  // pane-less viewport entry and the old grid counted it toward showing labels.
  const viewportCount = useViewportGrid(state => state.viewports.size);

  // Display set objects are resolved per render below; this counter forces a
  // re-resolution when the display sets themselves change without a
  // composition change (eg new active display sets after metadata updates).
  const [, setDisplaySetsRevision] = useState(0);

  useEffect(() => {
    const { unsubscribe } = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      activeDisplaySets => {
        // Composition is read at event time; the render subscription above
        // keeps this host current, so the closure must not capture it.
        const currentComposition = viewportGridService.getViewportComposition(viewportId);
        const displaySetInstanceUIDs = currentComposition?.displaySetInstanceUIDs;
        if (!displaySetInstanceUIDs?.length) {
          return;
        }
        const intersects = activeDisplaySets?.some?.(displaySet =>
          displaySetInstanceUIDs.includes(displaySet?.displaySetInstanceUID)
        );
        if (intersects) {
          setDisplaySetsRevision(revision => revision + 1);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [displaySetService, viewportGridService, viewportId]);

  // The pane can exist while the viewport entry has been pruned (transient
  // states during layout transitions); render nothing until it exists.
  if (!composition) {
    return null;
  }

  const displaySetInstanceUIDsToUse = composition.displaySetInstanceUIDs || [];

  const displaySets = displaySetInstanceUIDsToUse
    .map(displaySetInstanceUID => {
      return displaySetService.getDisplaySetByUID(displaySetInstanceUID) || {};
    })
    .filter(displaySet => {
      return !displaySet?.unsupported;
    });

  const { component: ViewportComponent } = _getViewportComponent(
    displaySets,
    viewportComponents,
    uiNotificationService
  );

  return (
    <ViewportComponent
      displaySets={displaySets}
      viewportLabel={viewportCount > 1 ? composition.viewportLabel : ''}
      viewportId={viewportId}
      dataSource={dataSource}
      viewportOptions={composition.viewportOptions}
      displaySetOptions={composition.displaySetOptions}
      isHangingProtocolLayout={isHangingProtocolLayout}
      onElementEnabled={() => {
        viewportGridService.setViewportIsReady(viewportId, true);
      }}
    />
  );
}

function _getViewportComponent(displaySets, viewportComponents, uiNotificationService) {
  if (!displaySets || !displaySets.length) {
    return { component: EmptyViewport, isReferenceViewable: () => false };
  }

  // Todo: Do we have a viewport that has two different SOPClassHandlerIds?
  const SOPClassHandlerId = displaySets[0].SOPClassHandlerId;

  for (let i = 0; i < viewportComponents.length; i++) {
    if (!viewportComponents[i]) {
      throw new Error('viewport components not defined');
    }
    if (!viewportComponents[i].displaySetsToDisplay) {
      throw new Error('displaySetsToDisplay is null');
    }
    if (viewportComponents[i].displaySetsToDisplay.includes(SOPClassHandlerId)) {
      const { component } = viewportComponents[i];
      return { component };
    }
  }

  console.log("Can't show displaySet", SOPClassHandlerId, displaySets[0]);
  uiNotificationService.show({
    title: 'Viewport Not Supported Yet',
    message: `Cannot display SOPClassUID of ${displaySets[0].SOPClassUID} yet`,
    type: 'error',
  });

  return { component: EmptyViewport };
}

export default ViewportHost;
