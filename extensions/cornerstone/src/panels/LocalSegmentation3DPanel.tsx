import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input, Button, Label, Progress } from '@ohif/ui-next';
import { PanelSection } from '@ohif/ui-next';

type LocalSegmentation3DPanelProps = {
  commandsManager: any;
  servicesManager: any;
  extensionManager: any;
};

export default function LocalSegmentation3DPanel({
  commandsManager,
  servicesManager,
  extensionManager,
}: LocalSegmentation3DPanelProps) {
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [segmentLabel, setSegmentLabel] = useState('LocalSeg3D');
  const [segmentIndex, setSegmentIndex] = useState(1);

  // Threshold 3D states
  const [thresholdMin, setThresholdMin] = useState(-50);
  const [thresholdMax, setThresholdMax] = useState(200);

  // Magic Wand 3D states
  const [tolerance, setTolerance] = useState(30);
  const [useMinMax, setUseMinMax] = useState(false);
  const [wandMin, setWandMin] = useState(0);
  const [wandMax, setWandMax] = useState(100);
  const [connectivity, setConnectivity] = useState<6 | 18 | 26>(6);
  const [maxRegionVoxels, setMaxRegionVoxels] = useState(500000);
  const [maxRadiusVoxels, setMaxRadiusVoxels] = useState(200);

  // Progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isWaitingForClick, setIsWaitingForClick] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (isWaitingForClick) {
        commandsManager.run('cancelMagicWand3DMode');
      }
    };
  }, [isWaitingForClick, commandsManager]);

  const handleCancel = useCallback(() => {
    if (workerRef.current) {
      console.log('[LocalSegmentation3D] Cancelling operation');
      workerRef.current.terminate();
      workerRef.current = null;
    }

    if (isWaitingForClick) {
      commandsManager.run('cancelMagicWand3DMode');
    }

    setIsProcessing(false);
    setProgress(0);
    setStatusText('Cancelled');
    setIsWaitingForClick(false);

    setTimeout(() => setStatusText(''), 2000);
  }, [commandsManager, isWaitingForClick]);

  const handleBrushMode = useCallback(() => {
    console.log('[LocalSegmentation3D] Activating Brush mode');
    setActiveMode('brush');
    setStatusText('');
    setIsWaitingForClick(false);
    setIsProcessing(false);

    commandsManager.run('ensureActiveLabelmapSegmentation', {
      label: segmentLabel,
      segmentIndex,
    });

    commandsManager.run('setToolActiveToolbar', {
      toolName: 'CircularBrush',
    });
  }, [commandsManager, segmentLabel, segmentIndex]);

  const handleThreshold3D = useCallback(() => {
    console.log('[LocalSegmentation3D] Starting Threshold 3D');
    setActiveMode('threshold3d');
    setStatusText('Processing volume...');
    setIsWaitingForClick(false);
    setIsProcessing(true);
    setProgress(0);

    commandsManager.run('ensureActiveLabelmapSegmentation', {
      label: segmentLabel,
      segmentIndex,
    });

    commandsManager.run('applyThreshold3DToVolume', {
      min: thresholdMin,
      max: thresholdMax,
      segmentIndex,
      onProgress: (progressPercent: number, status: string) => {
        setProgress(progressPercent);
        setStatusText(status);
      },
      onComplete: () => {
        setIsProcessing(false);
        setProgress(100);
        setStatusText('Threshold complete');
        setTimeout(() => {
          setStatusText('');
          setProgress(0);
        }, 2000);
      },
      onError: (error: Error) => {
        setIsProcessing(false);
        setProgress(0);
        setStatusText(`Error: ${error.message}`);
        setTimeout(() => setStatusText(''), 3000);
      },
      workerRef,
    });
  }, [commandsManager, segmentLabel, segmentIndex, thresholdMin, thresholdMax]);

  const handleMagicWand3D = useCallback(() => {
    console.log('[LocalSegmentation3D] Activating Magic Wand 3D mode');
    setActiveMode('magicWand3d');
    setStatusText('Click in viewport to choose seed...');
    setIsWaitingForClick(true);
    setIsProcessing(false);
    setProgress(0);

    commandsManager.run('ensureActiveLabelmapSegmentation', {
      label: segmentLabel,
      segmentIndex,
    });

    commandsManager.run('activateMagicWand3DMode', {
      tolerance,
      useMinMax,
      minIntensity: wandMin,
      maxIntensity: wandMax,
      connectivity,
      maxRegionVoxels,
      maxRadiusVoxels,
      segmentIndex,
      onProgress: (progressPercent: number, status: string) => {
        setProgress(progressPercent);
        setStatusText(status);
        setIsProcessing(true);
      },
      onComplete: (voxelCount: number) => {
        setIsProcessing(false);
        setIsWaitingForClick(false);
        setProgress(100);
        setStatusText(`Magic Wand 3D complete: ${voxelCount} voxels`);
        setTimeout(() => {
          setStatusText('');
          setProgress(0);
        }, 3000);
      },
      onCancel: () => {
        setIsProcessing(false);
        setIsWaitingForClick(false);
        setProgress(0);
        setStatusText('');
      },
      onError: (error: Error) => {
        setIsProcessing(false);
        setIsWaitingForClick(false);
        setProgress(0);
        setStatusText(`Error: ${error.message}`);
        setTimeout(() => setStatusText(''), 3000);
      },
      workerRef,
    });
  }, [commandsManager, segmentLabel, segmentIndex, tolerance, useMinMax, wandMin, wandMax, connectivity, maxRegionVoxels, maxRadiusVoxels]);

  const handleClearSegment = useCallback(() => {
    console.log('[LocalSegmentation3D] Clearing segment');
    setStatusText('Clearing segment...');

    commandsManager.run('clearSegment3D', {
      segmentIndex,
      onComplete: () => {
        setStatusText('Segment cleared');
        setTimeout(() => setStatusText(''), 2000);
      },
    });
  }, [commandsManager, segmentIndex]);

  return (
    <PanelSection defaultOpen={true}>
      <PanelSection.Header>
        <span className="text-white">Local Segmentation (3D)</span>
      </PanelSection.Header>
      <PanelSection.Content>
        <div className="flex flex-col gap-4 p-4">
          {/* Common Settings */}
          <div className="flex flex-col gap-2">
            <Label className="text-white text-sm">Segment Label</Label>
            <Input
              type="text"
              value={segmentLabel}
              onChange={(e) => setSegmentLabel(e.target.value)}
              className="bg-black text-white border border-gray-600"
              disabled={isProcessing || isWaitingForClick}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-white text-sm">Segment Index</Label>
            <Input
              type="number"
              min="1"
              max="255"
              value={segmentIndex}
              onChange={(e) => setSegmentIndex(parseInt(e.target.value) || 1)}
              className="bg-black text-white border border-gray-600"
              disabled={isProcessing || isWaitingForClick}
            />
          </div>

          {/* Mode Buttons */}
          <div className="flex flex-col gap-2">
            <Label className="text-white text-sm">Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleBrushMode}
                className={`${activeMode === 'brush' ? 'bg-primary-dark' : 'bg-gray-700'} text-white`}
                disabled={isProcessing || isWaitingForClick}
              >
                Brush
              </Button>
              <Button
                onClick={handleThreshold3D}
                className={`${activeMode === 'threshold3d' ? 'bg-primary-dark' : 'bg-gray-700'} text-white`}
                disabled={isProcessing || isWaitingForClick}
              >
                Threshold 3D
              </Button>
              <Button
                onClick={handleMagicWand3D}
                className={`${activeMode === 'magicWand3d' ? 'bg-primary-dark' : 'bg-gray-700'} text-white`}
                disabled={isProcessing || isWaitingForClick}
              >
                Magic Wand 3D
              </Button>
              <Button
                onClick={handleClearSegment}
                className="bg-red-700 text-white hover:bg-red-600"
                disabled={isProcessing || isWaitingForClick}
              >
                Clear Segment
              </Button>
            </div>
          </div>

          {/* Threshold 3D Settings */}
          {activeMode === 'threshold3d' && (
            <div className="flex flex-col gap-2 border-t border-gray-600 pt-4">
              <Label className="text-white text-sm font-semibold">Threshold 3D Settings</Label>
              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Min Intensity</Label>
                <Input
                  type="number"
                  value={thresholdMin}
                  onChange={(e) => setThresholdMin(parseFloat(e.target.value))}
                  className="bg-black text-white border border-gray-600"
                  disabled={isProcessing}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Max Intensity</Label>
                <Input
                  type="number"
                  value={thresholdMax}
                  onChange={(e) => setThresholdMax(parseFloat(e.target.value))}
                  className="bg-black text-white border border-gray-600"
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          {/* Magic Wand 3D Settings */}
          {activeMode === 'magicWand3d' && (
            <div className="flex flex-col gap-2 border-t border-gray-600 pt-4">
              <Label className="text-white text-sm font-semibold">Magic Wand 3D Settings</Label>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useMinMax}
                  onChange={(e) => setUseMinMax(e.target.checked)}
                  disabled={isProcessing || isWaitingForClick}
                  className="w-4 h-4"
                />
                <Label className="text-white text-xs">Use Min/Max instead of Tolerance</Label>
              </div>

              {!useMinMax ? (
                <div className="flex flex-col gap-2">
                  <Label className="text-white text-xs">Tolerance</Label>
                  <Input
                    type="number"
                    value={tolerance}
                    onChange={(e) => setTolerance(parseFloat(e.target.value))}
                    className="bg-black text-white border border-gray-600"
                    disabled={isProcessing || isWaitingForClick}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label className="text-white text-xs">Min Intensity</Label>
                    <Input
                      type="number"
                      value={wandMin}
                      onChange={(e) => setWandMin(parseFloat(e.target.value))}
                      className="bg-black text-white border border-gray-600"
                      disabled={isProcessing || isWaitingForClick}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-white text-xs">Max Intensity</Label>
                    <Input
                      type="number"
                      value={wandMax}
                      onChange={(e) => setWandMax(parseFloat(e.target.value))}
                      className="bg-black text-white border border-gray-600"
                      disabled={isProcessing || isWaitingForClick}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Connectivity</Label>
                <select
                  value={connectivity.toString()}
                  onChange={(e) => setConnectivity(parseInt(e.target.value) as 6 | 18 | 26)}
                  disabled={isProcessing || isWaitingForClick}
                  className="bg-black text-white border border-gray-600 px-2 py-1 rounded"
                >
                  <option value="6">6-connected (faces)</option>
                  <option value="18">18-connected (faces + edges)</option>
                  <option value="26">26-connected (all)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Max Region Voxels</Label>
                <Input
                  type="number"
                  value={maxRegionVoxels}
                  onChange={(e) => setMaxRegionVoxels(parseInt(e.target.value))}
                  className="bg-black text-white border border-gray-600"
                  disabled={isProcessing || isWaitingForClick}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Max Radius (voxels)</Label>
                <Input
                  type="number"
                  value={maxRadiusVoxels}
                  onChange={(e) => setMaxRadiusVoxels(parseInt(e.target.value))}
                  className="bg-black text-white border border-gray-600"
                  disabled={isProcessing || isWaitingForClick}
                />
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {(isProcessing || isWaitingForClick) && (
            <div className="flex flex-col gap-2 border-t border-gray-600 pt-4">
              {isProcessing && progress > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-light h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {statusText && (
                <div className="text-primary-light text-sm text-center py-2">
                  {statusText}
                  {isProcessing && progress > 0 && ` (${Math.round(progress)}%)`}
                </div>
              )}

              {(isProcessing || isWaitingForClick) && (
                <Button
                  onClick={handleCancel}
                  className="bg-red-700 text-white hover:bg-red-600"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </PanelSection.Content>
    </PanelSection>
  );
}




