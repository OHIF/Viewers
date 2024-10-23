import React from 'react';
import { PanelSegmentation, useSegmentations } from '@ohif/extension-cornerstone';
import { Button, Icons } from '@ohif/ui-next';

export default function PanelTMTV({
  servicesManager,
  commandsManager,
  extensionManager,
  configuration,
}: withAppTypes) {
  return (
    <>
      <PanelSegmentation
        servicesManager={servicesManager}
        commandsManager={commandsManager}
        extensionManager={extensionManager}
        configuration={configuration}
      >
        <ExportCSV
          servicesManager={servicesManager}
          commandsManager={commandsManager}
        />
      </PanelSegmentation>
    </>
  );
}

const ExportCSV = ({ servicesManager, commandsManager }: withAppTypes) => {
  const segmentationsInfo = useSegmentations({ servicesManager });

  const tmtv = segmentationsInfo[0]?.segmentation.cachedStats?.tmtv;

  return (
    <div className="flex h-8 w-full items-center rounded pr-0.5">
      <Button
        size="sm"
        variant="ghost"
        className="pl-1.5"
        onClick={() => {
          commandsManager.runCommand('exportTMTVReportCSV', {
            segmentations: segmentationsInfo.map(({ segmentation }) => segmentation),
            tmtv,
            config: {},
          });
        }}
      >
        <Icons.Download />
        <span className="pl-1">CSV</span>
      </Button>
    </div>
  );
};
