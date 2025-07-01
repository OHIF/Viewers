import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

import { useMeasurements } from '../hooks/useMeasurements';
import XNATStudyMeasurements from '../Components/XNATStudyMeasurements';

export default function XNATPanelMeasurement(props): React.ReactNode {
  const { measurementFilter, emptyComponent: EmptyComponent, children } = props;
  const { commandsManager } = useSystem();

  const displayMeasurements = useMeasurements({ measurementFilter });

  return (
    <>
      <div className="bg-background flex h-9 w-full items-center rounded pr-0.5 justify-center">
        <Button
          size="sm"
          variant="ghost"
          className="pl-0.5"
          onClick={() => commandsManager.runCommand('XNATImportMeasurements')}
        >
          <Icons.Download />
          Import Measurements from XNAT
        </Button>
      </div>

      {!displayMeasurements.length ? (
        EmptyComponent ? (
          <EmptyComponent items={displayMeasurements} />
        ) : (
          <span className="text-white">No Measurements</span>
        )
      ) : children ? (
        React.Children.map(children, child =>
          React.cloneElement(child, {
            items: displayMeasurements,
            filter: measurementFilter,
          })
        )
      ) : (
        <XNATStudyMeasurements items={displayMeasurements} />
      )}
    </>
  );
} 