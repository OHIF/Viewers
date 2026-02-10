import React, { ReactElement, useState, useEffect } from 'react';
import { VolumeDecimationInfo } from '../../types/ViewportPresets';
import { useSystem } from '@ohif/core';
import { cache as cs3DCache } from '@cornerstonejs/core';
import { toolNames } from '../../initCornerstoneTools';

const DEFAULT_IJK_DECIMATION: [number, number, number] = [1, 1, 1];
const DECIMATION_SEQUENCE = [1, 2, 4, 8, 16, 32];
const DEFAULT_SAMPLE_DISTANCE_MULTIPLIER = 1;
const DEFAULT_SAMPLE_DISTANCE_MULTIPLIER_ON_ROTATION = 1;

function getVolumeDecimationFromCache(
  volume: VolumeDecimationInfo
): [number, number, number] {
  if (volume.ijkDecimation && Array.isArray(volume.ijkDecimation)) {
    return volume.ijkDecimation;
  }
  if (
    volume.appliedDecimation?.originalDecimation &&
    Array.isArray(volume.appliedDecimation.originalDecimation)
  ) {
    return volume.appliedDecimation.originalDecimation;
  }
  return [...DEFAULT_IJK_DECIMATION];
}

function StepperRow({
  label,
  value,
  onDecrease,
  onIncrease,
  disabledDecrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabledDecrease?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onDecrease}
          className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
          disabled={disabledDecrease}
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-sm">{value}</span>
        <button
          type="button"
          onClick={onIncrease}
          className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/80"
        >
          +
        </button>
      </div>
    </div>
  );
}

export type VolumeRenderingPerformanceProps = {
  viewportId: string;
};

