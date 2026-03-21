import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import SegmentLabelPanel from '../../components/SegmentLabelPanel';
import type { Segment } from '../../components/SegmentLabelPanel';

// Lazy-load the three clinical tool panels
const PanelEcgViewer = React.lazy(
  () => import('../../../../../extensions/ecg-tools/src/panels/PanelEcgViewer')
);
const PanelSmartPaint = React.lazy(
  () => import('../../../../../extensions/smart-paint/src/panels/PanelSmartPaint')
);
const PanelFlatfoot = React.lazy(
  () => import('../../../../../extensions/flatfoot/src/panels/PanelFlatfoot')
);

type HubTool = 'ECG' | 'SMART_PAINT' | 'FLATFOOT';

const TOOLS: { id: HubTool; label: string; description: string }[] = [
  { id: 'ECG',         label: 'ECG Viewer',   description: 'Electrocardiogram interval & axis measurements' },
  { id: 'SMART_PAINT', label: 'Smart Paint',  description: 'Freehand brush ROI annotation' },
  { id: 'FLATFOOT',    label: 'Flatfoot',     description: 'Foot arch radiographic analysis' },
];

function hexToRgba(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.4)`;
}

export default function ViewerHubRoute() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<HubTool>('SMART_PAINT');
  const [activeSegmentColor, setActiveSegmentColor] = useState<string | undefined>(undefined);

  const handleSegmentChange = (seg: Segment | null) => {
    setActiveSegmentColor(seg ? hexToRgba(seg.color) : undefined);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
        >
          ← Back to Worklist
        </button>

        <div className="h-5 w-px bg-gray-700" />
        <span className="text-sm font-bold text-blue-300">Clinical Viewer Hub</span>
        <div className="h-5 w-px bg-gray-700" />

        {/* Tool tabs */}
        <div className="flex gap-1">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.description}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTool === tool.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>

        {/* Active tool badge */}
        <span className="ml-auto text-xs text-gray-500">
          {TOOLS.find(t => t.id === activeTool)?.description}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar: Segmentation / Label Map */}
        <div className="flex w-56 flex-col overflow-y-auto border-r border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 px-3 py-2">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-400">
              Segmentation
            </div>
            <div className="mt-0.5 text-xs leading-snug text-gray-500">
              Create labels. Active segment color sets Smart Paint brush.
            </div>
          </div>
          <SegmentLabelPanel onActiveSegmentChange={handleSegmentChange} />
        </div>

        {/* Main: Active Tool Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Loading tool...
              </div>
            }
          >
            {activeTool === 'ECG'         && <PanelEcgViewer />}
            {activeTool === 'SMART_PAINT' && (
              <PanelSmartPaint activeSegmentColor={activeSegmentColor} />
            )}
            {activeTool === 'FLATFOOT'    && <PanelFlatfoot />}
          </Suspense>
        </div>

      </div>
    </div>
  );
}
