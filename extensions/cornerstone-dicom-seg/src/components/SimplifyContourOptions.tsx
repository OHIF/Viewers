import React, { useState } from 'react';
import { Button, Input, Label, Separator } from '@ohif/ui-next';
import { useRunCommand } from '@ohif/core';

function SimplifyContourOptions() {
  const [areaThreshold, setAreaThreshold] = useState(10);

  const runCommand = useRunCommand();

  return (
    <div className="flex w-auto w-[252px] flex-col gap-[8px] text-base font-normal leading-none">
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>Fill contour holes</div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('removeContourHoles');
          }}
        >
          Fill Holes
        </Button>
        <Separator className="bg-input mt-[20px] h-[1px]" />
      </div>
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>Remove Small Contours</div>
        <div className="flex items-center gap-2 self-end">
          <Label
            htmlFor="simplify-contour-options"
            className="text-muted-foreground"
          >
            Area Threshold
          </Label>
          <Input
            id="simplify-contour-options"
            className="w-20"
            type="number"
            value={areaThreshold}
            onChange={e => setAreaThreshold(Number(e.target.value))}
          />
        </div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('removeSmallContours', {
              areaThreshold,
            });
          }}
        >
          Remove Small Contours
        </Button>
        <Separator className="bg-input mt-[20px] h-[1px]" />
      </div>
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>Create New Segment from Holes</div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('convertContourHoles');
          }}
        >
          Create New Segment
        </Button>
      </div>
    </div>
  );
}

export default SimplifyContourOptions;
