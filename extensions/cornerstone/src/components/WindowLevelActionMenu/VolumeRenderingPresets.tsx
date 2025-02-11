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
  const { uiModalService } = servicesManager.services;

  const onClickPresets = () => {
    uiModalService.show({
      content: VolumeRenderingPresetsContent,
      title: 'Rendering Presets',
      movable: true,
      noOverlay: true,
      contentProps: {
        onClose: uiModalService.hide,
        presets: volumeRenderingPresets,
        viewportId,
        commandsManager,
      },
      containerClassName: 'h-[543px] w-[460px]',
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
