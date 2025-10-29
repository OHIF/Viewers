import React from 'react';
import { Button, Separator } from '@ohif/ui-next';
import { useRunCommand } from '@ohif/core';

function SmoothContoursOptions() {
  const runCommand = useRunCommand();

  return (
    <div className="flex w-auto w-[245px] flex-col gap-[8px] text-base font-normal leading-none">
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>Smooth all edges</div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('smoothContours');
          }}
        >
          Smooth Edges
        </Button>
        <Separator className="bg-input mt-[20px] h-[1px]" />
      </div>
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>Remove extra points</div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('decimateContours');
          }}
        >
          Remove Points
        </Button>
      </div>
    </div>
  );
}

export default SmoothContoursOptions;
