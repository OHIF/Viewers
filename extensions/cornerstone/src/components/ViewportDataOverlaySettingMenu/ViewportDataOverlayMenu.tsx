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

import { useViewportDisplaySets, useOverlayState } from './hooks';
import {
  configureViewportForOverlayAddition,
  configureViewportForOverlayRemoval,
  configureViewportForBackgroundChange,
} from './ViewportActions';

function ViewportDataOverlayMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { commandsManager, servicesManager } = useSystem();
  const { hangingProtocolService, cornerstoneViewportService, customizationService } =
    servicesManager.services;

  const {
    backgroundDisplaySet,
    derivedOverlays,
    nonDerivedOverlays,
    potentialBackgroundDisplaySets,
  } = useViewportDisplaySets(viewportId);

  const {
    activeOverlays,
    overlayOpacities,
    addOverlay: addOverlayToState,
    removeOverlay: removeOverlayFromState,
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
        cornerstoneViewportService,
        viewportId,
        customizationService,
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
      });
    });

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });

    removeOverlayFromState(displaySet.displaySetInstanceUID);
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
      });
    });

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });
  };

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
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
          {derivedOverlays
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
