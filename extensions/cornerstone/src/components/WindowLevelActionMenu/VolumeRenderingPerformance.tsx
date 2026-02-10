import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import { VolumeDecimationInfo } from '../../types/ViewportPresets';
import { useSystem } from '@ohif/core';
import { cache as cs3DCache } from '@cornerstonejs/core';
import { toolNames } from '../../initCornerstoneTools';
import { Numeric } from '@ohif/ui-next';

const DEFAULT_IJK_DECIMATION: [number, number, number] = [1, 1, 1];
const MAX_IN_PLANE_DECIMATION = 32;
const MAX_K_AXIS_DECIMATION = 64;
const MAX_SAMPLE_DISTANCE_MULTIPLIER = 20;
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

      const inPlane = Math.max(1, Math.min(currentIjk[0], MAX_IN_PLANE_DECIMATION));
      const kAxis = Math.max(1, Math.min(currentIjk[2], MAX_K_AXIS_DECIMATION));
      if (meta) {
        const originalDims: [number, number, number] = [
          meta.Columns ?? dimensions[0],
          meta.Rows ?? dimensions[1],
          Math.floor(dimensions[2] * currentIjk[2]),
        ];
        setVolumeDimensions(originalDims);
        setCurrentInPlaneDecimation(inPlane);
        setCurrentKAxisDecimation(kAxis);
      } else {
        const originalDims: [number, number, number] = [
          dimensions[0] * currentIjk[0],
          dimensions[1] * currentIjk[1],
          dimensions[2] * currentIjk[2],
        ];
        setVolumeDimensions(originalDims);
        setCurrentInPlaneDecimation(inPlane);
        setCurrentKAxisDecimation(kAxis);
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

  const handleInPlaneDecimationChange = useCallback(
    (value: number) => {
      const v = Math.max(1, Math.min(value, MAX_IN_PLANE_DECIMATION));
      setCurrentInPlaneDecimation(v);
      commandsManager.runCommand('reloadVolumeWithDecimation', {
        viewportId,
        ijkDecimation: [v, v, currentKAxisDecimation],
      });
    },
    [commandsManager, viewportId, currentKAxisDecimation]
  );

  const handleKAxisDecimationChange = useCallback(
    (value: number) => {
      const v = Math.max(1, Math.min(value, MAX_K_AXIS_DECIMATION));
      setCurrentKAxisDecimation(v);
      commandsManager.runCommand('reloadVolumeWithDecimation', {
        viewportId,
        ijkDecimation: [currentInPlaneDecimation, currentInPlaneDecimation, v],
      });
    },
    [commandsManager, viewportId, currentInPlaneDecimation]
  );

  const handleSampleDistanceMultiplier = useCallback(
    (value: number) => {
      const v = Math.max(1, Math.min(value, MAX_SAMPLE_DISTANCE_MULTIPLIER));
      setSampleDistanceMultiplierOverall(v);
      commandsManager.runCommand('setSampleDistanceMultiplier', {
        sampleDistanceMultiplier: v,
        viewportId,
      });
    },
    [commandsManager, viewportId]
  );

  const handleSampleDistanceMultiplierOnRotationChange = useCallback(
    (value: number) => {
      const v = Math.max(1, Math.min(value, MAX_SAMPLE_DISTANCE_MULTIPLIER));
      setSampleDistanceMultiplierOnRotation(v);
      // const toolGroup = servicesManager.services.toolGroupService.getToolGroupForViewport(
      //   viewportId
      // );
      // if (toolGroup) {
      //   const trackballConfig =
      //     toolGroup.getToolConfiguration(toolNames.VolumeRotate) ?? {};
      //   toolGroup.setToolConfiguration(toolNames.VolumeRotate, {
      //     ...(typeof trackballConfig === 'object' ? trackballConfig : {}),
      //     rotateSampleDistanceFactor: v,
      //   });
      //   const cropConfig = toolGroup.getToolConfiguration('VolumeCropping') ?? {};
      //   toolGroup.setToolConfiguration('VolumeCropping', {
      //     ...(typeof cropConfig === 'object' ? cropConfig : {}),
      //     rotateSampleDistanceFactor: v,
      //   });
      // }
    },
    [servicesManager, viewportId]
  );

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
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overall</span>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={MAX_SAMPLE_DISTANCE_MULTIPLIER}
                step={1}
                value={sampleDistanceMultiplierOverall}
                onChange={v => handleSampleDistanceMultiplier(v as number)}
                className="border-0 bg-transparent"
              >
                <Numeric.NumberStepper
                  direction="horizontal"
                  inputWidth="w-7 max-w-7"
                />
              </Numeric.Container>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                During rotation (Overall x factor)
              </span>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={MAX_SAMPLE_DISTANCE_MULTIPLIER}
                step={1}
                value={sampleDistanceMultiplierOnRotation}
                onChange={v => handleSampleDistanceMultiplierOnRotationChange(v as number)}
                className="border-0 bg-transparent"
              >
                <Numeric.NumberStepper
                  direction="horizontal"
                  inputWidth="w-7 max-w-7"
                />
              </Numeric.Container>
            </div>
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
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                In-Plane (i,j): {volumeDimensions[0]} →{' '}
                {Math.floor(volumeDimensions[0] / currentInPlaneDecimation)}
              </span>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={MAX_IN_PLANE_DECIMATION}
                step={1}
                value={currentInPlaneDecimation}
                onChange={v => handleInPlaneDecimationChange(v as number)}
                className="border-0 bg-transparent"
              >
                <Numeric.NumberStepper
                  direction="horizontal"
                  inputWidth="w-7 max-w-7"
                />
              </Numeric.Container>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Slice (k): {volumeDimensions[2]} →{' '}
                {Math.floor(volumeDimensions[2] / currentKAxisDecimation)}
              </span>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={MAX_K_AXIS_DECIMATION}
                step={1}
                value={currentKAxisDecimation}
                onChange={v => handleKAxisDecimationChange(v as number)}
                className="border-0 bg-transparent"
              >
                <Numeric.NumberStepper
                  direction="horizontal"
                  inputWidth="w-7 max-w-7"
                />
              </Numeric.Container>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
