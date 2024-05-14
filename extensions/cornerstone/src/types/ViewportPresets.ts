import { CommandsManager } from '@ohif/core';

export type ViewportPreset = {
  name: string;
  gradientOpacity: string;
  specularPower: string;
  scalarOpacity: string;
  specular: string;
  shade: string;
  ambient: string;
  colorTransfer: string;
  diffuse: string;
  interpolation: string;
};

export type VolumeRenderingPresetsProps = {
  viewportId: string;
  servicesManager: AppTypes.ServicesManager;
  commandsManager: CommandsManager;
  volumeRenderingPresets: ViewportPreset[];
};

export type VolumeRenderingPresetsContentProps = {
  presets: ViewportPreset[];
  onClose: () => void;
  viewportId: string;
  commandsManager: CommandsManager;
};

export type VolumeRenderingOptionsProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  servicesManager: AppTypes.ServicesManager;
  volumeRenderingQualityRange: VolumeRenderingQualityRange;
};

export type VolumeRenderingQualityRange = {
  min: number;
  max: number;
  step: number;
};

export type VolumeRenderingQualityProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  servicesManager: AppTypes.ServicesManager;
  volumeRenderingQualityRange: VolumeRenderingQualityRange;
};

export type VolumeShiftProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  servicesManager: AppTypes.ServicesManager;
};

export type VolumeShadeProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  servicesManager: AppTypes.ServicesManager;
};

export type VolumeLightingProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  servicesManager: AppTypes.ServicesManager;
};
