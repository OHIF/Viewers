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
  volumeRenderingPresets: ViewportPreset[];
};

export type VolumeRenderingPresetsContentProps = {
  presets: ViewportPreset[];
  onClose: () => void;
  viewportId: string;
};

export type VolumeRenderingOptionsProps = {
  viewportId: string;
  volumeRenderingQualityRange: VolumeRenderingQualityRange;
};

export type VolumeRenderingQualityRange = {
  min: number;
  max: number;
  step: number;
};

export type VolumeRenderingQualityProps = {
  viewportId: string;
  volumeRenderingQualityRange: VolumeRenderingQualityRange;
};

export type VolumeShiftProps = {
  viewportId: string;
};

export type VolumeShadeProps = {
  viewportId: string;
  onClickShade?: (bool: boolean) => void;
};

export type VolumeLightingProps = {
  viewportId: string;
  hasShade: boolean;
};
