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

export type VolumeRenderingProps = {
  viewportId: string;
  serviceManager: ServicesManager;
  commandsManager: CommandsManager;
  viewportPresets: ViewportPreset[];
};

export type VolumePresetsProps = {
  presets: ViewportPreset[];
  onClose: () => void;
  viewportId: string;
  commandsManager: CommandsManager;
};

export type CinematicRenderingProps = {
  viewportId: string;
  serviceManager: ServicesManager;
  onClose: () => void;
};
