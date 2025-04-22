import React, { useState, useEffect } from 'react';
import { Button, Icons, ScrollArea, Separator } from '@ohif/ui-next';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@ohif/ui-next';
import { utilities as csUtils } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core';
import { DisplaySet } from '@ohif/core';

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

    if (displaySet.unsupported) {
      return {
        ...displaySet,
        isOverlayable: false,
      };
    }

    if (
      displaySet.FrameOfReferenceUID &&
      displaySet.FrameOfReferenceUID !== backgroundDisplaySet.FrameOfReferenceUID
    ) {
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

      const imageIds = displaySet.imageIds || displaySet.images?.map(image => image.imageId);
      const isMultiframe = displaySet.isMultiFrame;

      if (!isMultiframe && imageIds.length > 0 && !csUtils.isValidVolume(imageIds)) {
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

  // Get all available display sets that could be used
  const allDisplaySets = displaySetService.getActiveDisplaySets();

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

    // Get all current active overlay UIDs
    const currentOverlayUIDs = activeOverlays.map(overlay => overlay.displaySetInstanceUID);

    // Configure the viewport with background and all overlays (existing + new)
    updatedViewports.forEach(viewport => {
      // Set the display sets (background followed by current overlays plus the new one)
      viewport.displaySetInstanceUIDs = [
        backgroundDisplaySet.displaySetInstanceUID,
        ...currentOverlayUIDs,
        displaySet.displaySetInstanceUID,
      ];

      if (!viewport.viewportOptions) {
        viewport.viewportOptions = {};
      }
      viewport.viewportOptions.viewportType = 'volume';

      // Reset display options
      viewport.displaySetOptions = [];

      // Add option for background (empty options)
      viewport.displaySetOptions.push({});

      // Add options for each existing overlay with its opacity
      activeOverlays.forEach(overlay => {
        // Skip adding displaySetOptions for SEG modality
        if (overlay.Modality === 'SEG') {
          viewport.displaySetOptions.push({});
          return;
        }

        const opacity = overlayOpacities[overlay.displaySetInstanceUID] || 90;
        viewport.displaySetOptions.push({
          colormap: {
            name: 'hsv',
            opacity: opacity / 100, // Convert to 0-1 range
          },
        });
      });

      // Add option for the new overlay
      // Skip adding colormap options for SEG modality
      if (displaySet.Modality === 'SEG') {
        viewport.displaySetOptions.push({});
      } else {
        viewport.displaySetOptions.push({
          colormap: {
            name: 'hsv',
            opacity: 0.9,
          },
        });
      }
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

  // Get potential background display sets (all non-derived modalities that can be valid volumes)
  const getPotentialBackgroundDisplaySets = (): DisplaySet[] => {
    // Get all display sets that are not derived modalities
    return allDisplaySets.filter(
      ds =>
        !derivedOverlayModalities.includes(ds.Modality) &&
        // Don't include the current background
        ds.displaySetInstanceUID !== backgroundDisplaySet.displaySetInstanceUID
    );
  };

  // Handler for background selection - actually changes the background
  const handleBackgroundSelection = (newBackgroundDisplaySet: DisplaySet) => {
    if (
      !newBackgroundDisplaySet ||
      newBackgroundDisplaySet.displaySetInstanceUID === backgroundDisplaySet.displaySetInstanceUID
    ) {
      return;
    }

    // Get updated viewports from hanging protocol service
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      newBackgroundDisplaySet.displaySetInstanceUID
    );

    // Update the viewport's display sets to use the new background
    const activeOverlayUIDs = activeOverlays.map(overlay => overlay.displaySetInstanceUID);

    // Configure each viewport
    updatedViewports.forEach(viewport => {
      // Set the display sets (new background followed by any active overlays)
      viewport.displaySetInstanceUIDs = [
        newBackgroundDisplaySet.displaySetInstanceUID,
        ...activeOverlayUIDs,
      ];

      if (!viewport.viewportOptions) {
        viewport.viewportOptions = {};
      }
      viewport.viewportOptions.viewportType = 'volume';

      // Create display options for each display set
      if (!viewport.displaySetOptions) {
        viewport.displaySetOptions = [];
      } else {
        viewport.displaySetOptions = [];
      }

      // First entry is for background (empty options)
      viewport.displaySetOptions.push({});

      // Add options for each overlay with its opacity
      activeOverlays.forEach(overlay => {
        // Skip adding displaySetOptions for SEG modality
        if (overlay.Modality === 'SEG') {
          viewport.displaySetOptions.push({});
          return;
        }

        const opacity = overlayOpacities[overlay.displaySetInstanceUID] || 90;
        viewport.displaySetOptions.push({
          colormap: {
            name: 'hsv',
            opacity: opacity / 100, // Convert to 0-1 range
          },
        });
      });
    });

    // Update viewports with the changes
    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });
  };

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
      {/* SECTION 1: All Overlayables - Dropdown */}
      <span className="text-muted-foreground mb-2 block text-xs font-semibold">
        Available Overlays
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between border-[#061430] bg-[#061430] text-[#3498db]"
          >
            <span>Select overlay...</span>
            <Icons.ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[230px]">
          <DropdownMenuLabel>Overlayable Items</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {[...derivedOverlays]
            .filter(ds => ds.isOverlayable)
            .map(displaySet => (
              <DropdownMenuItem
                key={displaySet.displaySetInstanceUID}
                onSelect={() => addOverlay(displaySet)}
                disabled={!displaySet.isOverlayable}
              >
                <div className="flex w-full items-center justify-between">
                  <span>{displaySet.label}</span>
                  <span className="text-muted-foreground text-xs">{displaySet.Modality}</span>
                </div>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Overlays with Opacity Controls */}
      {activeOverlays.length > 0 && (
        <>
          <Separator className="my-3" />
          <span className="text-muted-foreground mb-2 block text-xs font-semibold">
            Active Overlays
          </span>

          <div className="flex-grow">
            <ScrollArea className="h-[80px] w-full">
              <div className="space-y-1">
                {activeOverlays.map(displaySet => (
                  <div
                    key={displaySet.displaySetInstanceUID}
                    className="hover:bg-muted-foreground/10 flex items-center justify-between rounded p-2"
                  >
                    <span className="text-foreground text-sm">{displaySet.label}</span>
                    <div className="flex items-center">
                      <span className="text-muted-foreground mr-2 text-xs">
                        {displaySet.Modality}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeOverlay(displaySet)}
                      >
                        <Icons.Close className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {/* SECTION 2: Foregrounds */}
      {nonDerivedOverlays.length > 0 && (
        <>
          <Separator className="my-3" />
          <span className="text-muted-foreground mb-2 block text-xs font-semibold">
            Foregrounds
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between border-[#061430] bg-[#061430] text-[#3498db]"
              >
                <span>Select foreground...</span>
                <Icons.ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[230px]">
              <DropdownMenuLabel>Available Foregrounds</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {nonDerivedOverlays.map(displaySet => (
                <DropdownMenuItem
                  key={displaySet.displaySetInstanceUID}
                  onSelect={() => addOverlay(displaySet)}
                  disabled={!displaySet.isOverlayable}
                >
                  <div className="flex w-full items-center justify-between">
                    <span>{displaySet.label}</span>
                    <span className="text-muted-foreground text-xs">{displaySet.Modality}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {/* SECTION 3: Background */}
      <Separator className="my-3" />
      <span className="text-muted-foreground mb-2 block text-xs font-semibold">Background</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between border-[#061430] bg-[#061430] text-[#3498db]"
          >
            <div className="flex items-center space-x-2">
              <span>Select</span>
              <span className="font-medium text-[#3498db]">
                {backgroundDisplaySet.SeriesDescription?.toLowerCase() ||
                  backgroundDisplaySet.label?.toLowerCase() ||
                  'background'}
              </span>
            </div>
            <Icons.ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[230px]">
          <DropdownMenuLabel>Current Background</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <div className="flex w-full items-center justify-between">
              <span>{backgroundDisplaySet.label}</span>
              <span className="text-muted-foreground text-xs">{backgroundDisplaySet.Modality}</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Available Backgrounds</DropdownMenuLabel>

          {getPotentialBackgroundDisplaySets().map(displaySet => (
            <DropdownMenuItem
              key={displaySet.displaySetInstanceUID}
              onSelect={() => handleBackgroundSelection(displaySet)}
            >
              <div className="flex w-full items-center justify-between">
                <span>{displaySet.label}</span>
                <span className="text-muted-foreground text-xs">{displaySet.Modality}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ViewportDataOverlayMenu;
