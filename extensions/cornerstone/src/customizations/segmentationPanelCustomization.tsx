import { CustomDropdownMenuContent } from './CustomDropdownMenuContent';
import { CustomSegmentStatisticsHeader } from './CustomSegmentStatisticsHeader';
import React, { useState } from 'react';
import { Switch } from '@ohif/ui-next';

export default function getSegmentationPanelCustomization({ commandsManager, servicesManager }) {
  return {
    'panelSegmentation.customDropdownMenuContent': CustomDropdownMenuContent,
    'panelSegmentation.customSegmentStatisticsHeader': CustomSegmentStatisticsHeader,
    'panelSegmentation.disableEditing': false,
    'panelSegmentation.showAddSegment': true,
    'panelSegmentation.onSegmentationAdd': () => {
      const { viewportGridService } = servicesManager.services;
      const viewportId = viewportGridService.getState().activeViewportId;
      commandsManager.run('createLabelmapForViewport', { viewportId });
    },
    'panelSegmentation.tableMode': 'collapsed',
    'panelSegmentation.readableText': {
      // the values will appear in this order
      min: 'Min Value',
      minLPS: 'Min Coord',
      max: 'Max Value',
      maxLPS: 'Max Coord',
      mean: 'Mean Value',
      stdDev: 'Standard Deviation',
      count: 'Voxel Count',
      median: 'Median',
      skewness: 'Skewness',
      kurtosis: 'Kurtosis',
      peakValue: 'Peak Value',
      peakLPS: 'Peak Coord',
      volume: 'Volume',
      lesionGlycolysis: 'Lesion Glycolysis',
      center: 'Center',
    },
    'segmentationToolbox.config': () => {
      // Get initial states based on current configuration
      const [previewEdits, setPreviewEdits] = useState(false);
      const [toggleSegmentEnabled, setToggleSegmentEnabled] = useState(false);
      const [useCenterAsSegmentIndex, setUseCenterAsSegmentIndex] = useState(false);
      const handlePreviewEditsChange = checked => {
        setPreviewEdits(checked);
        commandsManager.run('toggleSegmentPreviewEdit', { toggle: checked });
      };

      const handleToggleSegmentEnabledChange = checked => {
        setToggleSegmentEnabled(checked);
        commandsManager.run('toggleSegmentSelect', { toggle: checked });
      };

      const handleUseCenterAsSegmentIndexChange = checked => {
        setUseCenterAsSegmentIndex(checked);
        commandsManager.run('toggleUseCenterSegmentIndex', { toggle: checked });
      };

      return (
        <div className="bg-muted flex flex-col gap-4 border-b border-b-[2px] border-black px-2 py-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={previewEdits}
              onCheckedChange={handlePreviewEditsChange}
            />
            <span className="text-base text-white">Preview edits before creating</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={useCenterAsSegmentIndex}
              onCheckedChange={handleUseCenterAsSegmentIndexChange}
            />
            <span className="text-base text-white">Use center as segment index</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={toggleSegmentEnabled}
              onCheckedChange={handleToggleSegmentEnabledChange}
            />
            <span className="text-base text-white">Hover on segment border to activate</span>
          </div>
        </div>
      );
    },
  };
}
