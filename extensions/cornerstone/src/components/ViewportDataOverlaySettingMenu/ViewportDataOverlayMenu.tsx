import React, { useState, useEffect } from 'react';
import { Button, Icons, ScrollArea, Separator } from '@ohif/ui-next';
import { utilities as csUtils } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core';
import { DisplaySet } from '@ohif/core';
import { Numeric } from '@ohif/ui-next';

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

  const backgroundDisplaySet = viewportDisplaySets[0];
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

    // we need to have other checks for derived modalities SEG, RTSTRUCT, SR
    // that look at the them actually
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
  const { servicesManager, commandsManager } = useSystem();
  const { displaySetService, viewportGridService, hangingProtocolService } =
    servicesManager.services;

  const [activeOverlays, setActiveOverlays] = useState<DisplaySet[]>([]);
  const [overlayOpacities, setOverlayOpacities] = useState<Record<string, number>>({});

  const { backgroundDisplaySet, enhancedDisplaySets } = getEnhancedDisplaySets({
    viewportId,
    services: { displaySetService, viewportGridService },
  });

  // Initialize active overlays based on current viewport state
  useEffect(() => {
    const displaySetsUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
    // First UID is the background, any additional UIDs are overlays
    if (displaySetsUIDs.length > 1) {
      const overlayUIDs = displaySetsUIDs.slice(1);
      const currentOverlays = overlayUIDs.map(uid => displaySetService.getDisplaySetByUID(uid));
      setActiveOverlays(currentOverlays);

      // Initialize opacities for new overlays
      const newOpacities = { ...overlayOpacities };
      currentOverlays.forEach(overlay => {
        if (!newOpacities[overlay.displaySetInstanceUID]) {
          newOpacities[overlay.displaySetInstanceUID] = 90; // Default 90% opacity
        }
      });
      setOverlayOpacities(newOpacities);
    } else {
      setActiveOverlays([]);
    }
  }, [viewportId, displaySetService, viewportGridService]);

  // Add background to active overlays for display purposes
  const displayedOverlays = [backgroundDisplaySet, ...activeOverlays];

  // Sort function: puts disabled items (isOverlayable: false) at the end
  const sortByOverlayable = (a, b) => {
    if (a.isOverlayable === b.isOverlayable) {
      return 0;
    }
    return a.isOverlayable ? -1 : 1;
  };

  const derivedOverlays = enhancedDisplaySets
    .filter(ds => derivedOverlayModalities.includes(ds.Modality))
    .sort(sortByOverlayable);
  const nonDerivedOverlays = enhancedDisplaySets
    .filter(ds => !derivedOverlayModalities.includes(ds.Modality))
    .sort(sortByOverlayable);

  const addOverlay = (displaySet: DisplaySet) => {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      displaySet.displaySetInstanceUID
      // isHangingProtocolLayout
    );

    // append the background displaySet to the updatedViewports
    updatedViewports.forEach(viewport => {
      viewport.displaySetInstanceUIDs.unshift(backgroundDisplaySet.displaySetInstanceUID);
      if (!viewport.viewportOptions) {
        viewport.viewportOptions = {};
      }
      viewport.viewportOptions.viewportType = 'volume';

      if (!viewport.displaySetOptions) {
        viewport.displaySetOptions = [];
      }
      viewport.displaySetOptions.push({});
      viewport.displaySetOptions.push({
        colormap: {
          name: 'hsv',
          opacity: 0.9,
        },
      });
    });

    // update the previously stored positionPresentation with the new viewportId
    // presentation so that when we put the referencedDisplaySet back in the viewport
    // it will be in the correct position zoom and pan
    commandsManager.runCommand('updateStoredPositionPresentation', {
      viewportId,
      displaySetInstanceUIDs: [
        backgroundDisplaySet.displaySetInstanceUID,
        displaySet.displaySetInstanceUID,
      ],
    });

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });

    // Update state to show the added overlay
    setActiveOverlays(prevOverlays => [...prevOverlays, displaySet]);

    // Initialize opacity for the new overlay
    setOverlayOpacities(prev => ({
      ...prev,
      [displaySet.displaySetInstanceUID]: 90,
    }));
  };

  const removeOverlay = (displaySet: DisplaySet) => {
    // Skip if trying to remove the background
    if (displaySet.displaySetInstanceUID === backgroundDisplaySet.displaySetInstanceUID) {
      return;
    }

    // Create a viewport with just the background display set
    const updatedViewport = {
      viewportId,
      displaySetInstanceUIDs: [backgroundDisplaySet.displaySetInstanceUID],
      viewportOptions: {
        viewportType: 'volume',
      },
      displaySetOptions: [{}],
    };

    // Update the viewport to show only the background
    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: [updatedViewport],
    });

    // Update state to remove the overlay
    setActiveOverlays(prevOverlays =>
      prevOverlays.filter(
        overlay => overlay.displaySetInstanceUID !== displaySet.displaySetInstanceUID
      )
    );

    // Remove opacity setting for this overlay
    setOverlayOpacities(prev => {
      const newOpacities = { ...prev };
      delete newOpacities[displaySet.displaySetInstanceUID];
      return newOpacities;
    });
  };

  const updateOpacity = (displaySetUID: string, opacity: number) => {
    // Skip if it's the background (first item)
    if (displaySetUID === backgroundDisplaySet.displaySetInstanceUID) {
      return;
    }

    // Update opacity in state
    setOverlayOpacities(prev => ({
      ...prev,
      [displaySetUID]: opacity,
    }));

    // Find the active overlay
    const overlay = activeOverlays.find(o => o.displaySetInstanceUID === displaySetUID);
    if (!overlay) {
      return;
    }

    // Update the viewport with new opacity
    const updatedViewport = {
      viewportId,
      displaySetInstanceUIDs: [backgroundDisplaySet.displaySetInstanceUID, displaySetUID],
      viewportOptions: {
        viewportType: 'volume',
      },
      displaySetOptions: [
        {},
        {
          colormap: {
            name: 'hsv',
            opacity: opacity / 100, // Convert to 0-1 range
          },
        },
      ],
    };

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: [updatedViewport],
    });
  };

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
      <Separator className="my-3" />
      <span className="text-muted-foreground mb-2 text-xs font-semibold">Active Overlays</span>

      <div className="relative h-[80px]">
        {/* Opacity label and slider - only show when there are active overlays */}
        {/* Overlays and Opacity Controls */}
        <div className="grid h-full grid-cols-[auto_1fr] gap-4">
          {activeOverlays.length > 0 && (
            <div className="flex flex-col">
              {/* <span className="text-muted-foreground mb-2 text-xs">Opacity</span> */}
              <div className="relative mt-8 ml-3 h-16">
                <Numeric.Container
                  mode="singleRange"
                  min={0}
                  max={100}
                  step={5}
                  value={overlayOpacities[activeOverlays[0]?.displaySetInstanceUID] || 90}
                  onChange={value => {
                    updateOpacity(activeOverlays[0]?.displaySetInstanceUID, value as number);
                  }}
                >
                  <div className="relative h-16">
                    <div
                      className="absolute"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'left center',
                        width: '64px',
                        left: '0',
                        top: '32px',
                      }}
                    >
                      <Numeric.SingleRange sliderClassName="w-16" />
                    </div>
                  </div>
                </Numeric.Container>
              </div>
            </div>
          )}

          {/* Overlays List */}
          <div className="flex-grow">
            <ScrollArea className="h-full w-full">
              <div className="flex flex-col space-y-1 text-[13px]">
                {/* Reverse the order so PET is on top and CT is on bottom */}
                {[...displayedOverlays].reverse().map((displaySet, index) => {
                  const isBackground = index === displayedOverlays.length - 1;
                  return (
                    <div
                      key={displaySet.displaySetInstanceUID}
                      className="flex items-center rounded p-2"
                    >
                      {isBackground ? (
                        <>
                          <Icons.StatusSuccess className="text-primary mr-2 h-5 w-5" />
                          <span className="text-foreground">{displaySet.label}</span>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => removeOverlay(displaySet)}
                        >
                          <div className="flex w-full items-center justify-between">
                            <Icons.Minus className="text-primary h-5 w-5" />
                            <span className="text-foreground ml-2 flex-grow">
                              {displaySet.label}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {displaySet.Modality}
                            </span>
                          </div>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

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
                    onClick={() => addOverlay(displaySet)}
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
                    onClick={() => addOverlay(displaySet)}
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
