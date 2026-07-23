import React, { useState, useEffect } from 'react';
import {
  Numeric,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from '@ohif/ui-next';
import { useViewportRendering } from '../../hooks';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import SelectItemWithModality from '../SelectItemWithModality';

interface ThresholdMenuProps {
  viewportId: string;
  className?: string;
}

function ThresholdMenu({ viewportId, className }: ThresholdMenuProps) {
  const { viewportDisplaySets, foregroundDisplaySets } = useViewportDisplaySets(viewportId);
  const [selectedDisplaySetUID, setSelectedDisplaySetUID] = useState<string | undefined>(
    foregroundDisplaySets.length > 0 ? foregroundDisplaySets[0].displaySetInstanceUID : undefined
  );

  const { threshold, setThreshold, pixelValueRange } = useViewportRendering(viewportId, {
    displaySetInstanceUID: selectedDisplaySetUID,
  });

  const { min, max } = pixelValueRange;
  const thresholdValue = threshold ?? min;

  useEffect(() => {
    if (foregroundDisplaySets.length > 0 && !selectedDisplaySetUID) {
      setSelectedDisplaySetUID(foregroundDisplaySets[0].displaySetInstanceUID);
    }
  }, [foregroundDisplaySets, selectedDisplaySetUID]);

  const selectedDisplaySet = viewportDisplaySets.find(
    ds => ds.displaySetInstanceUID === selectedDisplaySetUID
  );

  return (
    <div className={className}>
      <div className="bg-popover w-72 rounded-lg p-4 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground text-base">Threshold</span>
            {viewportDisplaySets.length > 1 && (
              <div className="w-32">
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
                        <SelectItemWithModality displaySet={ds} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setThreshold(min)}
            className="text-sm"
          >
            Reset
          </Button>
        </div>
        <Numeric.Container
          mode="singleRange"
          value={thresholdValue}
          onChange={(val: number | [number, number]) => {
            if (typeof val === 'number') {
              setThreshold(val);
            }
          }}
          min={min}
          max={max}
          step={0.01}
        >
          <Numeric.SingleRange />
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground text-sm">{min.toFixed(0)}</span>
            <span className="text-muted-foreground text-sm">{max.toFixed(0)}</span>
          </div>
        </Numeric.Container>
      </div>
    </div>
  );
}

export default ThresholdMenu;
