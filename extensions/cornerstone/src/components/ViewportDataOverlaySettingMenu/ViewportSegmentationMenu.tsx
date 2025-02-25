import React, { useEffect, useState } from 'react';
import { Button, Icons, Separator } from '@ohif/ui-next';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

function ViewportSegmentationMenu({
  viewportId,
  servicesManager,
}: withAppTypes<{ viewportId: string }>) {
  const { segmentationService } = servicesManager.services;
  const [activeSegmentations, setActiveSegmentations] = useState([]);
  const [availableSegmentations, setAvailableSegmentations] = useState([]);

  useEffect(() => {
    const updateSegmentations = () => {
      const active = segmentationService.getSegmentationRepresentations(viewportId);
      setActiveSegmentations(active);

      const all = segmentationService.getSegmentations();
      const available = all.filter(
        seg => !active.some(activeSeg => activeSeg.segmentationId === seg.segmentationId)
      );
      setAvailableSegmentations(available);
    };

    updateSegmentations();

    const subscriptions = [
      segmentationService.EVENTS.SEGMENTATION_MODIFIED,
      segmentationService.EVENTS.SEGMENTATION_REMOVED,
      segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
    ].map(event => segmentationService.subscribe(event, updateSegmentations));

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [segmentationService, viewportId]);

  const toggleSegmentationRepresentationVisibility = (
    segmentationId,
    type = SegmentationRepresentations.Labelmap
  ) => {
    segmentationService.toggleSegmentationRepresentationVisibility(viewportId, {
      segmentationId,
      type,
    });
  };

  const addSegmentationToViewport = segmentationId => {
    segmentationService.addSegmentationRepresentation(viewportId, { segmentationId });
  };

  const removeSegmentationFromViewport = segmentationId => {
    segmentationService.removeSegmentationRepresentations(viewportId, {
      segmentationId,
    });
  };

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
      <span className="text-muted-foreground mb-2 text-xs font-semibold">Current Viewport</span>
      <ul className="space-y-1">
        {activeSegmentations.map(segmentation => (
          <li
            key={segmentation.id}
            className="flex items-center text-sm"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground mr-2"
              onClick={() => removeSegmentationFromViewport(segmentation.segmentationId)}
            >
              <Icons.Minus className="h-6 w-6" />
            </Button>
            <span className="text-foreground flex-grow">{segmentation.label}</span>
            {segmentation.visible ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() =>
                  toggleSegmentationRepresentationVisibility(
                    segmentation.segmentationId,
                    segmentation.type
                  )
                }
              >
                <Icons.Hide className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() =>
                  toggleSegmentationRepresentationVisibility(
                    segmentation.segmentationId,
                    segmentation.type
                  )
                }
              >
                <Icons.Show className="h-6 w-6" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {availableSegmentations.length > 0 && (
        <>
          <Separator className="bg-input mb-3" />
          <span className="text-muted-foreground mb-2 text-xs font-semibold">Available</span>
          <ul className="space-y-1">
            {availableSegmentations.map(({segmentationId, label}) => (
              <li
                key={segmentationId}
                className="flex items-center text-sm"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground mr-2"
                  onClick={() => addSegmentationToViewport(segmentationId)}
                >
                  <Icons.Plus className="h-6 w-6" />
                </Button>
                <span className="text-foreground/60">{label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default ViewportSegmentationMenu;
