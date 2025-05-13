import React, { useState, useEffect } from 'react';
import {
  Numeric,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@ohif/ui-next';
import { useViewportRendering } from '../../hooks';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

interface ThresholdMenuProps {
  viewportId: string;
  className?: string;
}

function ThresholdMenu({ viewportId, className }: ThresholdMenuProps) {
  const { viewportDisplaySets } = useViewportDisplaySets(viewportId);
  const [selectedDisplaySetUID, setSelectedDisplaySetUID] = useState<string | undefined>(
    viewportDisplaySets.length > 0 ? viewportDisplaySets[0].displaySetInstanceUID : undefined
  );

  const { threshold, setThreshold } = useViewportRendering(viewportId, {
    displaySetInstanceUID: selectedDisplaySetUID,
  });

  const thresholdValue = threshold;

  useEffect(() => {
    if (viewportDisplaySets.length > 0 && !selectedDisplaySetUID) {
      setSelectedDisplaySetUID(viewportDisplaySets[0].displaySetInstanceUID);
    }
  }, [viewportDisplaySets, selectedDisplaySetUID]);

  return (
    <div className={className}>
      <div className="bg-popover w-72 rounded-lg p-4 shadow-md">
        {viewportDisplaySets.length > 1 && (
          <div className="mx-auto mb-4 flex items-center justify-center space-x-2">
            <span className="text-muted-foreground text-base">Threshold</span>
            <div className="w-32">
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
            </div>
          </div>
        )}
        <div className="py-2">
          <Numeric.Container
            mode="singleRange"
            value={thresholdValue}
            onChange={(val: number | [number, number]) => {
              if (typeof val === 'number') {
                setThreshold(val);
              }
            }}
            min={0}
            max={1}
            step={0.01}
          >
            <Numeric.SingleRange showNumberInput={false} />
          </Numeric.Container>
        </div>
      </div>
    </div>
  );
}

export default ThresholdMenu;
