import { ServicesManager, CommandsManager } from '@ohif/core';

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
  serviceManager: ServicesManager;
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
  serviceManager: ServicesManager;
  volumeQualityRange: VolumeQualityRange;
};

export type VolumeQualityRange = {
  min: number;
  max: number;
  step: number;
};

export type VolumeQualityProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  serviceManager: ServicesManager;
  volumeQualityRange: VolumeQualityRange;
};

export type VolumeMappingRangeProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  serviceManager: ServicesManager;
};

export type VolumeShadeProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  serviceManager: ServicesManager;
};

export type VolumeLightingProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  serviceManager: ServicesManager;
};
