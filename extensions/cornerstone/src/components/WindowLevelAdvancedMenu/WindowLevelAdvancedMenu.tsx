import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Switch,
  Numeric,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@ohif/ui-next';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import { useViewportRendering } from '../../hooks/useViewportRendering';
import { useSystem } from '@ohif/core';
import { utilities, cache } from '@cornerstonejs/core';
interface WindowLevelAdvancedMenuProps {
  viewportId: string;
  className?: string;
}

const TABS = {
  MINMAX: 'minmax',
  MANUAL: 'manual',
};

function WindowLevelAdvancedMenu({ viewportId, className }: WindowLevelAdvancedMenuProps) {
  const { servicesManager } = useSystem();
  const { displaySetService } = servicesManager.services;
  const [activeTab, setActiveTab] = useState(TABS.MINMAX);
  const { viewportDisplaySets } = useViewportDisplaySets(viewportId);
  const [selectedDisplaySetUID, setSelectedDisplaySetUID] = useState<string | undefined>(
    viewportDisplaySets.length > 0 ? viewportDisplaySets[0].displaySetInstanceUID : undefined
  );

  // Get viewport rendering helper hook
  const { voiRange, setVOIRange } = useViewportRendering(viewportId, {
    displaySetInstanceUID: selectedDisplaySetUID,
  });

  useEffect(() => {
    if (viewportDisplaySets.length > 0 && !selectedDisplaySetUID) {
      setSelectedDisplaySetUID(viewportDisplaySets[0].displaySetInstanceUID);
    }
  }, [viewportDisplaySets, selectedDisplaySetUID]);

  const { upper, lower } = voiRange;
  const { windowWidth, windowCenter } = utilities.windowLevel.toWindowLevel(lower, upper);

  const selectedViewportImageIds =
    displaySetService.getDisplaySetByUID(selectedDisplaySetUID)?.imageIds;

  let min = Infinity;
  let max = -Infinity;
  for (const imageId of selectedViewportImageIds) {
    const image = cache.getImage(imageId);
    if (image) {
      min = Math.min(min, image.minPixelValue);
      max = Math.max(max, image.maxPixelValue);
    }
  }

  const minMax = {
    min: min,
    max: max,
  };

  return (
    <div className={className}>
      <div className="bg-popover w-72 rounded-lg p-4 shadow-md">
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="mb-4 flex items-center space-x-2">
            {viewportDisplaySets.length > 1 && (
              <Select
                value={selectedDisplaySetUID}
                onValueChange={setSelectedDisplaySetUID}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Display Set" />
                </SelectTrigger>
                <SelectContent>
                  {viewportDisplaySets.map(ds => (
                    <SelectItem
                      key={ds.displaySetInstanceUID}
                      value={ds.displaySetInstanceUID}
                    >
                      {`${ds.SeriesDescription || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <TabsList className="w-full flex-1">
              <TabsTrigger
                value={TABS.MINMAX}
                className="flex-1"
              >
                Min/Max
              </TabsTrigger>
              <TabsTrigger
                value={TABS.MANUAL}
                className="flex-1"
              >
                Manual
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={TABS.MINMAX}>
            <Numeric.Container
              mode="doubleRange"
              min={minMax.min}
              max={minMax.max}
              values={[lower, upper]}
              step={1}
              className="space-y-1"
              onChange={(vals: [number, number]) => {
                const [newLower, newUpper] = vals;
                setVOIRange({ lower: newLower, upper: newUpper });
              }}
            >
              <Numeric.DoubleRange showNumberInputs />
            </Numeric.Container>
          </TabsContent>
          <TabsContent value={TABS.MANUAL}>
            <div className="space-y-4">
              <Numeric.Container
                mode="singleRange"
                min={minMax.min}
                max={minMax.max}
                step={1}
                value={windowWidth}
                className="space-y-1"
                onChange={(val: number) => {
                  const newWidth = val as number;
                  const { lower, upper } = utilities.windowLevel.toLowHighRange(
                    newWidth,
                    windowCenter
                  );
                  setVOIRange({ lower, upper });
                }}
              >
                <Numeric.Label>Window Width</Numeric.Label>
                <Numeric.SingleRange showNumberInput />
              </Numeric.Container>

              {/* Window Center Slider */}
              <Numeric.Container
                mode="singleRange"
                min={0}
                max={minMax.max - minMax.min}
                step={1}
                value={windowCenter}
                className="space-y-1"
                onChange={(val: number) => {
                  const newCenter = val as number;
                  const { lower, upper } = utilities.windowLevel.toLowHighRange(
                    windowWidth,
                    newCenter
                  );
                  setVOIRange({ lower, upper });
                }}
              >
                <Numeric.Label>Window Center</Numeric.Label>
                <Numeric.SingleRange showNumberInput />
              </Numeric.Container>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default WindowLevelAdvancedMenu;
