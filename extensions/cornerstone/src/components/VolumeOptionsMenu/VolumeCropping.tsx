import React, { ReactElement, useEffect, useState } from 'react';
import { Switch, Tooltip, TooltipContent, TooltipTrigger } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

export function VolumeCropping({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { servicesManager, commandsManager } = useSystem();
  const { toolGroupService } = servicesManager.services;
  const [handlesVisible, setHandlesVisible] = useState(false);
  const [clippingPlanesVisible, setClippingPlanesVisible] = useState(false);
  const [rotatePlanes, setRotatePlanes] = useState(false);
  const [key, setKey] = useState(0);

  function getVolumeCroppingTool() {
    if (!viewportId) return null;
    const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
    if (!toolGroup) return null;
    const tool = toolGroup.getToolInstance('VolumeCropping');
    return tool ? { tool, toolGroup } : null;
  }

  useEffect(() => {
    const result = getVolumeCroppingTool();
    if (!result) {
      return;
    }

    const { tool, toolGroup } = result;
    if (!tool) {
      return;
    }

    const handles = tool.getHandlesVisible?.() ?? tool.handlesVisible ?? false;
    const planes = tool.getClippingPlanesVisible?.() ?? tool.clippingPlanesVisible ?? false;
    const rotate = tool.getRotatePlanesOnDrag?.() ?? tool.rotatePlanesOnDrag ?? false;
    setHandlesVisible(handles);
    setClippingPlanesVisible(planes);
    setRotatePlanes(rotate);
    setKey(prev => prev + 1);
  }, [viewportId, toolGroupService]);

  function onHandlesChange(checked: boolean) {
    const result = getVolumeCroppingTool();
    if (!result) {
      return;
    }
    const { tool } = result;
    if (!tool?.setHandlesVisible) {
      return;
    }

    if (tool.originalClippingPlanes?.length === 0) {
      tool.onSetToolActive?.();
    }

    tool.setHandlesVisible(checked);
    const actualHandles = tool.getHandlesVisible?.() ?? tool.handlesVisible ?? false;
    setHandlesVisible(actualHandles);
    setKey(prev => prev + 1);
  }

  function onClippingPlanesChange(checked: boolean) {
    commandsManager.runCommand('toggleCropping', { visible: checked }, 'CORNERSTONE');
    setClippingPlanesVisible(checked);
    const result = getVolumeCroppingTool();
    if (result?.tool) {
      const actualHandles =
        result.tool.getHandlesVisible?.() ?? result.tool.handlesVisible ?? false;
      setHandlesVisible(actualHandles);
    }
    setKey(prev => prev + 1);
  }

  function onRotatePlanesChange(checked: boolean) {
    const result = getVolumeCroppingTool();
    if (!result) {
      return;
    }
    const { tool } = result;
    if (!tool?.setRotatePlanesOnDrag) {
      return;
    }

    result.tool.setRotatePlanesOnDrag(checked);
    setRotatePlanes(checked);
  }

  return (
    <div className="my-1 mt-2 flex flex-col space-y-2">
      <div className="flex h-8 !h-[20px] w-full flex-shrink-0 items-center px-2 text-base">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground text-sm cursor-help">Volume Cropping</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="z-[9999]">
            <span className="block">
              Controls visibility of 3D clipping planes and handles.
            </span>
            <span className="block">Use SHIFT-click to rotate the planes.</span>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="bg-background mt-1 mb-1 h-px w-full" />
      <div className="w-full pl-2 pr-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center justify-between pr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm cursor-help">Enable Cropping</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="z-[9999]">
                Show or hide the volume clipping planes used for cropping.
              </TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground text-xs">Hotkey Y</span>
          </div>
          <Switch
            className="flex-shrink-0"
            key={`planes-${key}`}
            checked={clippingPlanesVisible}
            onCheckedChange={onClippingPlanesChange}
          />
        </div>
      </div>
      <div className="w-full pl-2 pr-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center justify-between pr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm cursor-help">Show Handles</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="z-[9999]">
                Show draggable corner and edge handles to adjust the cropping box.
              </TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground text-xs">Hotkey X</span>
          </div>
          <Switch
            className="flex-shrink-0"
            key={`handles-${key}`}
            checked={handlesVisible}
            onCheckedChange={onHandlesChange}
          />
        </div>
      </div>
      <div className="w-full pl-2 pr-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center justify-between pr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm cursor-help">Rotate Planes</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="z-[9999]">
                Allow rotating the clipping planes (without SHIFT).
              </TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground text-xs">Hotkey S</span>
          </div>
          <Switch
            className="flex-shrink-0"
            key={`rotate-${key}`}
            checked={rotatePlanes}
            onCheckedChange={onRotatePlanesChange}
          />
        </div>
      </div>
    </div>
  );
}
