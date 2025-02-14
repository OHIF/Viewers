import { AllInOneMenu } from '@ohif/ui';
import { Icons } from '@ohif/ui-next';
import React, { ReactElement } from 'react';
import { VolumeRenderingPresetsProps } from '../../types/ViewportPresets';
import { VolumeRenderingPresetsContent } from './VolumeRenderingPresetsContent';

export function VolumeRenderingPresets({
  viewportId,
  servicesManager,
  commandsManager,
  volumeRenderingPresets,
}: VolumeRenderingPresetsProps): ReactElement {
  const { uiDialogService } = servicesManager.services;

  const onClickPresets = () => {
    uiDialogService.show({
      id: 'volume-rendering-presets',
      content: VolumeRenderingPresetsContent,
      title: 'Rendering Presets',
      movable: true,
      contentProps: {
        presets: volumeRenderingPresets,
        viewportId,
        commandsManager,
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
