import React from 'react';
import {
  PanelSegmentation,
  useActiveViewportSegmentationRepresentations,
} from '@ohif/extension-cornerstone';
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
  const { segmentationsWithRepresentations: representations } =
    useActiveViewportSegmentationRepresentations({ servicesManager });

  const tmtv = representations[0]?.segmentation.cachedStats?.tmtv;

  const segmentations = representations.map(representation => representation.segmentation);

  if (!segmentations.length) {
    return null;
  }

  return (
    <div className="flex h-8 w-full items-center rounded pr-0.5">
      <Button
        size="sm"
        variant="ghost"
        className="pl-1.5"
        onClick={() => {
          commandsManager.runCommand('exportTMTVReportCSV', {
            segmentations,
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
