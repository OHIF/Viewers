import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import PanelGenerateImage from './PanelGenerateImage';

function DynamicDataPanel({ servicesManager, commandsManager }: withAppTypes) {
  const { panelService } = servicesManager.services;

  const openECGViewer = () => {
    panelService.activatePanel(
      '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-ecg-viewer',
      true
    );
  };

  return (
    <div
      className="flex flex-col text-white"
      data-cy={'dynamic-volume-panel'}
    >
      <div className="bg-secondary-dark mb-2 rounded px-3 py-3">
        <div className="mb-3 text-xs uppercase tracking-wide text-white/60">Preclinical 4D</div>

        <Button
          variant="outline"
          className="flex w-full items-center justify-center gap-2"
          onClick={openECGViewer}
        >
          <Icons.ByName name="tab-linear" />
          ECG Viewer
        </Button>
      </div>

      <PanelGenerateImage
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      />
    </div>
  );
}

export default DynamicDataPanel;
