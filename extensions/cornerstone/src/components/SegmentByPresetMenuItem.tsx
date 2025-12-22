import React, { useState, useEffect } from 'react';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useSystem } from '@ohif/core';

interface CTPreset {
  value: string;
  label: string;
  segMinHu: number;
  segMaxHu: number;
}

const PRESETS: CTPreset[] = [
  {
    value: 'bone',
    label: 'Bone',
    segMinHu: 300.0,
    segMaxHu: 3000.0,
  },
  {
    value: 'soft_tissue',
    label: 'Soft Tissue',
    segMinHu: -100.0,
    segMaxHu: 250.0,
  },
  {
    value: 'cta_vessels',
    label: 'Vessels',
    segMinHu: 150.0,
    segMaxHu: 700.0,
  },
  {
    value: 'brain_csf_80_40',
    label: 'CSF',
    segMinHu: -5.0,
    segMaxHu: 20.0,
  },
  {
    value: 'brain_csf_130_50',
    label: 'CSF (130/50)',
    segMinHu: -5.0,
    segMaxHu: 20.0,
  },
  {
    value: 'ich_acute',
    label: 'Acute ICH',
    segMinHu: 40.0,
    segMaxHu: 90.0,
  },
];

interface SegmentByPresetMenuItemProps {
  segmentationId: string;
}

