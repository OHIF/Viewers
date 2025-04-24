import React from 'react';
import { Button, Icons, ScrollArea, Separator } from '@ohif/ui-next';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/tools';

import { useViewportDisplaySets, useOverlayState } from './hooks';
import {
  configureViewportForOverlayAddition,
  configureViewportForOverlayRemoval,
  configureViewportForBackgroundChange,
} from './ViewportActions';

function ViewportDataOverlayMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { commandsManager, servicesManager } = useSystem();
  const { hangingProtocolService, customizationService, segmentationService } =
    servicesManager.services;

  const {
    backgroundDisplaySet,
    derivedOverlays,
    nonDerivedOverlays,
    potentialBackgroundDisplaySets,
    availableSegmentations,
  } = useViewportDisplaySets(viewportId);

  const {
    activeOverlays,
    activeSegmentations,
    overlayOpacities,
    addOverlay: addOverlayToState,
    removeOverlay: removeOverlayFromState,
    addSegmentation: addSegmentationToState,
    removeSegmentation: removeSegmentationFromState,
  } = useOverlayState(viewportId);

  /**
   * Add an overlay to the viewport
   */
  const addOverlay = (displaySet: AppTypes.DisplaySet) => {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      displaySet.displaySetInstanceUID
    );

    updatedViewports.forEach(viewport => {
      configureViewportForOverlayAddition({
        viewport,
        backgroundDisplaySet,
        currentOverlays: activeOverlays,
        newDisplaySet: displaySet,
        overlayOpacities,
        servicesManager,
        activeSegmentations,
      });
    });

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

    addOverlayToState(displaySet);
  };

  /**
   * Add a segmentation as an overlay to the viewport
   */
  const addSegmentationOverlay = segmentation => {
    // If this is a display set (has displaySetInstanceUID), we can use the standard overlay handling
    if (segmentation.displaySetInstanceUID) {
      addOverlay(segmentation);
      return;
    }

    // Legacy method for segmentations that aren't display sets yet
    // First ensure viewport is in volume mode if needed
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      backgroundDisplaySet.displaySetInstanceUID
    );

    // Configure viewport to be ready for overlay
    updatedViewports.forEach(viewport => {
      if (!viewport.viewportOptions) {
        viewport.viewportOptions = {};
      }
      viewport.viewportOptions.viewportType = 'volume';

      commandsManager.run('setDisplaySetsForViewports', {
        viewportsToUpdate: updatedViewports,
      });
    });

    // After viewport is configured, add the segmentation representation
    segmentationService.addSegmentationRepresentation(viewportId, {
      segmentationId: segmentation.segmentationId,
      type: Enums.SegmentationRepresentations.Labelmap,
    });

    addSegmentationToState({
      segmentationId: segmentation.segmentationId,
      label: segmentation.label,
      type: 'LABELMAP',
    });
  };

  /**
   * Remove an overlay from the viewport
   */
  const removeOverlay = (displaySet: AppTypes.DisplaySet) => {
    if (displaySet.displaySetInstanceUID === backgroundDisplaySet.displaySetInstanceUID) {
      return;
    }

    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      backgroundDisplaySet.displaySetInstanceUID
    );

    const remainingOverlays = activeOverlays.filter(
      overlay => overlay.displaySetInstanceUID !== displaySet.displaySetInstanceUID
    );

    updatedViewports.forEach(viewport => {
      configureViewportForOverlayRemoval({
        viewport,
        backgroundDisplaySet,
        remainingOverlays,
        overlayOpacities,
        customizationService,
        activeSegmentations,
      });
    });

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });

    removeOverlayFromState(displaySet.displaySetInstanceUID);
  };

  /**
   * Remove a segmentation from the viewport
   */
  const removeSegmentationOverlay = segmentation => {
    const segmentationId = segmentation.segmentationId || segmentation.id;

    // If this is a display set, use the display set removal
    if (segmentation.displaySetInstanceUID) {
      removeOverlay(segmentation);

      // Also need to remove the segmentation representation
      if (segmentationId) {
        segmentationService.removeSegmentationRepresentations(viewportId, {
          segmentationId: segmentationId,
        });
      }
      return;
    }

    // Legacy method for segmentations that aren't display sets
    segmentationService.removeSegmentationRepresentations(viewportId, {
      segmentationId: segmentationId,
    });

    removeSegmentationFromState(segmentationId);
  };

  /**
   * Change the background display set
   */
  const handleBackgroundSelection = (newBackgroundDisplaySet: AppTypes.DisplaySet) => {
    if (
      !newBackgroundDisplaySet ||
      newBackgroundDisplaySet.displaySetInstanceUID === backgroundDisplaySet.displaySetInstanceUID
    ) {
      return;
    }

    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      newBackgroundDisplaySet.displaySetInstanceUID
    );

    updatedViewports.forEach(viewport => {
      configureViewportForBackgroundChange({
        viewport,
        newBackgroundDisplaySet,
        activeOverlays,
        overlayOpacities,
        customizationService,
        activeSegmentations,
      });
    });

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });
  };

  // For backward compatibility, check if there are any segmentations that aren't yet display sets
  const displaySetIds = derivedOverlays
    .filter(ds => ds.segmentationId)
    .map(ds => ds.segmentationId);

  const availableSegmentationsFiltered = availableSegmentations.filter(
    seg =>
      !displaySetIds.includes(seg.segmentationId) &&
      !activeSegmentations.some(activeSeg => activeSeg.segmentationId === seg.segmentationId)
  );

  // Mark user-created segmentations from segmentation service (for backward compatibility)
  const userSegmentations = availableSegmentationsFiltered.map(segmentation => ({
    ...segmentation,
    isUserCreated: true,
    isOverlayable: true,
    label: `(User) ${segmentation.label}`,
    Modality: 'SEG',
  }));

  // For display sets that are segmentations and made in client, add the User prefix
  const enhancedDerivedOverlays = derivedOverlays.map(displaySet =>
    displaySet.madeInClient && displaySet.Modality === 'SEG'
      ? {
          ...displaySet,
          label: displaySet.label.startsWith('(User)')
            ? displaySet.label
            : `(User) ${displaySet.label}`,
          isUserCreated: true,
        }
      : displaySet
  );

  const allAvailableOverlays = [...userSegmentations, ...enhancedDerivedOverlays].filter(
    overlay => overlay.isOverlayable !== false
  );

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
      {(activeOverlays.length > 0 || activeSegmentations.length > 0) && (
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

                {activeSegmentations.map(segmentation => (
                  <div
                    key={segmentation.segmentationId}
                    className="hover:bg-muted-foreground/10 flex items-center justify-between rounded p-2"
                  >
                    <span className="text-foreground text-sm">
                      {segmentation.label.startsWith('(User)')
                        ? segmentation.label
                        : `(User) ${segmentation.label}`}
                    </span>
                    <div className="flex items-center">
                      <span className="text-muted-foreground mr-2 text-xs">SEG</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeSegmentationOverlay(segmentation)}
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
          {allAvailableOverlays.map(overlay => (
            <DropdownMenuItem
              key={overlay.displaySetInstanceUID || overlay.segmentationId}
              onSelect={() => {
                // User created segmentations can now be either display sets with madeInClient=true
                // or legacy segmentations directly from segmentation service
                if ((overlay.madeInClient && overlay.Modality === 'SEG') || overlay.isUserCreated) {
                  addSegmentationOverlay(overlay);
                } else {
                  addOverlay(overlay);
                }
              }}
            >
              <div className="flex w-full items-center justify-between">
                <span>{overlay.label}</span>
                <span className="text-muted-foreground text-xs">{overlay.Modality}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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

          {potentialBackgroundDisplaySets.map(displaySet => (
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