export function VolumeRenderingPerformance({
  viewportId,
}: VolumeRenderingPerformanceProps): ReactElement {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;
  const [volumeDimensions, setVolumeDimensions] = useState<number[] | null>(null);

  const [currentInPlaneDecimation, setCurrentInPlaneDecimation] = useState<number>(
    DEFAULT_IJK_DECIMATION[0]
  );
  const [currentKAxisDecimation, setCurrentKAxisDecimation] = useState<number>(
    DEFAULT_IJK_DECIMATION[2]
  );
  const [sampleDistanceMultiplierOverall, setSampleDistanceMultiplierOverall] = useState(
    DEFAULT_SAMPLE_DISTANCE_MULTIPLIER
  );
  const [sampleDistanceMultiplierOnRotation, setSampleDistanceMultiplierOnRotation] =
    useState(DEFAULT_SAMPLE_DISTANCE_MULTIPLIER_ON_ROTATION);
  const [gpuPerformanceScore, setGpuPerformanceScore] = useState<number | null>(null);

  useEffect(() => {
    try {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (!viewport) return;
      const actors = viewport.getActors();
      if (!actors?.length) return;

      const volumeActor = actors.find(
        (a: { actor?: { getClassName?: () => string }; referencedId?: string }) =>
          a?.actor?.getClassName?.() === 'vtkVolume'
      );
      if (!volumeActor?.referencedId) return;

      const volume = cs3DCache.getVolume(volumeActor.referencedId) as
        | VolumeDecimationInfo
        | undefined;
      if (!volume?.dimensions || volume.dimensions.length < 3) return;

      const dimensions = volume.dimensions;
      const currentIjk = getVolumeDecimationFromCache(volume);
      const meta = volume.originalMetadata;

      if (meta) {
        const originalDims: [number, number, number] = [
          meta.Columns ?? dimensions[0],
          meta.Rows ?? dimensions[1],
          Math.floor(dimensions[2] * currentIjk[2]),
        ];
        setVolumeDimensions(originalDims);
        setCurrentInPlaneDecimation(currentIjk[0]);
        setCurrentKAxisDecimation(currentIjk[2]);
      } else {
        const originalDims: [number, number, number] = [
          dimensions[0] * currentIjk[0],
          dimensions[1] * currentIjk[1],
          dimensions[2] * currentIjk[2],
        ];
        setVolumeDimensions(originalDims);
        setCurrentInPlaneDecimation(currentIjk[0]);
        setCurrentKAxisDecimation(currentIjk[2]);
      }
    } catch {
      setVolumeDimensions(null);
      setCurrentInPlaneDecimation(1);
      setCurrentKAxisDecimation(1);
    }
  }, [viewportId, cornerstoneViewportService]);

  const totalVoxels =
    volumeDimensions != null
      ? volumeDimensions[0] * volumeDimensions[1] * volumeDimensions[2]
      : null;
  const decimatedDimensions =
    volumeDimensions != null
      ? [
          Math.floor(volumeDimensions[0] / currentInPlaneDecimation),
          Math.floor(volumeDimensions[1] / currentInPlaneDecimation),
          Math.floor(volumeDimensions[2] / currentKAxisDecimation),
        ]
      : null;
  const decimatedVoxels =
    decimatedDimensions != null
      ? decimatedDimensions[0] * decimatedDimensions[1] * decimatedDimensions[2]
      : null;

  const handleInPlaneDecimationChange = (delta: number) => {
    const idx = DECIMATION_SEQUENCE.indexOf(currentInPlaneDecimation);
    const newIdx =
      delta > 0
        ? Math.min(idx + 1, DECIMATION_SEQUENCE.length - 1)
        : Math.max(idx - 1, 0);
    const newValue = DECIMATION_SEQUENCE[newIdx];
    if (newValue === currentInPlaneDecimation) return;
    setCurrentInPlaneDecimation(newValue);
    commandsManager.runCommand('reloadVolumeWithDecimation', {
      viewportId,
      ijkDecimation: [newValue, newValue, currentKAxisDecimation],
    });
  };

  const handleKAxisDecimationChange = (delta: number) => {
    const newValue = Math.max(1, currentKAxisDecimation + delta);
    if (newValue === currentKAxisDecimation) return;
    setCurrentKAxisDecimation(newValue);
    commandsManager.runCommand('reloadVolumeWithDecimation', {
      viewportId,
      ijkDecimation: [currentInPlaneDecimation, currentInPlaneDecimation, newValue],
    });
  };

  const handleSampleDistanceMultiplier = (delta: number) => {
    const newValue = Math.max(1, sampleDistanceMultiplierOverall + delta);
    if (newValue === sampleDistanceMultiplierOverall) return;
    setSampleDistanceMultiplierOverall(newValue);
    commandsManager.runCommand('setSampleDistanceMultiplier', {
      sampleDistanceMultiplier: newValue,
      viewportId,
    });
  };

  const handleSampleDistanceMultiplierOnRotationChange = (delta: number) => {
    const newValue = Math.max(1, sampleDistanceMultiplierOnRotation + delta);
    if (newValue === sampleDistanceMultiplierOnRotation) return;
    setSampleDistanceMultiplierOnRotation(newValue);
    const toolGroup = servicesManager.services.toolGroupService.getToolGroupForViewport(
      viewportId
    );
    if (toolGroup) {
      const trackballConfig =
        toolGroup.getToolConfiguration(toolNames.VolumeRotate) ?? {};
      toolGroup.setToolConfiguration(toolNames.VolumeRotate, {
        ...(typeof trackballConfig === 'object' ? trackballConfig : {}),
        rotateSampleDistanceFactor: newValue,
      });
      const cropConfig = toolGroup.getToolConfiguration('VolumeCropping') ?? {};
      toolGroup.setToolConfiguration('VolumeCropping', {
        ...(typeof cropConfig === 'object' ? cropConfig : {}),
        rotateSampleDistanceFactor: newValue,
      });
    }
  };

  if (
    volumeDimensions == null ||
    totalVoxels == null ||
    decimatedDimensions == null ||
    decimatedVoxels == null
  ) {
    return <div className="my-1 mt-2 flex flex-col space-y-3" />;
  }

  return (
    <div className="my-1 mt-2 flex flex-col space-y-3">
      <div className="w-full pl-2 pr-1">
        <div className="flex flex-col space-y-3">
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm font-medium text-foreground">VRT Downsampling</span>
            {gpuPerformanceScore != null && (
              <span className="font-mono text-xs text-muted-foreground">
                GPU Score: {gpuPerformanceScore.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <StepperRow
              label="Overall"
              value={sampleDistanceMultiplierOverall}
              onDecrease={() => handleSampleDistanceMultiplier(-1)}
              onIncrease={() => handleSampleDistanceMultiplier(1)}
              disabledDecrease={sampleDistanceMultiplierOverall <= 1}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <StepperRow
              label="During rotation (Overall x factor)"
              value={sampleDistanceMultiplierOnRotation}
              onDecrease={() => handleSampleDistanceMultiplierOnRotationChange(-1)}
              onIncrease={() => handleSampleDistanceMultiplierOnRotationChange(1)}
              disabledDecrease={sampleDistanceMultiplierOnRotation <= 1}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col space-y-3">
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm font-medium text-foreground">Volume Downsizing</span>
            <span className="font-mono text-xs text-muted-foreground">
              Voxels: {(totalVoxels / 1e6).toFixed(1)}M → {(decimatedVoxels / 1e6).toFixed(1)}M
            </span>
          </div>
          <div className="flex flex-col space-y-2">
            <StepperRow
              label={`In-Plane (i,j): ${volumeDimensions[0]} → ${Math.floor(volumeDimensions[0] / currentInPlaneDecimation)}`}
              value={currentInPlaneDecimation}
              onDecrease={() => handleInPlaneDecimationChange(-1)}
              onIncrease={() => handleInPlaneDecimationChange(1)}
              disabledDecrease={currentInPlaneDecimation <= 1}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <StepperRow
              label={`Slice (k): ${volumeDimensions[2]} → ${Math.floor(volumeDimensions[2] / currentKAxisDecimation)}`}
              value={currentKAxisDecimation}
              onDecrease={() => handleKAxisDecimationChange(-1)}
              onIncrease={() => handleKAxisDecimationChange(1)}
              disabledDecrease={currentKAxisDecimation <= 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
