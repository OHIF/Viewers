import React, { ReactElement, useState, useEffect } from 'react';
import { VolumeRenderingQualityProps } from '../../types/ViewportPresets';
import { useSystem } from '@ohif/core';
import { cache as cs3DCache } from '@cornerstonejs/core';
import { toolNames } from '../../initCornerstoneTools';

export function VolumeRenderingQuality({
  volumeRenderingQualityRange,
  viewportId,
}: VolumeRenderingQualityProps): ReactElement {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;
  const [volumeDimensions, setVolumeDimensions] = useState<number[] | null>(null);
  const [totalVoxels, setTotalVoxels] = useState<number | null>(null);
  const [decimatedDimensions, setDecimatedDimensions] = useState<number[] | null>(null);
  const [decimatedVoxels, setDecimatedVoxels] = useState<number | null>(null);
 const DEFAULT_IJK_DECIMATION = [1, 1, 1];
 const decimationSequence = [1, 2, 4, 8, 16, 32];

 const DEFAULT_SAMPLE_DISTANCE_MULTIPLIER = 1;
 const DEFAULT_SAMPLE_DISTANCE_MULTIPLIER_ON_ROTATION = 1;

  const [currentInPlaneDecimation, setCurrentInPlaneDecimation] = useState<number>(() => {
        const saved = localStorage.getItem('currentDecimationIJ');
    return saved ? Math.max(1, Number(saved)) : DEFAULT_IJK_DECIMATION[0];
  });
  const [currentKAxisDecimation, setCurrentKAxisDecimation] = useState<number>(() => {
       const saved = localStorage.getItem('currentDecimationK');
    return saved ? Math.max(1, Number(saved)) : DEFAULT_IJK_DECIMATION[2];
  });
  const [sampleDistanceMultiplierOverall, setSampleDistanceMultiplierOverall] = useState<number>(() => {
    const saved = localStorage.getItem('volumeRenderingSampling');
    return saved ? Math.max(1, Number(saved)) : DEFAULT_SAMPLE_DISTANCE_MULTIPLIER;
  });
  const [sampleDistanceMultiplierOnRotation, setSampleDistanceMultiplierOnRotation] = useState<number>(() => {
    const saved = localStorage.getItem('rotateSampleDistanceFactor');
    return saved ? Math.max(1, Number(saved)) : DEFAULT_SAMPLE_DISTANCE_MULTIPLIER_ON_ROTATION;
  });
  const [gpuPerformanceScore, setGpuPerformanceScore] = useState<number | null>(() => {
    const savedGPUTestResults = localStorage.getItem('gpuTestResults');
    const GPUPerformanceScore = savedGPUTestResults ? JSON.parse(savedGPUTestResults).generalPerformanceScore : null;
    return GPUPerformanceScore ? Number(GPUPerformanceScore) : null;
  });

  useEffect(() => {
    const updateVolumeInfoOnce = () => {
      try {
        const viewport = cornerstoneViewportService.getViewportInfo(viewportId);
        if (!viewport) return;

        const renderingEngine = cornerstoneViewportService.getRenderingEngine();
        if (!renderingEngine) return;

        const cornerstoneViewport = renderingEngine.getViewport(viewportId);
        if (!cornerstoneViewport) return;

        let actors;
        try {
          actors = cornerstoneViewport.getActors();
        } catch (error) {
          console.warn('Failed to get actors from viewport: ', error);
          return;
        }

        if (!actors || actors.length === 0) return;

        const volumeActor = actors.find(actor => {
          try {
            return actor && actor.actor && typeof actor.actor.getClassName === 'function' && actor.actor.getClassName() === 'vtkVolume';
          } catch (error) {
            return false;
          }
        });
        if (!volumeActor) return;

        const volumeId = volumeActor.referencedId;
        if (!volumeId) return;

        let volume;
        try {
          volume = cs3DCache.getVolume(volumeId);
        } catch (error) {
          console.warn('Failed to get volume from cache:', error);
          return;
        }
        if (!volume) return;


        const dimensions = volume.dimensions;
        if (dimensions && dimensions.length >= 3) {
          setVolumeDimensions(dimensions);
          const total = dimensions[0] * dimensions[1] * dimensions[2];
          setTotalVoxels(total);


          let currentIjkDecimation = DEFAULT_IJK_DECIMATION;

          if ((volume as any).ijkDecimation && Array.isArray((volume as any).ijkDecimation)) {
            currentIjkDecimation = (volume as any).ijkDecimation;
          } else if ((volume as any).appliedDecimation && (volume as any).appliedDecimation.originalDecimation) {
            currentIjkDecimation = (volume as any).appliedDecimation.originalDecimation;
          } else {

            const savedDecimationIj = parseInt(localStorage.getItem('currentDecimationIJ') || DEFAULT_IJK_DECIMATION[0].toString());
            const savedDecimationK = parseInt(localStorage.getItem('currentDecimationK') || DEFAULT_IJK_DECIMATION[2].toString());
            currentIjkDecimation =  [savedDecimationIj, DEFAULT_IJK_DECIMATION[1], savedDecimationK] ;
          }

          const originalMetadata = (volume as any).originalMetadata;
          if (originalMetadata) {
            const originalDims = [originalMetadata.Columns, originalMetadata.Rows, Math.floor(dimensions[2] * currentIjkDecimation[2])];
            setVolumeDimensions(originalDims);
            setDecimatedDimensions(dimensions);

            const originalTotal = originalDims[0] * originalDims[1] * originalDims[2];
            setTotalVoxels(originalTotal);

            const decimatedTotal = dimensions[0] * dimensions[1] * dimensions[2];
            setDecimatedVoxels(decimatedTotal);
          } else {
            const originalDims = [
              dimensions[0] * currentIjkDecimation[0],
              dimensions[1] * currentIjkDecimation[1],
              dimensions[2] * currentIjkDecimation[2]
            ];
            setVolumeDimensions(originalDims);
            setDecimatedDimensions(dimensions);

            const originalTotal = originalDims[0] * originalDims[1] * originalDims[2];
            setTotalVoxels(originalTotal);

            const decimatedTotal = dimensions[0] * dimensions[1] * dimensions[2];
            setDecimatedVoxels(decimatedTotal);
          }
        }
      } catch (error) {
        console.error('Failed to get volume dimensions:', error);
        setVolumeDimensions(null);
        setTotalVoxels(null);
        setCurrentInPlaneDecimation(1);
        setCurrentKAxisDecimation(1);
        setDecimatedDimensions(null);
        setDecimatedVoxels(null);
      }
    };

    // Add a small delay to ensure viewport is fully initialized after volume changes
    const timeoutId = setTimeout(() => {
      updateVolumeInfoOnce();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [viewportId, cornerstoneViewportService]);

  // Helper function to save decimation settings to localStorage
  const saveDecimationSettings = (newIjkDecimation: [number, number, number]) => {
    // Update localStorage with new settings
    if (!newIjkDecimation || !Array.isArray(newIjkDecimation) || newIjkDecimation.length < 3) {
      console.warn('Invalid newIjkDecimation value:', newIjkDecimation);
      return;
    }
    localStorage.setItem('currentDecimationIJ', newIjkDecimation[0].toString());
    localStorage.setItem('currentDecimationK', newIjkDecimation[2].toString());

  };

  const updateDecimationSettings = () => {
    // Recalculate decimated dimensions and voxels based on current settings
    if (volumeDimensions) {
      const decimatedDims = [
        Math.floor(volumeDimensions[0] / currentInPlaneDecimation),
        Math.floor(volumeDimensions[1] / currentInPlaneDecimation),
        Math.floor(volumeDimensions[2] / currentKAxisDecimation)
      ];
      setDecimatedDimensions(decimatedDims);

      const decimatedTotal = decimatedDims[0] * decimatedDims[1] * decimatedDims[2];
      setDecimatedVoxels(decimatedTotal);
    }

  };

  const handleInPlaneDecimationChange = (delta: number) => {

    const currentIndex = decimationSequence.indexOf(currentInPlaneDecimation);

    let newIndex;
    if (delta > 0) {
      // Increment: move to next higher value
      newIndex = Math.min(currentIndex + 1, decimationSequence.length - 1);
    } else {
      // Decrement: move to next lower value
      newIndex = Math.max(currentIndex - 1, 0);
    }

    const newValue = decimationSequence[newIndex];

    if (newValue !== currentInPlaneDecimation) {
      setCurrentInPlaneDecimation(newValue);

      const newIjkDecimation: [number, number, number] = [newValue, newValue, currentKAxisDecimation];
      saveDecimationSettings(newIjkDecimation);

      try {
        commandsManager.runCommand('reloadVolumeWithDecimation', { viewportId });
      } catch (error) {
        console.error('VolumeRenderingQuality: Volume reload with decimation failed:', error);
      }
    }
  };

  const handleKAxisDecimationChange = (delta: number) => {
    const newValue = Math.max(1, currentKAxisDecimation + delta);
    if (newValue !== currentKAxisDecimation) {
      setCurrentKAxisDecimation(newValue);

      // Save decimation settings to localStorage
      const newIjkDecimation: [number, number, number] = [currentInPlaneDecimation, currentInPlaneDecimation, newValue];
      saveDecimationSettings(newIjkDecimation);

      // Reload volume with new decimation settings
      try {
        commandsManager.runCommand('reloadVolumeWithDecimation', { viewportId });
      } catch (error) {
        console.error('VolumeRenderingQuality: Reload volume with decimation failed:', error);
      }
    }
  };

  const handleSampleDistanceMultiplier = (delta: number) => {
    const newValue = Math.max(1, sampleDistanceMultiplierOverall + delta);
    if (newValue !== sampleDistanceMultiplierOverall) {
      setSampleDistanceMultiplierOverall(newValue);

      // Call command to update sample distance multiplier on the viewport
      try {
        commandsManager.runCommand('setSampleDistanceMultiplier', {
          sampleDistanceMultiplier: newValue,
          viewportId: viewportId,
        });

      } catch (error) {
        console.error('VolumeRenderingQuality: Failed to set sample distance multiplier:', error);
      }
    }
  };

  const handleSampleDistanceMultiplierOnRotationChange = (delta: number) => {
    const newValue = Math.max(1, sampleDistanceMultiplierOnRotation + delta);
    if (newValue !== sampleDistanceMultiplierOnRotation) {
      setSampleDistanceMultiplierOnRotation(newValue);

      // Store rotateSampleDistanceFactor to localStorage
      localStorage.setItem('rotateSampleDistanceFactor', newValue.toString());

      // Update rotateSampleDistanceFactor for TrackballRotate and VolumeCropping tools
      try {
        const { toolGroupService } = servicesManager.services;
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (toolGroup) {
          // Update TrackballRotateTool configuration
          const trackballConfig = toolGroup.getToolConfiguration(toolNames.VolumeRotateTool) || {};
          toolGroup.setToolConfiguration(toolNames.VolumeRotateTool, {
            ...(typeof trackballConfig === 'object' ? trackballConfig : {}),
            rotateSampleDistanceFactor: newValue,
          });

          // Update VolumeCropping tool configuration
          const volumeCroppingConfig = toolGroup.getToolConfiguration('VolumeCropping') || {};
          toolGroup.setToolConfiguration('VolumeCropping', {
            ...(typeof volumeCroppingConfig === 'object' ? volumeCroppingConfig : {}),
            rotateSampleDistanceFactor: newValue,
          });

        }
      } catch (error) {
        console.error('VolumeRenderingQuality: Failed to set rotateSampleDistanceFactor:', error);
      }
    }
  };

  // Update calculations when decimation values change (simple calculation, no VTK calls)
  useEffect(() => {
    updateDecimationSettings();
  }, [currentInPlaneDecimation, currentKAxisDecimation, volumeDimensions]);

  return (
    <div className="my-1 mt-2 flex flex-col space-y-3">
      {volumeDimensions && totalVoxels && decimatedDimensions && decimatedVoxels && (
        <div className="w-full pl-2 pr-1">
          {/* SampleDistance Multiplier Control */}
          <div className="flex flex-col space-y-3">
            <div className="flex flex-row items-center justify-between">
              <span className="text-sm font-medium text-foreground">VRT Downsampling</span>
              {gpuPerformanceScore !== null && (
                <span className="text-xs text-muted-foreground font-mono">
                  GPU Score: {gpuPerformanceScore.toFixed(1)}
                </span>
              )}
            </div>

            {/* Overall Sample Distance Multiplier Control */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Overall</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSampleDistanceMultiplier(-1)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                    disabled={sampleDistanceMultiplierOverall <= 1}
                  >
                    −
                  </button>
                  <span className="text-sm font-mono w-8 text-center">{sampleDistanceMultiplierOverall}</span>
                  <button
                    onClick={() => handleSampleDistanceMultiplier(1)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* On Rotation Sample Distance Multiplier Control */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">During rotation (Overall × factor)</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSampleDistanceMultiplierOnRotationChange(-1)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                    disabled={sampleDistanceMultiplierOnRotation <= 1}
                  >
                    −
                  </button>
                  <span className="text-sm font-mono w-8 text-center">{sampleDistanceMultiplierOnRotation}</span>
                  <button
                    onClick={() => handleSampleDistanceMultiplierOnRotationChange(1)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Decimation Control */}
          <div className="flex flex-col space-y-3 mt-4">
            <div className="flex flex-row items-center justify-between">
              <span className="text-sm font-medium text-foreground">Volume Downsizing</span>
              <span className="text-xs text-muted-foreground font-mono">
                Voxels: {(totalVoxels / 1000000).toFixed(1)}M
                {' -> '}
                {(decimatedVoxels / 1000000).toFixed(1)}M
              </span>
            </div>
            {/* In-Plane Decimation Control (i,j) */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">In-Plane (i,j): {volumeDimensions[0]} →
                {Math.floor(volumeDimensions[0] / currentInPlaneDecimation)}
               </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleInPlaneDecimationChange(-1)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                    disabled={currentInPlaneDecimation <= 1}
                  >
                    −
                  </button>
                  <span className="text-sm font-mono w-8 text-center">{currentInPlaneDecimation}</span>
                  <button
                    onClick={() => handleInPlaneDecimationChange(1)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* K-Axis Decimation Control */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Slice (k): {volumeDimensions[2]} → {Math.floor(volumeDimensions[2] / currentKAxisDecimation)} </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleKAxisDecimationChange(-1)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                    disabled={currentKAxisDecimation <= 1}
                  >
                    −
                  </button>
                  <span className="text-sm font-mono w-8 text-center">{currentKAxisDecimation}</span>
                  <button
                    onClick={() => handleKAxisDecimationChange(1)}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
