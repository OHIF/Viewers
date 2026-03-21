import React, { useState } from 'react';

export interface Segment {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

const PALETTE = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#34d399', '#22d3ee', '#818cf8', '#e879f9',
  '#60a5fa', '#f472b6',
];

interface Props {
  onActiveSegmentChange?: (seg: Segment | null) => void;
}

export default function SegmentLabelPanel({ onActiveSegmentChange }: Props) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const addSegment = () => {
    const id = Math.random().toString(36).slice(2);
    const color = PALETTE[segments.length % PALETTE.length];
    const seg: Segment = { id, name: `Segment ${segments.length + 1}`, color, visible: true };
    setSegments(prev => [...prev, seg]);
    setActiveId(id);
    onActiveSegmentChange?.(seg);
  };

  const remove = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
      onActiveSegmentChange?.(null);
    }
  };

  const toggle = (id: string) => {
    setSegments(prev =>
      prev.map(s => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const rename = (id: string, name: string) => {
    setSegments(prev => prev.map(s => (s.id === id ? { ...s, name } : s)));
  };

  const select = (seg: Segment) => {
    setActiveId(seg.id);
    onActiveSegmentChange?.(seg);
  };

  const clearAll = () => {
    setSegments([]);
    setActiveId(null);
    onActiveSegmentChange?.(null);
  };

  const activeSeg = segments.find(s => s.id === activeId);

  return (
    <div className="flex flex-col p-3 text-xs">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold uppercase tracking-wide text-gray-300">Label Map</span>
        <div className="flex gap-1">
          <button
            onClick={addSegment}
            className="rounded bg-blue-700 px-2 py-0.5 text-white hover:bg-blue-600"
          >
            + Add
          </button>
          {segments.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded bg-gray-700 px-2 py-0.5 text-gray-300 hover:bg-red-800 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {segments.length === 0 && (
        <p className="text-gray-600">No segments. Click + Add to create a label.</p>
      )}

      {/* Segment rows */}
      {segments.map(seg => (
        <div
          key={seg.id}
          onClick={() => select(seg)}
          className={`mb-1 flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 ${
            activeId === seg.id
              ? 'bg-gray-700 ring-1 ring-blue-500'
              : 'bg-gray-800 hover:bg-gray-700'
          } ${!seg.visible ? 'opacity-50' : ''}`}
        >
          {/* Color swatch */}
          <div
            className="h-3 w-3 flex-shrink-0 rounded-sm border border-gray-600"
            style={{ backgroundColor: seg.color }}
          />
          {/* Editable name */}
          <input
            className="min-w-0 flex-1 truncate bg-transparent text-gray-200 outline-none"
            value={seg.name}
            onChange={e => rename(seg.id, e.target.value)}
            onClick={e => e.stopPropagation()}
          />
          {/* Visibility toggle */}
          <button
            title={seg.visible ? 'Hide segment' : 'Show segment'}
            onClick={e => {
              e.stopPropagation();
              toggle(seg.id);
            }}
            className="w-5 text-center text-gray-400 hover:text-white"
          >
            {seg.visible ? '●' : '○'}
          </button>
          {/* Remove */}
          <button
            onClick={e => {
              e.stopPropagation();
              remove(seg.id);
            }}
            className="text-gray-600 hover:text-red-400"
          >
            ×
          </button>
        </div>
      ))}

      {/* Active segment summary */}
      {activeSeg && (
        <div className="mt-3 border-t border-gray-700 pt-2">
          <div className="mb-1 text-gray-500">Active segment</div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: activeSeg.color }}
            />
            <span className="text-gray-200">{activeSeg.name}</span>
          </div>
          <div className="mt-1 font-mono text-gray-600">{activeSeg.color}</div>
        </div>
      )}
    </div>
  );
}
