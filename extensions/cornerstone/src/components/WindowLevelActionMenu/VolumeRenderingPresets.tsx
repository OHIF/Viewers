import { AllInOneMenu } from '@ohif/ui-next';
import { Icons } from '@ohif/ui-next';
import React, { ReactElement } from 'react';
import { VolumeRenderingPresetsProps } from '../../types/ViewportPresets';
import { VolumeRenderingPresetsContent } from './VolumeRenderingPresetsContent';
import { useSystem } from '@ohif/core';

export function VolumeRenderingPresets({
  viewportId,
  volumeRenderingPresets,
}: VolumeRenderingPresetsProps): ReactElement {
  const { servicesManager } = useSystem();
  const { uiDialogService } = servicesManager.services;

  const onClickPresets = () => {
    uiDialogService.show({
      id: 'volume-rendering-presets',
      content: VolumeRenderingPresetsContent,
      title: 'Rendering Presets',
      isDraggable: true,
      contentProps: {
        presets: volumeRenderingPresets,
        viewportId,
      },
    });
  };

  return (
    <AllInOneMenu.Item
      label="Rendering Presets"
      icon={<Icons.VolumeRendering />}
      rightIcon={<Icons.ByName name="action-new-dialog" />}
      onClick={onClickPresets}
    />
  );
}
