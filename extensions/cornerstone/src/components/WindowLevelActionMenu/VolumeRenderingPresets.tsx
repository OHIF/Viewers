import { AllInOneMenu, Icon } from '@ohif/ui';
import React, { ReactElement } from 'react';
import { VolumeRenderingPresetsProps } from '../../types/ViewportPresets';
import { VolumeRenderingPresetsContent } from './VolumeRenderingPresetsContent';

export function VolumeRenderingPresets({
  viewportId,
  serviceManager,
  commandsManager,
  volumeRenderingPresets,
}: VolumeRenderingPresetsProps): ReactElement {
  const { uiModalService } = serviceManager.services;

  const onClickPresets = () => {
    uiModalService.show({
      content: VolumeRenderingPresetsContent,
      title: 'Rendering Presets',
      movable: true,
      contentProps: {
        onClose: uiModalService.hide,
        presets: volumeRenderingPresets,
        viewportId,
        commandsManager,
      },
      containerDimensions: 'h-[543px] w-[460px]',
      contentDimensions: 'h-[493px] w-[460px]  pl-[12px]',
    });
  };

  return (
    <AllInOneMenu.Item
      label="Rendering Presets"
      icon={<Icon name="VolumeRendering" />}
      rightIcon={<Icon name="action-new-dialog" />}
      onClick={onClickPresets}
    />
  );
}
