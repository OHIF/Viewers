import React, { useState } from 'react';
import {
  Button,
  Icons,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

import { useViewportDisplaySets } from './hooks';
import {
  configureViewportForForegroundAddition,
  configureViewportForForegroundRemoval,
} from './ViewportActions';

function ViewportDataOverlayMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { commandsManager, servicesManager } = useSystem();
  const [showSegmentationSelect, setShowSegmentationSelect] = useState(false);
  const [showForegroundSelect, setShowForegroundSelect] = useState(false);

  const { hangingProtocolService, viewportGridService } = servicesManager.services;

  const {
    backgroundDisplaySet,
    potentialOverlayDisplaySets,
    potentialForegroundDisplaySets,
    potentialBackgroundDisplaySets,
    overlayDisplaySets,
    foregroundDisplaySets,
  } = useViewportDisplaySets(viewportId);

  const removeOverlay = (displaySet: AppTypes.DisplaySet) => {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      displaySet.displaySetInstanceUID
    );

    const viewportDisplaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

    updatedViewports.forEach(viewport => {
      configureViewportForForegroundRemoval({
        viewport,
        displaySetUID: displaySet.displaySetInstanceUID,
        viewportDisplaySetUIDs,
        servicesManager,
      });
    });

    const displaySetInstanceUIDs = updatedViewports[0].displaySetInstanceUIDs;

    commandsManager.runCommand('updateStoredPositionPresentation', {
      viewportId,
      displaySetInstanceUIDs,
    });

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });
  };

  const handleForegroundRemoval = (displaySet: AppTypes.DisplaySet) => {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      displaySet.displaySetInstanceUID
    );

    const viewportDisplaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

    updatedViewports.forEach(viewport => {
      configureViewportForForegroundRemoval({
        viewport,
        displaySetUID: displaySet.displaySetInstanceUID,
        viewportDisplaySetUIDs,
        servicesManager,
      });
    });

    const displaySetInstanceUIDs = updatedViewports[0].displaySetInstanceUIDs;

    commandsManager.runCommand('updateStoredPositionPresentation', {
      viewportId,
      displaySetInstanceUIDs,
    });

    commandsManager.run('setDisplaySetsForViewports', {
      viewportsToUpdate: updatedViewports,
    });
  };

  /**
   * Add an overlay to the viewport
   */
  const handleForegroundSelection = (displaySet: AppTypes.DisplaySet) => {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      displaySet.displaySetInstanceUID
    );

    const currentDisplaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

    updatedViewports.forEach(viewport => {
      configureViewportForForegroundAddition({
        viewport,
        currentDisplaySetUIDs,
        servicesManager,
      });
    });

    const displaySetInstanceUIDs = updatedViewports[0].displaySetInstanceUIDs;

    commandsManager.runCommand('updateStoredPositionPresentation', {
      viewportId,
      displaySetInstanceUIDs,
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
    <div className="bg-popover flex h-full w-[262px] flex-col rounded p-1.5">
      {/* Top buttons row */}
      <div className={`flex`}>
        <Button
          variant="ghost"
          className="text-primary flex items-center p-1"
          onClick={() => setShowForegroundSelect(true)}
          disabled={potentialForegroundDisplaySets.length === 0}
        >
          <Icons.Plus className="h-4 w-4" />
          Foreground
        </Button>
        <Button
          variant="ghost"
          className="text-primary ml-2 flex items-center"
          disabled={potentialOverlayDisplaySets.length === 0}
          onClick={() => setShowSegmentationSelect(true)}
        >
          <Icons.Plus className="h-4 w-4" />
          Segmentation
        </Button>
      </div>

      {/* Segmentations section */}
      <div className="">
        <div className="mt-1">
          {overlayDisplaySets.map((displaySet, index) => (
            <div
              key={displaySet.displaySetInstanceUID}
              className="mb-2 flex items-center"
            >
              <Icons.LayerSegmentation className="text-muted-foreground mr-1 h-6 w-6" />
              <Select value={displaySet.displaySetInstanceUID}>
                <SelectTrigger className="flex-grow">
                  <SelectValue>{displaySet.label?.toUpperCase()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {potentialOverlayDisplaySets.map(item => (
                    <SelectItem
                      key={item.displaySetInstanceUID}
                      value={item.displaySetInstanceUID}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                  >
                    <Icons.More className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="right">
                  <DropdownMenuItem onClick={() => removeOverlay(displaySet)}>
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {showSegmentationSelect &&
            potentialOverlayDisplaySets.length > 0 &&
            !overlayDisplaySets.length && (
              <div className="mb-2 flex items-center">
                <Icons.LayerSegmentation className="text-muted-foreground mr-1 h-6 w-6" />
                <Select
                  value=""
                  onValueChange={value => {
                    const selectedDisplaySet = potentialOverlayDisplaySets.find(
                      ds => ds.displaySetInstanceUID === value
                    );
                    if (selectedDisplaySet) {
                      handleForegroundSelection(selectedDisplaySet);
                      setShowSegmentationSelect(false);
                    }
                  }}
                >
                  <SelectTrigger className="flex-grow">
                    <SelectValue placeholder="SELECT A SEGMENTATION" />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialOverlayDisplaySets.map(item => (
                      <SelectItem
                        key={item.displaySetInstanceUID}
                        value={item.displaySetInstanceUID}
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={() => setShowSegmentationSelect(false)}
                >
                  <Icons.Close className="h-4 w-4" />
                </Button>
              </div>
            )}
        </div>

        {/* Foregrounds section */}
        <div className="mt-1 px-1">
          {foregroundDisplaySets.map((displaySet, index) => (
            <div
              key={displaySet.displaySetInstanceUID}
              className="flex items-center"
            >
              <Icons.LayerForeground className="text-muted-foreground mr-1 h-6 w-6" />
              <Select value={displaySet.displaySetInstanceUID}>
                <SelectTrigger className="flex-grow">
                  <SelectValue>{displaySet.label?.toUpperCase()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {potentialForegroundDisplaySets.map(item => (
                    <SelectItem
                      key={item.displaySetInstanceUID}
                      value={item.displaySetInstanceUID}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                  >
                    <Icons.More className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="right">
                  <DropdownMenuItem onClick={() => handleForegroundRemoval(displaySet)}>
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {showForegroundSelect && potentialForegroundDisplaySets.length > 0 && (
            <div className="mb-2 flex items-center">
              <Icons.LayerForeground className="text-muted-foreground mr-1 h-6 w-6" />
              <Select
                value=""
                onValueChange={value => {
                  const selectedDisplaySet = potentialForegroundDisplaySets.find(
                    ds => ds.displaySetInstanceUID === value
                  );
                  if (selectedDisplaySet) {
                    handleForegroundSelection(selectedDisplaySet);
                    setShowForegroundSelect(false);
                  }
                }}
              >
                <SelectTrigger className="flex-grow">
                  <SelectValue placeholder="SELECT A FOREGROUND" />
                </SelectTrigger>
                <SelectContent>
                  {potentialForegroundDisplaySets.map(item => (
                    <SelectItem
                      key={item.displaySetInstanceUID}
                      value={item.displaySetInstanceUID}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={() => setShowForegroundSelect(false)}
              >
                <Icons.Close className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Background section */}
        <div className="mt-1 flex items-center px-1">
          <Icons.LayerBackground className="text-muted-foreground mr-1 h-6 w-6" />
          <Select
            value={backgroundDisplaySet.displaySetInstanceUID}
            onValueChange={value => {
              const selectedDisplaySet = potentialBackgroundDisplaySets.find(
                ds => ds.displaySetInstanceUID === value
              );
              if (selectedDisplaySet) {
                handleBackgroundSelection(selectedDisplaySet);
              }
            }}
          >
            <SelectTrigger className="flex-grow">
              <SelectValue>
                {(
                  backgroundDisplaySet.SeriesDescription ||
                  backgroundDisplaySet.label ||
                  'background'
                ).toUpperCase()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {potentialBackgroundDisplaySets.map(displaySet => (
                <SelectItem
                  key={displaySet.displaySetInstanceUID}
                  value={displaySet.displaySetInstanceUID}
                >
                  {displaySet.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Bottom control - only show if foregrounds exist */}
      {foregroundDisplaySets.length > 0 && (
        <div className="mt-auto">
          <div className="flex items-center">
            <div className="mr-2 flex h-5 w-10 items-center rounded-full bg-blue-900 p-1">
              <div className="h-3 w-3 rounded-full bg-black"></div>
            </div>
            <span className="text-sm text-blue-400">Control threshold & opacity</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewportDataOverlayMenu;
