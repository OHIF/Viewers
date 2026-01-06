import React, { useState } from 'react';
import { useSystem } from '@ohif/core';
import { useMagicWandSegmentation } from '../hooks/useMagicWandSegmentation';

type ServerSideSegmentationPanelProps = withAppTypes;

export default function ServerSideSegmentationPanel(props: ServerSideSegmentationPanelProps) {
  const { servicesManager } = useSystem();
  const { uiNotificationService } = servicesManager.services;

  const {
    mode,
    error,
    seedMarker,
    options,
    setOptions,
    startPickingSeed,
  } = useMagicWandSegmentation();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleMagicWandClick = () => {
    startPickingSeed();
  };

  const handleCancel = () => {
    if (mode === 'pickingSeed') {
      startPickingSeed(); // Toggle off
    }
  };

  const isDisabled = mode === 'loading';

  return (
    <div className="flex flex-col p-4 space-y-3">
      <div className="space-y-3">
        <button
          onClick={handleMagicWandClick}
          disabled={isDisabled}
          className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'pickingSeed'
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : isDisabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {mode === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Running segmentation…
            </span>
          ) : mode === 'pickingSeed' ? (
            'Cancel (Esc)'
          ) : (
            'Magic Wand'
          )}
        </button>

        {mode === 'pickingSeed' && (
          <div className="text-sm text-yellow-300 bg-yellow-900/30 p-2 rounded">
            Click on the image to select seed point (Esc to cancel)
          </div>
        )}

        {error && (
          <div className="text-sm text-red-300 bg-red-900/30 p-2 rounded">{error}</div>
        )}

        <div className="border-t border-gray-700 pt-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            Advanced
          </button>

          {showAdvanced && (
            <div className="mt-2 space-y-3 pl-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tolerance</label>
                <input
                  type="number"
                  value={options.tolerance ?? 30}
                  onChange={e =>
                    setOptions({ ...options, tolerance: parseInt(e.target.value) || 30 })
                  }
                  className="w-full bg-gray-800 text-white p-1 rounded border border-gray-600"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Connectivity</label>
                <select
                  value={options.connectivity ?? 6}
                  onChange={e =>
                    setOptions({
                      ...options,
                      connectivity: parseInt(e.target.value) as 6 | 18 | 26,
                    })
                  }
                  className="w-full bg-gray-800 text-white p-1 rounded border border-gray-600"
                >
                  <option value={6}>6</option>
                  <option value={18}>18</option>
                  <option value={26}>26</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Max Region Voxels (optional)
                </label>
                <input
                  type="number"
                  value={options.maxRegionVoxels ?? ''}
                  onChange={e =>
                    setOptions({
                      ...options,
                      maxRegionVoxels: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-gray-800 text-white p-1 rounded border border-gray-600"
                  placeholder="500000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Max Radius Voxels (optional)
                </label>
                <input
                  type="number"
                  value={options.maxRadiusVoxels ?? ''}
                  onChange={e =>
                    setOptions({
                      ...options,
                      maxRadiusVoxels: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full bg-gray-800 text-white p-1 rounded border border-gray-600"
                  placeholder="200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {seedMarker && (
        <div className="text-xs text-gray-400 mt-2">
          Seed point selected at slice {seedMarker.worldPoint[2]?.toFixed(0)}
        </div>
      )}
    </div>
  );
}
