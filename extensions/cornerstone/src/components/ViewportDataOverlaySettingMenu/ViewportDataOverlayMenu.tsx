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
  Switch,
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
  const [pendingForegrounds, setPendingForegrounds] = useState<string[]>([]);
  const [thresholdOpacityEnabled, setThresholdOpacityEnabled] = useState(false);

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

  /**
   * Handle threshold and opacity toggle
   */
  const handleThresholdOpacityToggle = (checked: boolean) => {
    setThresholdOpacityEnabled(checked);

    // If there are foreground display sets, apply the threshold & opacity settings
    if (foregroundDisplaySets.length > 0) {
      // Example implementation of threshold/opacity adjustment
      commandsManager.runCommand('setForegroundThresholdOpacity', {
        viewportId,
        enabled: checked,
        // You can add additional parameters here as needed
      });
    }
  };

  return (
    <div className="bg-popover flex h-full w-[300px] flex-col rounded rounded-md p-1.5">
      {/* Top buttons row */}
      <div className={`flex`}>
        <Button
          variant="ghost"
          className="text-primary flex items-center p-1"
          onClick={() => {
            // Add a new pending foreground slot with a unique ID
            setPendingForegrounds([...pendingForegrounds, `pending-${Date.now()}`]);
          }}
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

      <div className="">
        {/* Overlays Segmentation section */}
        <div className="my-1">
          {overlayDisplaySets.map((displaySet, index) => (
            <div
              key={displaySet.displaySetInstanceUID}
              className="mb-2 flex items-center"
            >
              <Icons.LayerSegmentation className="text-muted-foreground mr-1 h-6 w-6" />
              <Select
                value={displaySet.displaySetInstanceUID}
                onValueChange={value => {
                  if (value === displaySet.displaySetInstanceUID) {
                    return; // No change if selecting the same display set
                  }

                  // remove this one and add the new one
                  handleForegroundRemoval(displaySet);
                  removeOverlay(displaySet);

                  const selectedDisplaySet = potentialOverlayDisplaySets.find(
                    ds => ds.displaySetInstanceUID === value
                  );

                  if (selectedDisplaySet) {
                    setTimeout(() => {
                      handleForegroundSelection(selectedDisplaySet);
                    }, 0);
                  }
                }}
              >
                <SelectTrigger className="flex-grow">
                  <SelectValue>{displaySet.label?.toUpperCase()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* Include both potential overlays and the current overlay */}
                  <SelectItem
                    key={displaySet.displaySetInstanceUID}
                    value={displaySet.displaySetInstanceUID}
                  >
                    {displaySet.label}
                  </SelectItem>
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
                    <DropdownMenuItem onClick={() => setShowSegmentationSelect(false)}>
                      Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
        </div>
        {/* Foregrounds section */}
        <div className="my-1 px-1">
          {foregroundDisplaySets.map((displaySet, index) => (
            <div
              key={displaySet.displaySetInstanceUID}
              className="flex items-center"
            >
              <Icons.LayerForeground className="text-muted-foreground mr-1 h-6 w-6" />
              <Select
                value={displaySet.displaySetInstanceUID}
                onValueChange={value => {
                  if (value === displaySet.displaySetInstanceUID) {
                    return;
                  }

                  // remove this one and add the new one
                  handleForegroundRemoval(displaySet);

                  const selectedDisplaySet = potentialForegroundDisplaySets.find(
                    ds => ds.displaySetInstanceUID === value
                  );

                  if (selectedDisplaySet) {
                    setTimeout(() => {
                      handleForegroundSelection(selectedDisplaySet);
                    }, 0);
                  }
                }}
              >
                <SelectTrigger className="flex-grow">
                  <SelectValue>{displaySet.label?.toUpperCase()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* Include both potential foregrounds and the current foreground */}
                  <SelectItem
                    key={displaySet.displaySetInstanceUID}
                    value={displaySet.displaySetInstanceUID}
                  >
                    {displaySet.label}
                  </SelectItem>
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
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleForegroundRemoval(displaySet)}>
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {pendingForegrounds.map(pendingId => (
            <div
              key={pendingId}
              className="mb-2 flex items-center"
            >
              <Icons.LayerForeground className="text-muted-foreground mr-1 h-6 w-6" />
              <Select
                value=""
                onValueChange={value => {
                  const selectedDisplaySet = potentialForegroundDisplaySets.find(
                    ds => ds.displaySetInstanceUID === value
                  );
                  if (selectedDisplaySet) {
                    handleForegroundSelection(selectedDisplaySet);
                    // Remove this pending foreground from the list
                    setPendingForegrounds(pendingForegrounds.filter(id => id !== pendingId));
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
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => {
                      // Remove this pending foreground
                      setPendingForegrounds(pendingForegrounds.filter(id => id !== pendingId));
                    }}
                  >
                    Cancel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        {/* Background section */}
        <div className="mt-1 mb-1 flex items-center px-1">
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
        <div className="mt-1 ml-7">
          <div className="flex items-center">
            <Switch
              id="threshold-opacity-switch"
              className="mr-2"
              checked={thresholdOpacityEnabled}
              onCheckedChange={handleThresholdOpacityToggle}
            />
            <label
              htmlFor="threshold-opacity-switch"
              className="text-muted-foreground cursor-pointer text-sm"
              onClick={() => setThresholdOpacityEnabled(!thresholdOpacityEnabled)}
            >
              Control threshold & opacity
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewportDataOverlayMenu;
