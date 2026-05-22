const VOLUME_OPTIONS_KEY = 'volumeOptions';

export type VolumeOptions = {
  rotateSampleDistanceFactor: number;
  sampleDistanceMultiplier: number;
  gpuTestResults: Record<string, unknown> | null;
};

const DEFAULTS: VolumeOptions = {
  rotateSampleDistanceFactor: 1,
  sampleDistanceMultiplier: 1,
  gpuTestResults: null,
};

export function getVolumeOptions(): VolumeOptions {
  try {
    const raw = localStorage.getItem(VOLUME_OPTIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<VolumeOptions>) : {};

    return {
      rotateSampleDistanceFactor:
        typeof parsed.rotateSampleDistanceFactor === 'number' &&
        parsed.rotateSampleDistanceFactor >= 1
          ? parsed.rotateSampleDistanceFactor
          : DEFAULTS.rotateSampleDistanceFactor,
      sampleDistanceMultiplier:
        typeof parsed.sampleDistanceMultiplier === 'number' &&
        parsed.sampleDistanceMultiplier >= 1
          ? parsed.sampleDistanceMultiplier
          : DEFAULTS.sampleDistanceMultiplier,
      gpuTestResults:
        parsed.gpuTestResults != null &&
        typeof parsed.gpuTestResults === 'object'
          ? (parsed.gpuTestResults as Record<string, unknown>)
          : DEFAULTS.gpuTestResults,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setVolumeOptions(partial: Partial<VolumeOptions>): void {
  const current = getVolumeOptions();
  const merged = { ...current, ...partial };
  localStorage.setItem(VOLUME_OPTIONS_KEY, JSON.stringify(merged));
}
