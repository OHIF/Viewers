import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

export function StudyMeasurementsActions({ items, StudyInstanceUID, measurementFilter, actions }) {
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
          className="pl-1.5"
          onClick={() => {
            commandsManager.runCommand('downloadCSVMeasurementsReport', {
              StudyInstanceUID,
              measurementFilter,
            });
          }}
        >
          <Icons.Download className="h-5 w-5" />
          <span className="pl-1">CSV</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="pl-0.5"
          onClick={e => {
            e.stopPropagation();
            if (actions?.createSR) {
              actions.createSR({ StudyInstanceUID, measurementFilter });
              return;
            }
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
          onClick={e => {
            e.stopPropagation();
            if (actions?.onDelete) {
              actions.onDelete();
              return;
            }
            commandsManager.runCommand('clearMeasurements', {
              measurementFilter,
            });
          }}
        >
          <Icons.Delete />
          Delete
        </Button>
      </div>
    </div>
  );
}

export default StudyMeasurementsActions;
