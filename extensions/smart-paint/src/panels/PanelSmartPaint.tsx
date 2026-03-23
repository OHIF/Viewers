import React, { useRef, useState, useEffect, useCallback } from 'react';
import SmartPaintTool, {
  getPaintState,
  paintBrush,
  commitHistory,
  undo,
  redo,
  clearMask,
  renderMaskOverlay,
  maskToContour,
  countPaintedPixels,
  type SmartPaintConfig,
} from '../tools/SmartPaintTool';
import SegmentLabelPanel from '../../../../platform/app/src/components/SegmentLabelPanel';
import type { Segment } from '../../../../platform/app/src/components/SegmentLabelPanel';

// ── helpers ──────────────────────────────────────────────────────────────────
function hexToRgba(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.4)`;
}

interface Props {
  servicesManager?: Record<string, unknown>;
  commandsManager?: Record<string, unknown>;
  /** Optional: provided by ViewerHub to override brush color from the shared label panel */
  activeSegmentColor?: string;
}

export default function PanelSmartPaint({ servicesManager, activeSegmentColor }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig]         = useState<SmartPaintConfig>(SmartPaintTool.defaultConfig);
  const [isDrawing, setIsDrawing]   = useState(false);
  const [image, setImage]           = useState<HTMLImageElement | null>(null);
  const [imageKey, setImageKey]     = useState('default');
  const [contours, setContours]     = useState<Array<[number, number][]>>([]);
  const [mode, setMode]             = useState<'2D' | '3D'>('2D');
  const [eraseMode, setEraseMode]   = useState(false);
  const [canUndo, setCanUndo]       = useState(false);
  const [canRedo, setCanRedo]       = useState(false);
  const [statusMsg, setStatusMsg]   = useState('Upload an image to start painting');
  const [paintedPx, setPaintedPx]   = useState(0);

  // Sync external segment color (from Hub) into brush config
  useEffect(() => {
    if (activeSegmentColor !== undefined) {
      setConfig(c => ({ ...c, color: activeSegmentColor }));
    }
  }, [activeSegmentColor]);

  const getState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return getPaintState(imageKey, canvas.width, canvas.height);
  }, [imageKey]);

  const renderOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const state   = getState();
    if (!overlay || !state) return;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    renderMaskOverlay(ctx, state, config.color);
    contours.forEach(pts => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
      ctx.strokeStyle = '#00c8ff';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
    setPaintedPx(countPaintedPixels(state));
  }, [getState, config.color, contours]);

  useEffect(() => { renderOverlay(); }, [renderOverlay]);

  const updateUndoRedo = useCallback(() => {
    const state = getState();
    if (!state) return;
    setCanUndo(state.historyIndex > 0);
    setCanRedo(state.historyIndex < state.history.length - 1);
  }, [getState]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageKey(file.name + '_' + Date.now());
        setContours([]);
        const canvas  = canvasRef.current;
        const overlay = overlayRef.current;
        if (!canvas || !overlay) return;
        const maxW = 900, maxH = 600;
        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        canvas.width = overlay.width  = w;
        canvas.height = overlay.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        setStatusMsg(`Loaded: ${file.name} — select tool and paint`);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) };
  };

  const doPaint = useCallback((x: number, y: number) => {
    const state  = getState();
    const canvas = canvasRef.current;
    if (!state || !canvas) return;
    const ctx       = canvas.getContext('2d');
    const pixelData = ctx
      ? (ctx.getImageData(0, 0, canvas.width, canvas.height).data as Uint8ClampedArray)
      : null;
    paintBrush(state, x, y, config.brushRadius, config.sensitivity, pixelData, eraseMode);
    renderOverlay();
  }, [getState, config.brushRadius, config.sensitivity, eraseMode, renderOverlay]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    setIsDrawing(true);
    doPaint(getPos(e).x, getPos(e).y);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !image) return;
    doPaint(getPos(e).x, getPos(e).y);
  };
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const state = getState();
    if (state) { commitHistory(state); updateUndoRedo(); }
  };

  const handleUndo = () => {
    const state = getState();
    if (state && undo(state)) { renderOverlay(); updateUndoRedo(); }
  };
  const handleRedo = () => {
    const state = getState();
    if (state && redo(state)) { renderOverlay(); updateUndoRedo(); }
  };
  const handleClear = () => {
    clearMask(imageKey);
    setContours([]);
    renderOverlay();
    updateUndoRedo();
  };

  const handleExtractContour = () => {
    const state = getState();
    if (!state) return;
    const pts = maskToContour(state);
    if (pts.length > 0) {
      setContours(prev => [...prev, pts]);
      setStatusMsg(`Contour extracted: ${pts.length} boundary points`);
    } else {
      setStatusMsg('No painted region found. Paint first, then extract contour.');
    }
  };

  const handleClearContours = () => { setContours([]); renderOverlay(); };

  // Callback for the standalone (non-Hub) internal label panel
  const handleInternalSegmentChange = (seg: Segment | null) => {
    setConfig(c => ({
      ...c,
      color: seg ? hexToRgba(seg.color) : SmartPaintTool.defaultConfig.color,
    }));
  };

  return (
    <div className="flex h-full flex-col bg-gray-950 text-white">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-2">
        <span className="text-sm font-bold text-cyan-400">Smart Paint</span>
        <div className="h-4 w-px bg-gray-700" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium hover:bg-emerald-600"
        >
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />

        <div className="h-4 w-px bg-gray-700" />

        {/* 2D / 3D mode */}
        {(['2D', '3D'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setConfig(c => ({ ...c, mode: m })); }}
            className={`rounded px-2 py-1 text-xs ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {m}
          </button>
        ))}

        {/* Paint / Erase */}
        <button
          onClick={() => setEraseMode(e => !e)}
          className={`rounded px-2 py-1 text-xs ${eraseMode ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          {eraseMode ? 'Erase' : 'Paint'}
        </button>

        <div className="h-4 w-px bg-gray-700" />

        {/* Brush radius */}
        <label className="flex items-center gap-1 text-xs text-gray-300">
          Brush:
          <input
            type="range" min={3} max={60} value={config.brushRadius}
            onChange={e => setConfig(c => ({ ...c, brushRadius: +e.target.value }))}
            className="w-20"
          />
          {config.brushRadius}px
        </label>

        {/* Sensitivity */}
        <label className="flex items-center gap-1 text-xs text-gray-300">
          Sensitivity:
          <input
            type="range" min={0} max={100} value={config.sensitivity}
            onChange={e => setConfig(c => ({ ...c, sensitivity: +e.target.value }))}
            className="w-20"
          />
          {config.sensitivity}%
        </label>

        <div className="h-4 w-px bg-gray-700" />

        {/* Undo / Redo / Clear */}
        <button onClick={handleUndo} disabled={!canUndo}
          className="rounded bg-gray-700 px-2 py-1 text-xs disabled:opacity-40 hover:bg-gray-600">
          Undo
        </button>
        <button onClick={handleRedo} disabled={!canRedo}
          className="rounded bg-gray-700 px-2 py-1 text-xs disabled:opacity-40 hover:bg-gray-600">
          Redo
        </button>
        <button onClick={handleClear}
          className="rounded bg-red-800 px-2 py-1 text-xs hover:bg-red-700">
          Clear
        </button>

        <div className="h-4 w-px bg-gray-700" />

        {/* Extract contour */}
        <button
          onClick={handleExtractContour}
          className="rounded bg-cyan-700 px-3 py-1 text-xs font-medium hover:bg-cyan-600"
        >
          Extract Contour
        </button>
        {contours.length > 0 && (
          <button onClick={handleClearContours}
            className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600">
            Clear Contours ({contours.length})
          </button>
        )}

        {/* Active color swatch */}
        <div
          className="ml-auto h-5 w-5 rounded border border-gray-600 flex-shrink-0"
          style={{ backgroundColor: config.color }}
          title={`Brush color: ${config.color}`}
        />
      </div>

      {/* ── Status bar ── */}
      <div className="border-b border-gray-800 bg-gray-900/60 px-4 py-1 text-xs text-gray-400">
        {statusMsg}
        {image && (
          <span className="ml-4 text-gray-600">
            Mode: {mode} · Brush: {config.brushRadius}px · Sensitivity: {config.sensitivity}%
            {contours.length > 0 && ` · ${contours.length} contour(s)`}
          </span>
        )}
        {image && paintedPx > 0 && (
          <span className="ml-4 font-semibold text-cyan-400">
            Area: {paintedPx.toLocaleString()} px²
          </span>
        )}
      </div>

      {/* ── Main body: canvas + right segmentation panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas area */}
        <div className="flex flex-1 items-start justify-center overflow-auto bg-gray-950 p-4">
          {!image ? (
            <div
              className="flex h-64 w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-900 hover:border-cyan-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="mb-3 h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-400">Upload a DICOM screenshot or medical image</p>
              <p className="mt-1 text-xs text-gray-600">PNG, JPG, BMP supported</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="relative" style={{ userSelect: 'none' }}>
                {/* Base image canvas */}
                <canvas ref={canvasRef} className="block rounded" />
                {/* Paint overlay canvas */}
                <canvas
                  ref={overlayRef}
                  className="absolute left-0 top-0 rounded"
                  style={{
                    cursor: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${config.brushRadius * 2}' height='${config.brushRadius * 2}'><circle cx='${config.brushRadius}' cy='${config.brushRadius}' r='${config.brushRadius - 1}' fill='none' stroke='%2300c8ff' stroke-width='2'/></svg>") ${config.brushRadius} ${config.brushRadius}, crosshair`,
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              {/* Area readout */}
              {paintedPx > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-cyan-800 bg-gray-900 px-4 py-1.5 text-sm">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: config.color }} />
                  <span className="text-gray-400">Painted Area:</span>
                  <span className="font-bold text-cyan-300">{paintedPx.toLocaleString()} px²</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel: Label Map — shown only in standalone mode (no external Hub color) */}
        {activeSegmentColor === undefined && (
          <div className="flex w-52 flex-col overflow-y-auto border-l border-gray-800 bg-gray-900">
            <div className="border-b border-gray-800 px-3 py-2">
              <div className="text-xs font-bold uppercase tracking-wide text-blue-400">Segmentation</div>
              <div className="mt-0.5 text-xs text-gray-500">Select a segment to set brush color</div>
            </div>
            <SegmentLabelPanel onActiveSegmentChange={handleInternalSegmentChange} />
          </div>
        )}

      </div>

      {/* ── Bottom contour info strip ── */}
      {contours.length > 0 && (
        <div className="border-t border-gray-800 bg-gray-900 px-4 py-2 text-xs text-gray-400">
          <span className="font-semibold text-cyan-400">Contours extracted:</span>{' '}
          {contours.map((c, i) => (
            <span key={i} className="mr-3">[{i + 1}] {c.length} points</span>
          ))}
        </div>
      )}

    </div>
  );
}
