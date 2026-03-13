import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import { useSystem } from '@ohif/core';
import { cache as cs3DCache } from '@cornerstonejs/core';
import { Numeric } from '@ohif/ui-next';

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
  const { cornerstoneViewportService } = servicesManager.services;
  const [volumeDimensions, setVolumeDimensions] = useState<number[] | null>(null);

  const [currentInPlaneDecimation, setCurrentInPlaneDecimation] = useState<number>(
    DEFAULT_IJK_DECIMATION[0]
  );
  const [currentKAxisDecimation, setCurrentKAxisDecimation] = useState<number>(
    DEFAULT_IJK_DECIMATION[2]
  );
  const [sampleDistanceMultiplier, setSampleDistanceMultiplier] = useState(1);
  const [rotateSampleDistanceFactor, setRotateSampleDistanceFactor] = useState(1);

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
        | {
            dimensions?: [number, number, number];
            originalMetadata?: { Columns?: number; Rows?: number };
          }
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

  if (
    volumeDimensions == null ||
    totalVoxels == null ||
    decimatedDimensions == null ||
    decimatedVoxels == null
  ) {
    return <div className="my-1 mt-2 flex flex-col space-y-2" />;
  }

  return (
    <div className="my-1 mt-2 flex flex-col space-y-2">
        {/* Volume Downsampling */}
        <div className="flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-between px-2 text-base">
          <span className="text-muted-foreground text-sm">Volume Downsampling</span>
        </div>
        <div className="w-full pl-2 pr-1">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-xs">Overall</span>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={8}
                step={1}
                value={sampleDistanceMultiplier}
                onChange={v => setSampleDistanceMultiplier(Math.round(v as number))}
                className="border-0 bg-transparent"
              >
                <Numeric.NumberStepper
                  direction="horizontal"
                  inputWidth="w-7 max-w-7"
                />
              </Numeric.Container>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground text-xs">During rotation</span>
              <Numeric.Container
                mode="stepper"
                min={1}
                max={8}
                step={1}
                value={rotateSampleDistanceFactor}
                onChange={v => setRotateSampleDistanceFactor(Math.round(v as number))}
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
        <div className="flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-between px-2 text-base">
          <span className="text-muted-foreground text-sm">Volume Downsizing</span>
          <span className="font-mono text-xs text-muted-foreground">
            Voxels: {(totalVoxels / 1e6).toFixed(1)}M → {(decimatedVoxels / 1e6).toFixed(1)}M
          </span>
        </div>
        <div className="w-full pl-2 pr-1">
          <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-xs">
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
                <span className="text-foreground text-xs">
                  Slice (k): {volumeDimensions[2]} →{' '}
                  {Math.ceil(volumeDimensions[2] / currentKAxisDecimation)}
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
  );
}
