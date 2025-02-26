import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSegmentations } from '@ohif/extension-cornerstone';

function DynamicExport({ commandsManager, servicesManager }: withAppTypes) {
  const segmentations = useSegmentations({ servicesManager });

  if (!segmentations?.length) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <div className="flex h-8 w-full items-center rounded pr-0.5">
        <Button
          size="sm"
          variant="ghost"
          className="pl-1.5"
          onClick={() => {
            commandsManager.runCommand('exportTimeReportCSV', {
              segmentations,
              options: {
                filename: 'TimeData.csv',
              },
            });
          }}
        >
          <Icons.Export />
          <span className="pl-1">Time Data</span>
        </Button>
      </div>
      <div className="flex h-8 w-full items-center rounded pr-0.5">
        <Button
          size="sm"
          variant="ghost"
          className="pl-1.5"
          onClick={() => {
            commandsManager.runCommand('exportTimeReportCSV', {
              segmentations,
              summaryStats: true,
              options: {
                filename: 'ROIStats.csv',
              },
            });
          }}
        >
          <Icons.Export />
          <span className="pl-1">ROI Stats</span>
        </Button>
      </div>
    </div>
  );
}

export default DynamicExport;
