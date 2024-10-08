import React, { useEffect, useState } from 'react';
import { Button, Icons, ScrollArea } from '@ohif/ui-next';

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

      const all = segmentationService.getSegmentationsInfo();
      const available = all.filter(
        seg =>
          !active.some(activeSeg => activeSeg.segmentationId === seg.segmentation.segmentationId)
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

  const toggleSegmentationVisibility = segmentationId => {
    segmentationService.toggleSegmentationVisibility(viewportId, segmentationId);
  };

  const addSegmentationToViewport = segmentationId => {
    segmentationService.addSegmentationRepresentationToViewport({
      viewportId,
      segmentationId,
    });
  };

  return (
    <div className="bg-primary-dark flex h-full w-[262px] flex-col rounded">
      <ScrollArea className="flex-grow">
        <ul className="space-y-1 p-2">
          {activeSegmentations.map(segmentation => (
            <li
              key={segmentation.id}
              className="bg-primary-dark flex items-center rounded p-2"
            >
              <Icons.StatusChecked className="text-primary-light mr-2 h-4 w-4" />
              <span className="text-primary-light flex-grow text-sm">{segmentation.label}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSegmentationVisibility(segmentation.segmentationId)}
                aria-label={
                  segmentation.visible ? `Hide ${segmentation.label}` : `Show ${segmentation.label}`
                }
              >
                {segmentation.visible ? (
                  <Icons.EyeVisible className="text-primary-light h-4 w-4" />
                ) : (
                  <Icons.EyeHidden className="text-primary-light h-4 w-4" />
                )}
              </Button>
            </li>
          ))}
          {availableSegmentations.map(segmentation => (
            <li
              key={segmentation.segmentation.segmentationId}
              className="bg-primary-dark flex items-center rounded p-2"
            >
              <Icons.Plus
                className="text-primary-light mr-2 h-4 w-4 cursor-pointer"
                onClick={() => addSegmentationToViewport(segmentation.segmentation.segmentationId)}
              />
              <span className="flex-grow text-sm text-[#726f7e]">
                {segmentation.segmentation.label}
              </span>
              <span className="text-xs text-[#726f7e]">Available</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

export default ViewportSegmentationMenu;
