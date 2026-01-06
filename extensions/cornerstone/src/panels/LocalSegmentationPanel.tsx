import React, { useState, useCallback, useEffect } from 'react';
import { Input, Button, Label } from '@ohif/ui-next';
import { PanelSection } from '@ohif/ui-next';

type LocalSegmentationPanelProps = {
  commandsManager: any;
  servicesManager: any;
  extensionManager: any;
};

export default function LocalSegmentationPanel({
  commandsManager,
  servicesManager,
  extensionManager,
}: LocalSegmentationPanelProps) {
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [segmentLabel, setSegmentLabel] = useState('LocalSeg');
  const [segmentIndex, setSegmentIndex] = useState(1);

  // Threshold mode states
  const [thresholdMin, setThresholdMin] = useState(-50);
  const [thresholdMax, setThresholdMax] = useState(200);

  // Magic Wand mode states
  const [tolerance, setTolerance] = useState(30);
  const [connectivity, setConnectivity] = useState<4 | 8>(4);
  const [maxPixels, setMaxPixels] = useState(200000);
  const [statusText, setStatusText] = useState('');
  const [isWaitingForClick, setIsWaitingForClick] = useState(false);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      if (isWaitingForClick) {
        commandsManager.run('cancelMagicWandMode');
      }
    };
  }, [isWaitingForClick, commandsManager]);

  const handleBrushMode = useCallback(() => {
    console.log('[LocalSegmentation] Activating Brush mode');
    setActiveMode('brush');
    setStatusText('');
    setIsWaitingForClick(false);

    // Ensure segmentation exists and is active
    commandsManager.run('ensureActiveLabelmapSegmentation', {
      label: segmentLabel,
      segmentIndex,
    });

    // Activate brush tool (CircularBrush)
    commandsManager.run('setToolActiveToolbar', {
      toolName: 'CircularBrush',
    });
  }, [commandsManager, segmentLabel, segmentIndex]);

  const handleThresholdMode = useCallback(() => {
    console.log('[LocalSegmentation] Activating Threshold mode');
    setActiveMode('threshold');
    setStatusText('');
    setIsWaitingForClick(false);

    // Ensure segmentation exists and is active
    commandsManager.run('ensureActiveLabelmapSegmentation', {
      label: segmentLabel,
      segmentIndex,
    });

    // Run threshold on current slice
    commandsManager.run('applyThresholdToCurrentSlice', {
      min: thresholdMin,
      max: thresholdMax,
      segmentIndex,
    });
  }, [commandsManager, segmentLabel, segmentIndex, thresholdMin, thresholdMax]);

  const handleMagicWandMode = useCallback(() => {
    console.log('[LocalSegmentation] Activating Magic Wand mode');
    setActiveMode('magicWand');
    setStatusText('Click in viewport to choose seed...');
    setIsWaitingForClick(true);

    // Ensure segmentation exists and is active
    commandsManager.run('ensureActiveLabelmapSegmentation', {
      label: segmentLabel,
      segmentIndex,
    });

    // Activate magic wand mode (waits for click)
    commandsManager.run('activateMagicWandMode', {
      tolerance,
      connectivity,
      maxPixels,
      segmentIndex,
      onComplete: () => {
        setStatusText('Magic Wand completed');
        setIsWaitingForClick(false);
        setTimeout(() => setStatusText(''), 2000);
      },
      onCancel: () => {
        setStatusText('');
        setIsWaitingForClick(false);
      },
    });
  }, [commandsManager, segmentLabel, segmentIndex, tolerance, connectivity, maxPixels]);

  return (
    <PanelSection defaultOpen={true}>
      <PanelSection.Header>
        <span className="text-white">Local Segmentation</span>
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
            />
          </div>

          {/* Mode Buttons */}
          <div className="flex flex-col gap-2">
            <Label className="text-white text-sm">Mode</Label>
            <div className="flex gap-2">
              <Button
                onClick={handleBrushMode}
                className={`flex-1 ${activeMode === 'brush' ? 'bg-primary-dark' : 'bg-gray-700'} text-white`}
              >
                Brush
              </Button>
              <Button
                onClick={handleThresholdMode}
                className={`flex-1 ${activeMode === 'threshold' ? 'bg-primary-dark' : 'bg-gray-700'} text-white`}
              >
                Threshold
              </Button>
              <Button
                onClick={handleMagicWandMode}
                className={`flex-1 ${activeMode === 'magicWand' ? 'bg-primary-dark' : 'bg-gray-700'} text-white`}
                disabled={isWaitingForClick}
              >
                Magic Wand
              </Button>
            </div>
          </div>

          {/* Threshold Settings */}
          {activeMode === 'threshold' && (
            <div className="flex flex-col gap-2 border-t border-gray-600 pt-4">
              <Label className="text-white text-sm font-semibold">Threshold Settings</Label>
              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Min Intensity</Label>
                <Input
                  type="number"
                  value={thresholdMin}
                  onChange={(e) => setThresholdMin(parseFloat(e.target.value))}
                  className="bg-black text-white border border-gray-600"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Max Intensity</Label>
                <Input
                  type="number"
                  value={thresholdMax}
                  onChange={(e) => setThresholdMax(parseFloat(e.target.value))}
                  className="bg-black text-white border border-gray-600"
                />
              </div>
            </div>
          )}

          {/* Magic Wand Settings */}
          {activeMode === 'magicWand' && (
            <div className="flex flex-col gap-2 border-t border-gray-600 pt-4">
              <Label className="text-white text-sm font-semibold">Magic Wand Settings</Label>
              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Tolerance</Label>
                <Input
                  type="number"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseFloat(e.target.value))}
                  className="bg-black text-white border border-gray-600"
                  disabled={isWaitingForClick}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Connectivity</Label>
                <select
                  value={connectivity.toString()}
                  onChange={(e) => setConnectivity(parseInt(e.target.value) as 4 | 8)}
                  disabled={isWaitingForClick}
                  className="bg-black text-white border border-gray-600 px-2 py-1 rounded"
                >
                  <option value="4">4-connected</option>
                  <option value="8">8-connected</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-white text-xs">Max Pixels</Label>
                <Input
                  type="number"
                  value={maxPixels}
                  onChange={(e) => setMaxPixels(parseInt(e.target.value))}
                  className="bg-black text-white border border-gray-600"
                  disabled={isWaitingForClick}
                />
              </div>
            </div>
          )}

          {/* Status Text */}
          {statusText && (
            <div className="text-primary-light text-sm text-center py-2 border-t border-gray-600">
              {statusText}
            </div>
          )}
        </div>
      </PanelSection.Content>
    </PanelSection>
  );
}
