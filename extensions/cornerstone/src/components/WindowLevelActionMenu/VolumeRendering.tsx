import { ServicesManager } from '@ohif/core';
import { AllInOneMenu, Button } from '@ohif/ui';
import React, { ReactElement } from 'react';
import { CONSTANTS } from '@cornerstonejs/core';
import { Icon } from '@ohif/ui';
import { ButtonEnums } from '@ohif/ui';

const { VIEWPORT_PRESETS } = CONSTANTS;

export type VolumeRenderingProps = {
  viewportId: string;
  serviceManager: ServicesManager;
};

function CPUModal() {
  return (
    <div className="flex min-h-full w-full flex-col justify-between">
      <p>
        Your computer does not have enough GPU power to support the default GPU rendering mode. OHIF
        has switched to CPU rendering mode. Please note that CPU rendering does not support all
        features such as Volume Rendering, Multiplanar Reconstruction, and Segmentation Overlays.
      </p>
      <footer className="flex h-[60px] w-full items-center justify-end">
        <div className="flex gap-2">
          <Button
            name="Cancel"
            size={ButtonEnums.size.medium}
            type={ButtonEnums.type.secondary}
          >
            {' '}
            Cancel{' '}
          </Button>
          <Button
            name="Apply"
            size={ButtonEnums.size.medium}
            type={ButtonEnums.type.primary}
          >
            {' '}
            Apply{' '}
          </Button>
        </div>
      </footer>
    </div>
  );
}

export function VolumeRendering({
  viewportId,
  serviceManager,
}: VolumeRenderingProps): ReactElement {
  const { uiModalService } = serviceManager.services;
  const onClick = () => {
    uiModalService.show({
      content: CPUModal,
      title: 'Volume Rendering',
      movable: true,
      contentProps: {
        onClose: uiModalService.hide,
      },
      customContainerDimensions: 'h-[543px] w-[460px]',
      customContentDimensions: 'h-[493px] w-[460px]  pl-[12px]',
    });
  };

  return (
    <>
      <AllInOneMenu.Item
        label="Volume Rendering"
        onClick={onClick}
        icon={<Icon name="VolumeRendering" />}
      />
    </>
  );
}
