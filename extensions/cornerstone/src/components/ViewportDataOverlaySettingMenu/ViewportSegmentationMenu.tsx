import React, { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Icons,
  ScrollArea,
  Label,
  Slider,
  Input,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  Separator,
} from '@ohif/ui-next';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

function ViewportSegmentationMenu({
  viewportId,
  displaySets,
  servicesManager,
  commandsManager,
  location,
}: withAppTypes<{ viewportId: string }>) {
  const { segmentationService } = servicesManager.services;
  const [representations, setRepresentations] = useState(
    segmentationService.getSegmentationRepresentations(viewportId)
  );
  const [selectedRepresentationId, setSelectedRepresentationId] = useState(null);
  const [displayMode, setDisplayMode] = useState('Fill & Outline');
  const [selectedRepresentationStyle, setSelectedRepresentationStyle] = useState(null);
  const [syncConfigurationGlobally, setSyncConfigurationGlobally] = useState(true);
  const [displayInactiveSegmentations, setDisplayInactiveSegmentations] = useState(true);
  const [activeSegmentationId, setActiveSegmentationId] = useState(null);

  const updateState = useCallback(() => {
    const representations = segmentationService.getSegmentationRepresentations(viewportId);
    setRepresentations(representations);

    let segmentationId;
    if (syncConfigurationGlobally) {
      segmentationId = 'all';
      setSelectedRepresentationId(null);
      // we need to clear the segmentation specific and viewport specific styles
      segmentationService.resetToGlobalStyle();
    } else if (!selectedRepresentationId && representations.length > 0) {
      // If no representation is selected and there are representations, select the first one
      segmentationId = representations[0].segmentationId;
      setSelectedRepresentationId(representations[0].id);
    } else {
      segmentationId =
        representations.find(rep => rep.id === selectedRepresentationId)?.segmentationId || 'all';
    }

    const style = segmentationService.getStyle({
      viewportId,
      segmentationId,
      type: SegmentationRepresentations.Labelmap,
    });

    setSelectedRepresentationStyle(style);

    // Determine the display mode based on renderFill and renderOutline
    let newDisplayMode;
    if (style.renderFill && style.renderOutline) {
      newDisplayMode = 'Fill & Outline';
    } else if (style.renderOutline) {
      newDisplayMode = 'Outline Only';
    } else if (style.renderFill) {
      newDisplayMode = 'Fill Only';
    } else {
      // Default to 'Fill & Outline' if both are false (shouldn't happen normally)
      newDisplayMode = 'Fill & Outline';
    }
    setDisplayMode(newDisplayMode);

    // Update the display inactive segments state
    const renderInactive = segmentationService.getRenderInactiveSegmentations(viewportId);
    setDisplayInactiveSegmentations(renderInactive);

    // Get the active segmentation
    const activeSegmentationId = segmentationService.getActiveSegmentation(viewportId);
    setActiveSegmentationId(activeSegmentationId || null);
  }, [segmentationService, viewportId, syncConfigurationGlobally, selectedRepresentationId]);

  useEffect(() => {
    updateState();

    const eventSubscriptions = [
      segmentationService.EVENTS.SEGMENTATION_MODIFIED,
      segmentationService.EVENTS.SEGMENTATION_REMOVED,
      segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
    ];

    const allUnsubscribeFunctions = eventSubscriptions.map(evt => {
      const { unsubscribe } = segmentationService.subscribe(evt, updateState);
      return unsubscribe;
    });

    // Add a new event subscription for changes to inactive segment rendering
    const { unsubscribe: unsubscribeInactiveSegments } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
      () => {
        const renderInactive = segmentationService.getRenderInactiveSegmentations(viewportId);
        setDisplayInactiveSegmentations(renderInactive);
      }
    );

    // Add a new event subscription for changes to the active segmentation

    return () => {
      allUnsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      unsubscribeInactiveSegments();
    };
  }, [segmentationService, viewportId, syncConfigurationGlobally, updateState]);

  const onSelectItem = representationId => {
    if (syncConfigurationGlobally) {
      setSyncConfigurationGlobally(false);
    }
    setSelectedRepresentationId(representationId);
  };

  const onToggleVisibility = representationId => {
    const representation = representations.find(rep => rep.id === representationId);
    segmentationService.toggleSegmentationVisibility(viewportId, representation.segmentationId);
  };

  const handlePropertyChange = (propertyKey, newValue) => {
    const representation = representations.find(rep => rep.id === selectedRepresentationId);
    const segmentationId = representation ? representation.segmentationId : null;

    // segmentation specific styles
    segmentationService.setStyle(
      {
        segmentationId,
        type: SegmentationRepresentations.Labelmap,
      },
      { [propertyKey]: newValue }
    );
  };

  const handleDisplayModeChange = newDisplayMode => {
    setDisplayMode(newDisplayMode);

    const representation = representations.find(rep => rep.id === selectedRepresentationId);
    const segmentationId = representation ? representation.segmentationId : null;

    let newStyle = {};
    switch (newDisplayMode) {
      case 'Fill & Outline':
        newStyle = { renderFill: true, renderOutline: true };
        break;
      case 'Outline Only':
        newStyle = { renderFill: false, renderOutline: true };
        break;
      case 'Fill Only':
        newStyle = { renderFill: true, renderOutline: false };
        break;
    }

    // segmentation specific styles
    segmentationService.setStyle(
      {
        segmentationId,
        type: SegmentationRepresentations.Labelmap,
      },
      { ...newStyle }
    );
  };

  return (
    <div className="bg-muted flex h-full w-[262px] flex-col rounded">
      <div className="py-2 px-1">
        <div className="flex items-center space-x-2 px-1">
          <Switch
            checked={syncConfigurationGlobally}
            onCheckedChange={checked => {
              setSyncConfigurationGlobally(checked);
              if (checked) {
                setSelectedRepresentationId(null);
              } else if (representations.length > 0) {
                setSelectedRepresentationId(representations[0].id);
              }
            }}
          />
          <div className="text-muted-foreground text-sm">Sync Configuration Globally</div>
        </div>
        <div className="my-2 px-1">
          <Separator className="bg-primary/30" />
        </div>
        <ScrollArea className="max-h-[132px] rounded-t border-gray-300">
          <ul
            aria-label="Item List"
            className="space-y-1"
          >
            {representations.map(representation => (
              <li key={representation.id}>
                <div className="flex items-center">
                  <button
                    onClick={() => onSelectItem(representation.id)}
                    className={`text-foreground flex h-7 w-full flex-grow cursor-pointer items-center rounded p-1 text-sm ${
                      representation.id === selectedRepresentationId
                        ? 'bg-primary/20'
                        : 'bg-muted hover:bg-primary/30'
                    } focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1`}
                    aria-pressed={representation.id === selectedRepresentationId}
                  >
                    <Icons.StatusChecked className="mr-2 flex-shrink-0" />
                    <span className="flex-grow text-left">{representation.label}</span>

                    {/* {representation.segmentationId === activeSegmentationId && (
                      <span className="bg-primary text-primary-foreground mr-2 rounded-full px-2 py-0.5 text-xs font-semibold">
                        Active
                      </span>
                    )} */}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation(); // Prevent parent onClick
                        onToggleVisibility(representation.id);
                      }}
                      aria-label={
                        representation.visible
                          ? `Hide ${representation.label}`
                          : `Show ${representation.label}`
                      }
                      className="ml-2 flex-shrink-0"
                    >
                      {representation.visible ? (
                        <Icons.EyeVisible className="h-4 w-4" />
                      ) : (
                        <Icons.EyeHidden className="h-4 w-4" />
                      )}
                    </Button>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>

      <ScrollArea className="bg-popover max-h-[400px] flex-grow overflow-auto rounded p-1">
        <div className="p-1.5 text-sm">
          <div className="items-top mb-2.5 flex justify-between">
            <div>
              <div className="text-foreground text-sm font-semibold">Display</div>
              <span className="text-muted-foreground">{displayMode}</span>
            </div>

            <div className="flex h-full items-center justify-center">
              <ToggleGroup
                type="single"
                value={displayMode}
                onValueChange={value => value && handleDisplayModeChange(value)}
                className="ml-auto"
              >
                <ToggleGroupItem
                  value="Fill & Outline"
                  aria-label="Fill & Outline"
                >
                  <Icons.FillAndOutline />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="Fill Only"
                  aria-label="Fill Only"
                >
                  <Icons.FillOnly />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="Outline Only"
                  aria-label="Outline Only"
                >
                  <Icons.OutlineOnly />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="mb-3 space-y-3">
            {/* Opacity Slider */}
            <div className="flex items-center justify-between space-x-4">
              <Label
                htmlFor="opacity"
                className="flex-grow whitespace-nowrap"
              >
                Opacity
              </Label>
              <div className="flex items-center space-x-3">
                <Slider
                  id="opacity"
                  value={[selectedRepresentationStyle?.fillAlpha]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={values => handlePropertyChange('fillAlpha', values[0])}
                  className="w-28"
                />
                <Input
                  type="number"
                  id="opacity-input"
                  value={selectedRepresentationStyle?.fillAlpha}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={e => handlePropertyChange('fillAlpha', Number(e.target.value))}
                  className="w-14"
                />
              </div>
            </div>

            {/* Outline Width Slider */}
            <div className="flex items-center justify-between space-x-4">
              <Label
                htmlFor="outlineWidth"
                className="flex-grow whitespace-nowrap"
              >
                Outline
              </Label>
              <div className="flex items-center space-x-3">
                <Slider
                  id="outlineWidth"
                  value={[selectedRepresentationStyle?.outlineWidth]}
                  min={0}
                  max={5}
                  step={0.1}
                  onValueChange={values => handlePropertyChange('outlineWidth', values[0])}
                  className="w-28"
                />
                <Input
                  type="number"
                  id="outlineWidth-input"
                  value={selectedRepresentationStyle?.outlineWidth}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={e => handlePropertyChange('outlineWidth', Number(e.target.value))}
                  className="w-14"
                />
              </div>
            </div>

            {/* Display Inactive Segmentations Switch */}
            {
              <div className="flex items-center justify-between space-x-4">
                <Label
                  htmlFor="displayInactiveSegmentations"
                  className="flex-grow whitespace-nowrap"
                >
                  Display inactive segments
                </Label>
                <Switch
                  id="displayInactiveSegmentations"
                  checked={displayInactiveSegmentations}
                  onCheckedChange={checked => {
                    segmentationService.setRenderInactiveSegmentations(viewportId, checked);
                    setDisplayInactiveSegmentations(checked);
                  }}
                />
              </div>
            }
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default ViewportSegmentationMenu;
