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
  viewportQualityPresets,
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
      containerDimensions: 'h-[543px] w-[460px]',
      contentDimensions: 'h-[493px] w-[460px]  pl-[12px]',
    });
  };

  return (
    <>
      <AllInOneMenu.Item
        label="Rendering Presets"
        onClick={onClickPresets}
      />
      <AllInOneMenu.SubMenu itemLabel="Cinematic Rendering">
        <CinematicRendering
          viewportId={viewportId}
          commandsManager={commandsManager}
          viewportQualityPresets={viewportQualityPresets}
        />
      </AllInOneMenu.SubMenu>
    </>
  );
}
