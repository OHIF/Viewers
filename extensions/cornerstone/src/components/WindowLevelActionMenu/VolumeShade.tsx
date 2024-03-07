import React, { ReactElement } from 'react';
import { SwitchButton } from '@ohif/ui';

export function VolumeShade(): ReactElement {
  return (
    <SwitchButton
      label="Shade"
      checked={true}
      onChange={() => {
        return;
      }}
    />
  );
}
