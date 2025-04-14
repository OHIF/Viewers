import React, { useEffect, useState } from 'react';
import { Button, Icons, Separator } from '@ohif/ui-next';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { useSystem } from '@ohif/core';

const derivedOverlayModalities = ['SEG', 'RTSTRUCT'];

function getEnhancedDisplaySets({ viewportId, services }) {
  const { displaySetService, viewportGridService } = services;
  const displaySetsUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
  const allDisplaySets = displaySetService.getActiveDisplaySets();

  const otherDisplaySets = allDisplaySets.filter(
    displaySet => !displaySetsUIDs.includes(displaySet.displaySetInstanceUID)
  );

  const viewportDisplaySets = displaySetsUIDs.map(displaySetUID =>
    displaySetService.getDisplaySetByUID(displaySetUID)
  );

  const backgroundDisplaySet = viewportDisplaySets[0].label;

  return {
    backgroundDisplaySet,
    enhancedDisplaySets: otherDisplaySets,
  };
}

function ViewportDataOverlayMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService } = servicesManager.services;

  const [derivedOverlayDisplaySets, setDerivedOverlayDisplaySets] = useState([]);

  const { backgroundDisplaySet, enhancedDisplaySets } = getEnhancedDisplaySets({
    viewportId,
    services: { displaySetService, viewportGridService },
  });

  // useEffect(() => {
  //   const displaySets = displaySetService.getActiveDisplaySets();
  //   const derivedOverlayDisplaySets = displaySets.filter(displaySet =>
  //     derivedOverlayModalities.includes(displaySet.Modality)
  //   );
  //   setDerivedOverlayDisplaySets(derivedOverlayDisplaySets);
  // }, []);

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
      <span className="text-muted-foreground mb-2 text-xs font-semibold">Current Viewport</span>
      <span className="text-foreground flex-grow text-[13px]">{`Background: ${backgroundDisplaySet}`}</span>
      <ul className="space-y-1">
        {enhancedDisplaySets.map(displaySet => (
          <li
            key={displaySet.displaySetInstanceUID}
            className="flex items-center text-sm"
          >
            <Button
              variant="ghost"
              className="text-muted-foreground w-full"
              // onClick={() => removeSegmentationFromViewport(segmentation.segmentationId)}
            >
              <div className="flex w-full items-center justify-between">
                <Icons.Plus className="mr-2 h-6 w-6" />
                <span className="text-foreground">{displaySet.label}</span>
                <span className="text-muted-foreground ml-2">{displaySet.Modality}</span>
              </div>
            </Button>
          </li>
        ))}
      </ul>
      {/* {derivedOverlayDisplaySets.length > 0 && (
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
      )} */}
    </div>
  );
}

export default ViewportDataOverlayMenu;
