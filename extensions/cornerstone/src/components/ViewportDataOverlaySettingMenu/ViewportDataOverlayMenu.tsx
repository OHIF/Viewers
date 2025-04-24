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
  configureViewportForForegroundAddition,
} from './ViewportActions';

function ViewportDataOverlayMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { commandsManager, servicesManager } = useSystem();
  const { hangingProtocolService, customizationService, viewportGridService } =
    servicesManager.services;

  const {
    backgroundDisplaySet,
    potentialOverlayDisplaySets,
    potentialForegroundDisplaySets,
    potentialBackgroundDisplaySets,
    overlayDisplaySets,
    foregroundDisplaySets,
  } = useViewportDisplaySets(viewportId);

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
   * Add an overlay to the viewport
   */
  const handleForegroundSelection = (displaySet: AppTypes.DisplaySet) => {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      displaySet.displaySetInstanceUID
    );

    const currentDisplaySets = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

    updatedViewports.forEach(viewport => {
      configureViewportForForegroundAddition({
        viewport,
        currentDisplaySets,
        servicesManager,
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
  };

  /**
   * Change the background display set
   */
  const handleBackgroundSelection = (newBackgroundDisplaySet: AppTypes.DisplaySet) => {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      newBackgroundDisplaySet.displaySetInstanceUID
    );

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });
  };

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded p-3">
      {overlayDisplaySets.length > 0 && (
        <>
          <Separator className="my-3" />
          <span className="text-muted-foreground mb-2 block text-xs font-semibold">
            Active SEG Overlays
          </span>

          <div className="flex-grow">
            <ScrollArea className="h-[80px] w-full">
              <div className="space-y-1">
                {overlayDisplaySets.map(displaySet => (
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
      <span className="text-muted-foreground mb-2 block text-xs font-semibold">
        Available SEG Overlays
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between border-[#061430] bg-[#061430] text-[#3498db]"
            disabled={potentialOverlayDisplaySets.length === 0}
          >
            <Icons.ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[230px]">
          <DropdownMenuLabel>Available SEG Overlays</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {potentialOverlayDisplaySets.length > 0 ? (
            potentialOverlayDisplaySets.map(overlayDisplaySet => (
              <DropdownMenuItem
                key={overlayDisplaySet.displaySetInstanceUID}
                onSelect={() => {
                  handleForegroundSelection(overlayDisplaySet);
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <span>{`${overlayDisplaySet.isMadeInClient ? '(User)' : ''}${overlayDisplaySet.label}`}</span>
                  <span className="text-muted-foreground text-xs">
                    {overlayDisplaySet.Modality}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No overlays available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {foregroundDisplaySets.length > 0 && (
        <>
          <Separator className="my-3" />
          <span className="text-muted-foreground mb-2 block text-xs font-semibold">
            Active Foregrounds
          </span>

          <div className="flex-grow">
            <ScrollArea className="h-[80px] w-full">
              <div className="space-y-1">
                {foregroundDisplaySets.map(displaySet => (
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
                        onClick={() => removeForeground(displaySet)}
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

      {potentialForegroundDisplaySets.length > 0 && (
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
                <Icons.ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[230px]">
              <DropdownMenuLabel>Available Foregrounds</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {potentialForegroundDisplaySets.map(displaySet => (
                <DropdownMenuItem
                  key={displaySet.displaySetInstanceUID}
                  onSelect={() => handleForegroundSelection(displaySet)}
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
