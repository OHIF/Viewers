export interface VolumeRenderingConfig {
  volumeRenderingPresets?: Array<any>;
  volumeRenderingQualityRange?: {
    min: number;
    max: number;
    step: number;
  };
}