const SegmentByPresetMenuItem: React.FC<SegmentByPresetMenuItemProps> = ({ segmentationId }) => {
  const { t } = useTranslation('Cornerstone');
  const { servicesManager, commandsManager, extensionManager } = useSystem();

  const [selectedPresets, setSelectedPresets] = useState<string[]>(['bone']);
  const [minHu, setMinHu] = useState<string>('300');
  const [maxHu, setMaxHu] = useState<string>('3000');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Auto-fill HU range when single preset is selected
  useEffect(() => {
    if (selectedPresets.length === 1) {
      const preset = PRESETS.find(p => p.value === selectedPresets[0]);
      if (preset) {
        setMinHu(preset.segMinHu.toString());
        setMaxHu(preset.segMaxHu.toString());
      }
    } else if (selectedPresets.length > 1) {
      // Clear HU range when multiple presets selected
      setMinHu('');
      setMaxHu('');
    }
  }, [selectedPresets]);

  const togglePreset = (presetValue: string) => {
    setSelectedPresets(prev =>
      prev.includes(presetValue)
        ? prev.filter(p => p !== presetValue)
        : [...prev, presetValue]
    );
  };

  const isHuRangeDisabled = selectedPresets.length !== 1;

  const runSegmentation = async () => {
    if (isRunning || selectedPresets.length === 0) {
      return;
    }

    const { viewportGridService, displaySetService, uiNotificationService } =
      servicesManager.services;
    const viewportId = viewportGridService.getActiveViewportId();
    const { viewports } = viewportGridService.getState();
    const viewport = viewports.get(viewportId);

    if (!viewport || !viewport.displaySetInstanceUIDs?.length) {
      console.error('No active viewport or display set found for segmentation preset command');
      uiNotificationService?.show({
        title: 'Segmentation by preset',
        message: 'No active viewport or display set found.',
        type: 'error',
      });
      return;
    }

    const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

    if (!displaySet) {
      console.error('No display set found for active viewport');
      uiNotificationService?.show({
        title: 'Segmentation by preset',
        message: 'No display set found for active viewport.',
        type: 'error',
      });
      return;
    }

    const { StudyInstanceUID: studyInstanceUID, SeriesInstanceUID: seriesInstanceUID } = displaySet;

    try {
      setIsRunning(true);

      // Only send customSegRange if single preset selected and HU values provided
      const customSegRange =
        selectedPresets.length === 1 && (minHu || maxHu)
          ? {
              minHu: minHu ? parseFloat(minHu) : undefined,
              maxHu: maxHu ? parseFloat(maxHu) : undefined,
            }
          : null;

      const result = await commandsManager.runCommand('segmentByPreset', {
        studyInstanceUID,
        seriesInstanceUID,
        preset: selectedPresets,
        customSegRange,
      });

      const segSeriesInstanceUID = result?.segmentation?.seriesInstanceUID;

      if (!segSeriesInstanceUID) {
        console.warn('segmentByPreset: no segmentation.seriesInstanceUID returned from server');
        uiNotificationService?.show({
          title: 'Segmentation by preset',
          message: 'Server did not return segmentation series information.',
          type: 'error',
        });
        return;
      }

      // Refresh study/series metadata so DisplaySetService sees the new SEG
      const [activeDataSource] = extensionManager.getActiveDataSource?.() ?? [];

      if (activeDataSource) {
        // Bust any cached study metadata so new series can be discovered.
        // The cache key in retrieveStudyMetadata is `${dicomWebConfig.name}:${StudyInstanceUID}`,
        // so we need to match that format to actually clear it.
        const dsConfig = activeDataSource.getConfig?.() ?? {};
        const cacheKey =
          typeof dsConfig.name === 'string'
            ? `${dsConfig.name}:${studyInstanceUID}`
            : studyInstanceUID;

        activeDataSource.deleteStudyMetadataPromise?.(cacheKey);

        if (activeDataSource.retrieve?.series?.metadata) {
          // Most reliable path: retrieve full series metadata for this study
          await activeDataSource.retrieve.series.metadata({
            StudyInstanceUID: studyInstanceUID,
          });
        } else if (activeDataSource.query?.series?.metadata) {
          // Legacy path (DicomWebDataSource)
          await activeDataSource.query.series.metadata({
            StudyInstanceUID: studyInstanceUID,
          });
        } else if (activeDataSource.query?.studies?.search) {
          // Fallback: refresh study list; some implementations update the metadata store here
          await activeDataSource.query.studies.search({
            studyInstanceUID: studyInstanceUID,
          });
        }
      }

      const segDisplaySets = displaySetService.getDisplaySetsForSeries(segSeriesInstanceUID);

      if (!segDisplaySets?.length) {
        console.warn(
          'segmentByPreset: SEG series not found in DisplaySetService for series',
          segSeriesInstanceUID
        );
        uiNotificationService?.show({
          title: 'Segmentation by preset',
          message: 'SEG series was created on the server but is not yet available in the viewer.',
          type: 'warning',
        });
        return;
      }

      const segDisplaySet = segDisplaySets[0];

      await commandsManager.runCommand('hydrateSecondaryDisplaySet', {
        displaySet: segDisplaySet,
        viewportId,
      });

      uiNotificationService?.show({
        title: 'Segmentation by preset',
        message: `Segmentation for preset(s) "${selectedPresets.join(', ')}" loaded successfully.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error running segmentByPreset command:', error);
      uiNotificationService?.show({
        title: 'Segmentation by preset',
        message: 'Segmentation request failed. Check console for details.',
        type: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span className="pl-2">{t('Segment by Preset')}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        sideOffset={6}
        className="p-3 space-y-3 bg-black text-white rounded-md w-64"
      >
        <div className="space-y-2">
          <label className="text-sm opacity-80">Select Preset(s)</label>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {PRESETS.map(p => (
              <label
                key={p.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedPresets.includes(p.value)}
                  onChange={() => togglePreset(p.value)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm opacity-80">
            Custom HU range
            {isHuRangeDisabled && (
              <span className="text-xs opacity-60"> (single preset only)</span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="min"
              value={minHu}
              onChange={e => setMinHu(e.target.value)}
              disabled={isHuRangeDisabled}
              className="w-1/2 bg-gray-800 text-white p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              type="number"
              placeholder="max"
              value={maxHu}
              onChange={e => setMaxHu(e.target.value)}
              disabled={isHuRangeDisabled}
              className="w-1/2 bg-gray-800 text-white p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <DropdownMenuItem
          className="bg-blue-600 hover:bg-blue-700 cursor-pointer p-2 rounded mt-4 disabled:opacity-60"
          onClick={runSegmentation}
          disabled={isRunning || selectedPresets.length === 0}
        >
          {isRunning ? 'Running…' : 'Run Segmentation'}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

export default SegmentByPresetMenuItem;
