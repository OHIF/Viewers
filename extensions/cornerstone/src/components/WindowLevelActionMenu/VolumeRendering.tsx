import { AllInOneMenu } from '@ohif/ui';
import React, { ReactElement } from 'react';
import { VolumeRenderingProps } from '../../types/ViewportPresets';
import { VolumePresets } from './VolumePresets';
import { CinematicRendering } from './CinematicRendering';

export function VolumeRendering({
  viewportId,
  serviceManager,
  commandsManager,
  viewportPresets,
}: VolumeRenderingProps): ReactElement {
  const { uiModalService } = serviceManager.services;

  const onClickPresets = () => {
    uiModalService.show({
      content: VolumePresets,
      title: 'Volume Rendering',
      movable: true,
      contentProps: {
        onClose: uiModalService.hide,
        presets: viewportPresets,
        viewportId,
        commandsManager,
      },
      customContainerDimensions: 'h-[543px] w-[460px]',
      customContentDimensions: 'h-[493px] w-[460px]  pl-[12px]',
    });
  };

  const onClickCinematic = () => {
    uiModalService.show({
      content: CinematicRendering,
      title: 'Cinematic Rendering',
      movable: true,
      contentProps: {
        onClose: uiModalService.hide,
        viewportId,
        serviceManager,
      },
      customContainerDimensions: 'h-[180px] w-[460px]',
      customContentDimensions: 'h-[130px] w-[460px]  pl-[12px]',
    });
  };

  return (
    <>
      <AllInOneMenu.Item
        label="Rendering Presets"
        onClick={onClickPresets}
      />
      <AllInOneMenu.Item
        label="Cinematic Rendering"
        onClick={onClickCinematic}
      />
    </>
  );
}
