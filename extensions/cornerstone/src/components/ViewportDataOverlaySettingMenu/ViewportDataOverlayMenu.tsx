import React, { useEffect, useState } from 'react';
import { Button, Icons, ScrollArea, Separator } from '@ohif/ui-next';
import { utilities as csUtils } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core';

const derivedOverlayModalities = ['SEG', 'RTSTRUCT', 'SR'];

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
  const backGroundCanBeVolume = csUtils.isValidVolume(viewportDisplaySets[0].imageIds);

  // we need to cross check each other displaySet with the main background displaySet
  // to see if they are overridable or not. One thing is they need to be in the same frameOfReferenceUID

  const enhancedDisplaySets = otherDisplaySets.map(displaySet => {
    const isOverlayable = true;

    if (displaySet.frameOfReferenceUID !== backgroundDisplaySet.frameOfReferenceUID) {
      return {
        ...displaySet,
        isOverlayable: false,
      };
    }

    if (!derivedOverlayModalities.includes(displaySet.Modality)) {
      if (!backGroundCanBeVolume) {
        return {
          ...displaySet,
          isOverlayable: false,
        };
      }

      if (!csUtils.isValidVolume(displaySet.images.map(image => image.imageId))) {
        return {
          ...displaySet,
          isOverlayable: false,
        };
      }
    }

    return {
      ...displaySet,
      isOverlayable,
    };
  });

  return {
    backgroundDisplaySet,
    enhancedDisplaySets,
  };
}

function ViewportDataOverlayMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService } = servicesManager.services;

  const { backgroundDisplaySet, enhancedDisplaySets } = getEnhancedDisplaySets({
    viewportId,
    services: { displaySetService, viewportGridService },
  });

  const derivedOverlays = enhancedDisplaySets.filter(ds =>
    derivedOverlayModalities.includes(ds.Modality)
  );
  const nonDerivedOverlays = enhancedDisplaySets.filter(
    ds => !derivedOverlayModalities.includes(ds.Modality)
  );

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
      <span className="text-foreground flex-grow text-[13px]">{`Background: ${backgroundDisplaySet}`}</span>

      {nonDerivedOverlays.length > 0 && (
        <>
          <Separator className="my-3" />
          <span className="text-muted-foreground mb-2 text-xs font-semibold">Foreground</span>
          <ul className="space-y-1">
            <ScrollArea className="h-[150px]">
              {nonDerivedOverlays.map(displaySet => (
                <li
                  key={displaySet.displaySetInstanceUID}
                  className="flex items-center text-sm"
                >
                  <Button
                    variant="ghost"
                    disabled={!displaySet.isOverlayable}
                    className="text-muted-foreground w-full"
                  >
                    <div className="flex w-full items-center justify-between">
                      <Icons.Plus className="mr-2 h-6 w-6" />
                      <span className="text-foreground">{displaySet.label}</span>
                      <span className="text-muted-foreground ml-2 mr-2">{displaySet.Modality}</span>
                    </div>
                  </Button>
                </li>
              ))}
            </ScrollArea>
          </ul>
        </>
      )}

      {derivedOverlays.length > 0 && (
        <>
          <Separator className="my-3" />
          <span className="text-muted-foreground mb-2 text-xs font-semibold">Derived Overlays</span>
          <ul className="space-y-1">
            <ScrollArea className="h-[150px]">
              {derivedOverlays.map(displaySet => (
                <li
                  key={displaySet.displaySetInstanceUID}
                  className="flex items-center text-sm"
                >
                  <Button
                    variant="ghost"
                    className="text-muted-foreground w-full"
                    disabled={!displaySet.isOverlayable}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Icons.Plus className="mr-2 h-6 w-6" />
                      <span className="text-foreground">{displaySet.label}</span>
                      <span className="text-muted-foreground ml-2 mr-2">{displaySet.Modality}</span>
                    </div>
                  </Button>
                </li>
              ))}
            </ScrollArea>
          </ul>
        </>
      )}
    </div>
  );
}

export default ViewportDataOverlayMenu;
