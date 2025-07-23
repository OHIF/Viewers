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

import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import SelectItemWithModality from '../SelectItemWithModality';
import { useViewportRendering } from '../../hooks';

function ViewportDataOverlayMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { commandsManager, servicesManager } = useSystem();
  const [pendingForegrounds, setPendingForegrounds] = useState<string[]>([]);
  const [pendingSegmentations, setPendingSegmentations] = useState<string[]>([]);
  const { toggleColorbar } = useViewportRendering(viewportId);

  const { hangingProtocolService, toolbarService } = servicesManager.services;

  const {
    backgroundDisplaySet,
    potentialOverlayDisplaySets,
    potentialForegroundDisplaySets,
    potentialBackgroundDisplaySets,
    overlayDisplaySets,
    foregroundDisplaySets,
  } = useViewportDisplaySets(viewportId);

  const [optimisticOverlayDisplaySets, setOptimisticOverlayDisplaySets] =
    useState(overlayDisplaySets);

  const [thresholdOpacityEnabled, setThresholdOpacityEnabled] = useState(false);

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
   * Replace a display set layer with a new one
   */
  const handleReplaceDisplaySetLayer = (
    currentDisplaySetInstanceUID: string,
    newDisplaySetInstanceUID: string
  ) => {
    // Remove current display set
    commandsManager.runCommand('removeDisplaySetLayer', {
      viewportId,
      displaySetInstanceUID: currentDisplaySetInstanceUID,
    });

    setTimeout(() => {
      commandsManager.runCommand('addDisplaySetAsLayer', {
        viewportId,
        displaySetInstanceUID: newDisplaySetInstanceUID,
      });
    }, 0);
  };

  /**
   * Remove a display set layer
   */
  const handleRemoveDisplaySetLayer = (displaySetInstanceUID: string) => {
    const optimisticOverlayDisplaySetsIndex = optimisticOverlayDisplaySets.findIndex(
      displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
    );

    if (optimisticOverlayDisplaySetsIndex !== -1) {
      setOptimisticOverlayDisplaySets(prevOptimisticOverlayDisplaySets => {
        return prevOptimisticOverlayDisplaySets.filter(
          displaySet => displaySet.displaySetInstanceUID !== displaySetInstanceUID
        );
      });
    }

    commandsManager.runCommand('removeDisplaySetLayer', {
      viewportId,
      displaySetInstanceUID,
    });
  };

  /**
   * Add a display set as a layer
   */
  const handleAddDisplaySetAsLayer = (displaySetInstanceUID: string) => {
    commandsManager.runCommand('addDisplaySetAsLayer', {
      viewportId,
      displaySetInstanceUID,
    });
  };

  /**
   * Handle overlay display set selection change
   */
  const handleOverlaySelectionChange = (
    currentDisplaySet: AppTypes.DisplaySet,
    newDisplaySetInstanceUID: string
  ) => {
    if (newDisplaySetInstanceUID === currentDisplaySet.displaySetInstanceUID) {
      return;
    }

    // Find the selected display set
    const selectedDisplaySet = potentialOverlayDisplaySets.find(
      ds => ds.displaySetInstanceUID === newDisplaySetInstanceUID
    );

    if (selectedDisplaySet) {
      setOptimisticOverlayDisplaySets(prevOptimisticOverlayDisplaySets => {
        const currentDisplaySetIndex = prevOptimisticOverlayDisplaySets.findIndex(
          displaySet => displaySet.displaySetInstanceUID === currentDisplaySet.displaySetInstanceUID
        );
        return [
          ...prevOptimisticOverlayDisplaySets.slice(0, currentDisplaySetIndex),
          selectedDisplaySet,
          ...prevOptimisticOverlayDisplaySets.slice(currentDisplaySetIndex + 1),
        ];
      });

      handleReplaceDisplaySetLayer(
        currentDisplaySet.displaySetInstanceUID,
        selectedDisplaySet.displaySetInstanceUID
      );
    }
  };

  /**
   * Handle foreground display set selection change
   */
  const handleForegroundSelectionChange = (
    currentDisplaySet: AppTypes.DisplaySet,
    newDisplaySetInstanceUID: string
  ) => {
    if (newDisplaySetInstanceUID === currentDisplaySet.displaySetInstanceUID) {
      return;
    }

    // Find the selected display set
    const selectedDisplaySet = potentialForegroundDisplaySets.find(
      ds => ds.displaySetInstanceUID === newDisplaySetInstanceUID
    );

    if (selectedDisplaySet) {
      handleReplaceDisplaySetLayer(
        currentDisplaySet.displaySetInstanceUID,
        selectedDisplaySet.displaySetInstanceUID
      );
    }
  };

  /**
   * Handle pending segmentation selection
   */
  const handlePendingSegmentationSelection = (pendingId: string, displaySetInstanceUID: string) => {
    const selectedDisplaySet = potentialOverlayDisplaySets.find(
      ds => ds.displaySetInstanceUID === displaySetInstanceUID
    );

    if (selectedDisplaySet) {
      setOptimisticOverlayDisplaySets(prevOptimisticOverlayDisplaySets => [
        ...prevOptimisticOverlayDisplaySets,
        selectedDisplaySet,
      ]);
      handleAddDisplaySetAsLayer(selectedDisplaySet.displaySetInstanceUID);
      // Remove this pending segmentation from the list
      setPendingSegmentations(pendingSegmentations.filter(id => id !== pendingId));
    }
  };

  /**
   * Handle pending foreground selection
   */
  const handlePendingForegroundSelection = (pendingId: string, displaySetInstanceUID: string) => {
    const selectedDisplaySet = potentialForegroundDisplaySets.find(
      ds => ds.displaySetInstanceUID === displaySetInstanceUID
    );

    if (selectedDisplaySet) {
      handleAddDisplaySetAsLayer(selectedDisplaySet.displaySetInstanceUID);
      // Remove this pending foreground from the list
      setPendingForegrounds(pendingForegrounds.filter(id => id !== pendingId));
    }
  };

  // Check if the advanced window level components exist in toolbar
  const hasAdvancedRenderingControls = !!toolbarService.getButton('AdvancedRenderingControls');
  const hasOpacityMenu = !!toolbarService.getButton('opacityMenu');

  const handleThresholdOpacityToggle = () => {
    const newValue = !thresholdOpacityEnabled;
    if (hasAdvancedRenderingControls) {
      toggleColorbar();
    }
    setThresholdOpacityEnabled(newValue);
  };

  return (
    <div
      className="bg-popover flex h-full w-[275px] flex-col rounded rounded-md p-1.5"
      data-cy={`viewport-data-overlay-menu-${viewportId}`}
    >
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
          onClick={() => {
            setPendingSegmentations([...pendingSegmentations, `seg-${Date.now()}`]);
          }}
          dataCY={`AddSegmentationDataOverlay-${viewportId}`}
        >
          <Icons.Plus className="h-4 w-4" />
          Segmentation
        </Button>
      </div>

      <div className="">
        {/* Overlays Segmentation section */}
        <div className="my-2 ml-1">
          {optimisticOverlayDisplaySets.map(displaySet => (
            <div
              key={displaySet.displaySetInstanceUID}
              className="mb-1 flex items-center"
            >
              <Icons.LayerSegmentation className="text-muted-foreground mr-1 h-6 w-6 flex-shrink-0" />
              <Select
                value={displaySet.displaySetInstanceUID}
                onValueChange={value => handleOverlaySelectionChange(displaySet, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue
                    data-cy={`overlay-ds-select-value-${displaySet.label?.toUpperCase()}`}
                  >
                    {displaySet.label?.toUpperCase()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* Include both potential overlays and the current overlay */}
                  <SelectItem
                    key={displaySet.displaySetInstanceUID}
                    value={displaySet.displaySetInstanceUID}
                    className="pr-2"
                  >
                    <SelectItemWithModality displaySet={displaySet} />
                  </SelectItem>
                  {potentialOverlayDisplaySets.map(item => (
                    <SelectItem
                      key={item.displaySetInstanceUID}
                      value={item.displaySetInstanceUID}
                      className="pr-2"
                    >
                      <SelectItemWithModality displaySet={item} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 flex-shrink-0"
                    dataCY={`overlay-ds-more-button-${displaySet.label?.toUpperCase()}`}
                  >
                    <Icons.More className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    data-cy={`overlay-ds-remove-button-${displaySet.label?.toUpperCase()}`}
                    onClick={() => handleRemoveDisplaySetLayer(displaySet.displaySetInstanceUID)}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {pendingSegmentations.map(pendingId => (
            <div
              key={pendingId}
              className="mb-2 flex items-center"
            >
              <Icons.LayerSegmentation className="text-muted-foreground mr-1 h-6 w-6 flex-shrink-0" />
              <Select
                value=""
                onValueChange={value => handlePendingSegmentationSelection(pendingId, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="SELECT A SEGMENTATION" />
                </SelectTrigger>
                <SelectContent>
                  {potentialOverlayDisplaySets.map(item => (
                    <SelectItem
                      key={item.displaySetInstanceUID}
                      value={item.displaySetInstanceUID}
                      className="pr-2"
                    >
                      <SelectItemWithModality
                        displaySet={item}
                        dataCY={`${item.label}`}
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 flex-shrink-0"
                  >
                    <Icons.More className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => {
                      // Remove this pending segmentation
                      setPendingSegmentations(pendingSegmentations.filter(id => id !== pendingId));
                    }}
                  >
                    Cancel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        {/* Foregrounds section */}
        <div className="my-2 px-1">
          {foregroundDisplaySets.map((displaySet, index) => (
            <div
              key={displaySet.displaySetInstanceUID}
              className="mb-1 flex items-center"
            >
              <Icons.LayerForeground className="text-muted-foreground mr-1 h-6 w-6 flex-shrink-0" />
              <Select
                value={displaySet.displaySetInstanceUID}
                onValueChange={value => handleForegroundSelectionChange(displaySet, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue>{displaySet.label?.toUpperCase()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* Include both potential foregrounds and the current foreground */}
                  <SelectItem
                    key={displaySet.displaySetInstanceUID}
                    value={displaySet.displaySetInstanceUID}
                    className="pr-2"
                  >
                    <SelectItemWithModality displaySet={displaySet} />
                  </SelectItem>
                  {potentialForegroundDisplaySets.map(item => (
                    <SelectItem
                      key={item.displaySetInstanceUID}
                      value={item.displaySetInstanceUID}
                      className="pr-2"
                    >
                      <SelectItemWithModality displaySet={item} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 flex-shrink-0"
                  >
                    <Icons.More className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => handleRemoveDisplaySetLayer(displaySet.displaySetInstanceUID)}
                  >
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
              <Icons.LayerForeground className="text-muted-foreground mr-1 h-6 w-6 flex-shrink-0" />
              <Select
                value=""
                onValueChange={value => handlePendingForegroundSelection(pendingId, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="SELECT A FOREGROUND" />
                </SelectTrigger>
                <SelectContent>
                  {potentialForegroundDisplaySets.map(item => (
                    <SelectItem
                      key={item.displaySetInstanceUID}
                      value={item.displaySetInstanceUID}
                      className="pr-2"
                    >
                      <SelectItemWithModality displaySet={item} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 flex-shrink-0"
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
          <Icons.LayerBackground className="text-muted-foreground mr-1 h-6 w-6 flex-shrink-0" />
          <Select
            value={backgroundDisplaySet?.displaySetInstanceUID}
            onValueChange={value => {
              const selectedDisplaySet = potentialBackgroundDisplaySets.find(
                ds => ds.displaySetInstanceUID === value
              );
              if (selectedDisplaySet) {
                handleBackgroundSelection(selectedDisplaySet);
              }
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue>
                {(
                  backgroundDisplaySet?.SeriesDescription ||
                  backgroundDisplaySet?.label ||
                  'background'
                ).toUpperCase()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {potentialBackgroundDisplaySets.map(displaySet => (
                <SelectItem
                  key={displaySet.displaySetInstanceUID}
                  value={displaySet.displaySetInstanceUID}
                  className="pr-2"
                >
                  <SelectItemWithModality displaySet={displaySet} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {foregroundDisplaySets.length > 0 && (hasAdvancedRenderingControls || hasOpacityMenu) && (
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
