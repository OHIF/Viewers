import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
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
import { cache } from '@cornerstonejs/core';

interface VOIManualControlMenuProps {
  viewportId: string;
  className?: string;
}

const TABS = {
  MINMAX: 'minmax',
  MANUAL: 'manual',
};

function VOIManualControlMenu({ viewportId, className }: VOIManualControlMenuProps) {
  const { servicesManager } = useSystem();
  const { displaySetService } = servicesManager.services;
  const [activeTab, setActiveTab] = useState(TABS.MINMAX);
  const { viewportDisplaySets } = useViewportDisplaySets(viewportId);
  const [selectedDisplaySetUID, setSelectedDisplaySetUID] = useState<string | undefined>(
    viewportDisplaySets.length > 0 ? viewportDisplaySets[0].displaySetInstanceUID : undefined
  );

  const { voiRange, setVOIRange, windowLevel, setWindowLevel } = useViewportRendering(viewportId, {
    displaySetInstanceUID: selectedDisplaySetUID,
  });

  useEffect(() => {
    if (viewportDisplaySets.length > 0 && !selectedDisplaySetUID) {
      setSelectedDisplaySetUID(viewportDisplaySets[0].displaySetInstanceUID);
    }
  }, [viewportDisplaySets, selectedDisplaySetUID]);

  if (!voiRange) {
    return null;
  }

  const { upper, lower } = voiRange;
  const { windowWidth, windowCenter } = windowLevel;

  const selectedViewportImageIds =
    displaySetService.getDisplaySetByUID(selectedDisplaySetUID)?.imageIds;

  let min = Infinity;
  let max = -Infinity;

  if (selectedViewportImageIds) {
    for (const imageId of selectedViewportImageIds) {
      const image = cache.getImage(imageId);
      if (image) {
        min = Math.min(min, image.minPixelValue);
        max = Math.max(max, image.maxPixelValue);
      }
    }
  }

  // Provide reasonable defaults if min/max couldn't be determined
  if (min === Infinity || max === -Infinity) {
    min = 0;
    max = 255;
  }

  const selectedDisplaySet = viewportDisplaySets.find(
    ds => ds.displaySetInstanceUID === selectedDisplaySetUID
  );

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
                  <SelectValue>{selectedDisplaySet?.label || 'Select Display Set'}</SelectValue>
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
              min={min}
              max={max}
              values={[lower, upper]}
              step={1}
              className="space-y-1"
              onChange={(vals: [number, number]) => {
                const [newLower, newUpper] = vals;
                if (newLower !== lower || newUpper !== upper) {
                  setVOIRange({ lower: newLower, upper: newUpper });
                }
              }}
            >
              <Numeric.DoubleRange showNumberInputs />
            </Numeric.Container>
          </TabsContent>
          <TabsContent value={TABS.MANUAL}>
            <div className="space-y-1">
              <Numeric.Container
                mode="singleRange"
                min={0}
                max={max}
                step={1}
                value={windowWidth}
                className="space-y-1"
                onChange={(val: number) => {
                  if (val !== windowWidth) {
                    setWindowLevel({ windowWidth: val, windowCenter });
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <Numeric.Label>W:</Numeric.Label>
                  <Numeric.SingleRange showNumberInput />
                </div>
              </Numeric.Container>

              <Numeric.Container
                mode="singleRange"
                min={min}
                max={max}
                step={1}
                value={windowCenter}
                className="space-y-1"
                onChange={(val: number) => {
                  if (val !== windowCenter) {
                    setWindowLevel({ windowWidth, windowCenter: val });
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <Numeric.Label>L:</Numeric.Label>
                  <Numeric.SingleRange showNumberInput />
                </div>
              </Numeric.Container>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default VOIManualControlMenu;
