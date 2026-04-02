const VOLUME_OPTIONS_KEY = 'volumeOptions';

export type VolumeOptions = {
  currentDecimationIJ: number;
  currentDecimationK: number;
  rotateSampleDistanceFactor: number;
  sampleDistanceMultiplier: number;
  gpuTestResults: Record<string, unknown> | null;
};

const DEFAULTS: VolumeOptions = {
  currentDecimationIJ: 1,
  currentDecimationK: 1,
  rotateSampleDistanceFactor: 1,
  sampleDistanceMultiplier: 1,
  gpuTestResults: null,
};

export function getVolumeOptions(): VolumeOptions {
  try {
    const raw = localStorage.getItem(VOLUME_OPTIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<VolumeOptions>) : {};

    return {
      currentDecimationIJ: DEFAULTS.currentDecimationIJ,
      currentDecimationK: DEFAULTS.currentDecimationK,
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
  const { currentDecimationIJ: _ij, currentDecimationK: _k, ...rest } = partial;
  const current = getVolumeOptions();
  const merged = { ...current, ...rest };
  const { currentDecimationIJ: _i, currentDecimationK: _d, ...toStore } =
    merged;
  localStorage.setItem(VOLUME_OPTIONS_KEY, JSON.stringify(toStore));
}
