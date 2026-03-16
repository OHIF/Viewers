import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import { VolumeDecimationInfo } from '../../types/ViewportPresets';
import { useSystem, getVolumeOptions, setVolumeOptions } from '@ohif/core';
import { cache as cs3DCache } from '@cornerstonejs/core';
import { AllInOneMenu, Numeric, Tooltip, TooltipContent, TooltipTrigger } from '@ohif/ui-next';
import { toolNames } from '../../initCornerstoneTools';

const DEFAULT_IJK_DECIMATION: [number, number, number] = [1, 1, 1];
const MAX_IN_PLANE_DECIMATION = 32;
const MAX_K_AXIS_DECIMATION = 64;

/** Parses IJK decimation from volumeId. Format is decimatedVolumeLoader:baseVolumeId:i_j_k; baseVolumeId may contain colons. */
function getIjkDecimationFromVolumeId(volumeId: string): [number, number, number] {
  const parts = volumeId.split(':');
  if (parts.length < 3 || parts[0] !== 'decimatedVolumeLoader') {
    return [...DEFAULT_IJK_DECIMATION];
  }
  const suffix = parts[parts.length - 1];
  if (!/^\d+_\d+_\d+$/.test(suffix)) {
    return [...DEFAULT_IJK_DECIMATION];
  }
  const [i, j, k] = suffix.split('_').map(Number);
  return [i, j, k];
}

export type VolumeOptionsProps = {
  viewportId: string;
};

