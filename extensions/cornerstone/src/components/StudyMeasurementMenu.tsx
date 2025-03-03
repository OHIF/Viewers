import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

export default function StudyMeasurementMenu({
  items,
  StudyInstanceUID,
  measurementFilter,
  onUntrackClick,
}) {
  const { commandsManager } = useSystem();
  const disabled = !items?.length;

  if (disabled) {
    return null;
  }

  return (
    <div className="bg-background flex h-9 w-full items-center rounded pr-0.5">
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant="ghost"
          className="pl-0.5"
          onClick={() => {
            commandsManager.run('promptSaveReport', {
              StudyInstanceUID,
              measurementFilter,
            });
          }}
        >
          <Icons.Add />
          Create SR
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="pl-0.5"
          onClick={() => {
            commandsManager.runCommand('clearMeasurements', {
              measurementFilter,
            });
          }}
        >
          <Icons.Delete />
          Delete
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="pl-0.5"
          onClick={onUntrackClick}
        >
          <Icons.Delete />
          Untrack
        </Button>
      </div>
    </div>
  );
}
