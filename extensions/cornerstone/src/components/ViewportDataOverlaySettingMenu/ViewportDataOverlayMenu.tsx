import React, { useEffect, useState } from 'react';
import { Button, Icons, Separator } from '@ohif/ui-next';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { useSystem } from '@ohif/core';
import { DisplaySet } from '@ohif/core';

const derivedOverlayModalities = ['SEG', 'RTSTRUCT'];

function ViewportDataOverlayMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService } = servicesManager.services;

  const [derivedOverlayDisplaySets, setDerivedOverlayDisplaySets] = useState<DisplaySet[]>([]);

  const displaySetsUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

  const displaySets = displaySetsUIDs.map(displaySetUID =>
    displaySetService.getDisplaySetByUID(displaySetUID)
  );

  const backGroundDisplaySet = displaySets[0].label;

  useEffect(() => {
    const displaySets = displaySetService.getActiveDisplaySets();
    const derivedOverlayDisplaySets = displaySets.filter(displaySet =>
      derivedOverlayModalities.includes(displaySet.Modality)
    );
    setDerivedOverlayDisplaySets(derivedOverlayDisplaySets);
  }, []);

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
      <span className="text-muted-foreground mb-2 text-xs font-semibold">Current Viewport</span>
      <span className="text-foreground flex-grow text-[13px]">{`Background: ${backGroundDisplaySet}`}</span>
      <ul className="space-y-1">
        {derivedOverlayDisplaySets.map(displaySet => (
          <li
            key={displaySet.displaySetInstanceUID}
            className="flex items-center text-sm"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground mr-2"
              // onClick={() => removeSegmentationFromViewport(segmentation.segmentationId)}
            >
              <Icons.Minus className="h-6 w-6" />
            </Button>
            <span className="text-foreground flex-grow">{displaySet.Modality}</span>
          </li>
        ))}
      </ul>
      {derivedOverlayDisplaySets.length > 0 && (
        <>
          <Separator className="bg-input mb-3" />
          <span className="text-muted-foreground mb-2 text-xs font-semibold">Available</span>
          <ul className="space-y-1">
            {derivedOverlayDisplaySets.map(({ displaySetInstanceUID, Modality }) => (
              <li
                key={displaySetInstanceUID}
                className="flex items-center text-sm"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground mr-2"
                  // onClick={() => addSegmentationToViewport(segmentationId)}
                >
                  <Icons.Plus className="h-6 w-6" />
                </Button>
                <span className="text-foreground/60">{Modality}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default ViewportDataOverlayMenu;