export function VolumeOptions({
  viewportId,
}: VolumeOptionsProps): ReactElement {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, toolGroupService } = servicesManager.services;
  const [volumeDimensions, setVolumeDimensions] = useState<number[] | null>(null);

  const [currentInPlaneDecimation, setCurrentInPlaneDecimation] = useState<number>(
    DEFAULT_IJK_DECIMATION[0]
  );
  const [currentKAxisDecimation, setCurrentKAxisDecimation] = useState<number>(
    DEFAULT_IJK_DECIMATION[2]
  );
  const [sampleDistanceMultiplier, setSampleDistanceMultiplier] = useState(
    () => getVolumeOptions().sampleDistanceMultiplier
  );
  const [rotateSampleDistanceFactor, setRotateSampleDistanceFactor] = useState(
    () => getVolumeOptions().rotateSampleDistanceFactor
  );
  const [gpuPerformanceScore] = useState<number | null>(() => {
    const gpu = getVolumeOptions().gpuTestResults as { generalPerformanceScore?: number } | null;
    const score = gpu?.generalPerformanceScore;
    return score != null ? Number(score) : null;
  });

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

      const volumeId = volumeActor.referencedId;
      const volume = cs3DCache.getVolume(volumeId) as
        | VolumeDecimationInfo
        | undefined;
      if (!volume?.dimensions || volume.dimensions.length < 3) return;

      const dimensions = volume.dimensions;
      const currentIjk = getIjkDecimationFromVolumeId(volumeId);
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
      commandsManager.runCommand(
        'reloadVolumeWithDecimation',
        {
          viewportId,
          ijkDecimation: [v, v, currentKAxisDecimation],
        },
        'CORNERSTONE'
      );
    },
    [commandsManager, viewportId, currentKAxisDecimation]
  );

  const handleKAxisDecimationChange = useCallback(
    (value: number) => {
      const v = Math.max(1, Math.min(value, MAX_K_AXIS_DECIMATION));
      setCurrentKAxisDecimation(v);
      commandsManager.runCommand(
        'reloadVolumeWithDecimation',
        {
          viewportId,
          ijkDecimation: [currentInPlaneDecimation, currentInPlaneDecimation, v],
        },
        'CORNERSTONE'
      );
    },
    [commandsManager, viewportId, currentInPlaneDecimation]
  );

  if (
    volumeDimensions == null ||
    totalVoxels == null ||
    decimatedDimensions == null ||
    decimatedVoxels == null
  ) {
    return (
      <AllInOneMenu.ItemPanel>
        <div className="my-1 mt-2 flex flex-col space-y-2" />
      </AllInOneMenu.ItemPanel>
    );
  }

  return (
    <AllInOneMenu.ItemPanel>
      <div className="my-1 mt-2 flex flex-col space-y-2">
        <div className="flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-between pl-1 pr-2 text-base">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground text-sm cursor-help">
                Volume Downsampling
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="z-[9999]">
              <span className="block">
                Downsampling helps rendering speed on low GPU systems.
              </span>
              <span className="block">
                It is set once based on GPU score and can be modified here.
              </span>
            </TooltipContent>
          </Tooltip>
          {gpuPerformanceScore != null && (
            <span className="font-mono text-xs text-muted-foreground">
              GPU Score: {gpuPerformanceScore.toFixed(1)}
            </span>
          )}
        </div>
        <div className="w-full pl-2 pr-1">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-foreground text-xs cursor-help">Overall</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[9999]">
                  Multiplies the sampling distance for all volume interactions.
                </TooltipContent>
              </Tooltip>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={8}
                step={1}
                value={sampleDistanceMultiplier}
                onChange={v => {
                  const newValue = Math.max(1, Math.min(8, Math.round(v as number)));
                  setSampleDistanceMultiplier(newValue);
                  setVolumeOptions({ sampleDistanceMultiplier: newValue });
                  commandsManager.runCommand('setSampleDistanceMultiplier', {
                    sampleDistanceMultiplier: newValue,
                    viewportId,
                  });
                }}
                className="border-0 bg-transparent"
              >
                <Numeric.NumberStepper
                  direction="horizontal"
                  inputWidth="w-7 max-w-7"
                />
              </Numeric.Container>
            </div>
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-foreground text-xs cursor-help">During rotation</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[9999]">
                  Extra multipliying factor applied when rotating the volume.
                </TooltipContent>
              </Tooltip>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={8}
                step={1}
                value={rotateSampleDistanceFactor}
                onChange={v => {
                  const newValue = Math.max(1, Math.min(8, Math.round(v as number)));
                  setRotateSampleDistanceFactor(newValue);
                  setVolumeOptions({ rotateSampleDistanceFactor: newValue });
                  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
                  if (toolGroup) {
                    const cropConfig = toolGroup.getToolConfiguration('VolumeCropping') ?? {};
                    toolGroup.setToolConfiguration('VolumeCropping', {
                      ...(typeof cropConfig === 'object' ? cropConfig : {}),
                      rotateSampleDistanceFactor: newValue,
                    });
                  }
                }}
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
        <div className="w-full pl-2 pr-1">
          <div className="flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-between text-base">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground text-sm cursor-help">
                  Volume Downsizing
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="z-[9999]">
                <span className="block">
                  Downsizing reduces the size of the volume so that it can be rendered.
                </span>
                <span className="block">
                  It is set automatically but can be temporarily adjusted here.
                </span>
              </TooltipContent>
            </Tooltip>
            <span className="font-mono text-xs text-muted-foreground">
              Voxels: {(totalVoxels / 1e6).toFixed(1)}M → {(decimatedVoxels / 1e6).toFixed(1)}M
            </span>
          </div>
          <div className="bg-background mt-1 mb-1 h-px w-full" />
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-foreground text-xs cursor-help">
                    In-Plane (i,j): {volumeDimensions[0]} →{' '}
                    {Math.floor(volumeDimensions[0] / currentInPlaneDecimation)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[9999]">
                  Downsizing along the i and j axes (rows and columns) of the volume.
                </TooltipContent>
              </Tooltip>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={MAX_IN_PLANE_DECIMATION}
                step={1}
                value={currentInPlaneDecimation}
                onChange={handleInPlaneDecimationChange}
                className="border-0 bg-transparent"
              >
                <Numeric.NumberStepper
                  direction="horizontal"
                  inputWidth="w-7 max-w-7"
                />
              </Numeric.Container>
            </div>
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-foreground text-xs cursor-help">
                    Slice (k): {volumeDimensions[2]} →{' '}
                    {Math.floor(volumeDimensions[2] / currentKAxisDecimation)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[9999]">
                  Downsizing along the slice (k) axis of the volume.
                </TooltipContent>
              </Tooltip>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={MAX_K_AXIS_DECIMATION}
                step={1}
                value={currentKAxisDecimation}
                onChange={handleKAxisDecimationChange}
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
    </AllInOneMenu.ItemPanel>
  );
}
