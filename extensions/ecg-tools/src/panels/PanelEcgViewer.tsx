import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { utils } from '@ohif/core';
import {
  bazettQTc,
  heartRate,
  qrsAxis,
  pxToMs,
  pxToMv,
  rrVariance,
  type EcgCalibration,
} from '../utils/ecgCalculations';
import SegmentLabelPanel, { type Segment } from '../../../../platform/app/src/components/SegmentLabelPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool =
  | 'CALIBRATE_H'
  | 'CALIBRATE_V'
  | 'TIME'
  | 'AMPLITUDE'
  | 'RR_INTERVAL'
  | 'QT_INTERVAL'
  | 'QTC'
  | 'QRS_AXIS'
  | 'LABEL';

type LayoutMode = 1 | 2 | 4;

interface Point { x: number; y: number; }

interface Measurement {
  id: string;
  tool: Tool;
  points: Point[];
  label: string;
  value: string;
  color: string;
}

interface LabelStroke {
  id: string;
  segmentId: string;
  segmentName: string;
  color: string;
  points: Point[];
  lineWidth: number;
}

interface EcgImage {
  id: string;
  img: HTMLImageElement;
  name: string;
  canvasW: number;
  canvasH: number;
  scale: number;
}

interface PanelData {
  image: EcgImage | null;
  measurements: Measurement[];
  rrIntervals: number[];
  qtMs: number | null;
  rrMsForQtc: number | null;
  labelStrokes: LabelStroke[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOL_COLORS: Record<Tool, string> = {
  CALIBRATE_H: '#f59e0b',
  CALIBRATE_V: '#10b981',
  TIME:        '#60a5fa',
  AMPLITUDE:   '#a78bfa',
  RR_INTERVAL: '#34d399',
  QT_INTERVAL: '#f87171',
  QTC:         '#fb923c',
  QRS_AXIS:    '#f472b6',
  LABEL:       '#ffffff',
};

const TOOL_LABELS: Record<Tool, string> = {
  CALIBRATE_H: 'Calibrate Time',
  CALIBRATE_V: 'Calibrate mV',
  TIME:        'Time (ms)',
  AMPLITUDE:   'Amplitude (mV)',
  RR_INTERVAL: 'RR / HR',
  QT_INTERVAL: 'QT Interval',
  QTC:         'QTc (Bazett)',
  QRS_AXIS:    'QRS Axis',
  LABEL:       'Label Brush',
};

const BRUSH_SIZES = [4, 8, 14, 22];

const MAX_W = 1800;
const MAX_H = 1200;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = e.target?.result as string;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function scaleImage(img: HTMLImageElement): { w: number; h: number; scale: number } {
  const wRatio = MAX_W / img.width;
  const hRatio = MAX_H / img.height;
  const scale = Math.min(1, wRatio, hRatio);
  return { w: Math.round(img.width * scale), h: Math.round(img.height * scale), scale };
}

function emptyPanel(): PanelData {
  return { image: null, measurements: [], rrIntervals: [], qtMs: null, rrMsForQtc: null, labelStrokes: [] };
}

// ─── Canvas Drawing ───────────────────────────────────────────────────────────

function drawLabelStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: LabelStroke[],
  currentStroke: { points: Point[]; color: string; lineWidth: number } | null
) {
  const all = currentStroke ? [...strokes, currentStroke] : strokes;
  all.forEach(stroke => {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  });
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  image: EcgImage | undefined | null,
  measurements: Measurement[],
  labelStrokes: LabelStroke[],
  currentStroke: { points: Point[]; color: string; lineWidth: number } | null,
  pendingPoints: Point[],
  activeTool: Tool,
  fontSize: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (image) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image.img, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Label strokes drawn under measurements
  drawLabelStrokes(ctx, labelStrokes, currentStroke);

  measurements.forEach(m => drawMeasurement(ctx, m, fontSize));

  if (pendingPoints.length > 0) {
    const color = TOOL_COLORS[activeTool] || '#fff';
    pendingPoints.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`P${i + 1}`, pt.x, pt.y - 8);
    });
    if (pendingPoints.length === 2) {
      ctx.beginPath();
      ctx.moveTo(pendingPoints[0].x, pendingPoints[0].y);
      ctx.lineTo(pendingPoints[1].x, pendingPoints[1].y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawMeasurement(ctx: CanvasRenderingContext2D, m: Measurement, fontSize: number) {
  const pts = m.points;
  ctx.strokeStyle = m.color;
  ctx.fillStyle = m.color;
  ctx.lineWidth = 1.5;
  ctx.font = `${fontSize}px sans-serif`;

  if (pts.length === 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    pts.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    const mx = (pts[0].x + pts[1].x) / 2;
    const my = (pts[0].y + pts[1].y) / 2 - 10;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const textW = ctx.measureText(m.value).width;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mx - textW / 2 - 4, my - fontSize, textW + 8, fontSize + 4);
    ctx.fillStyle = m.color;
    ctx.textAlign = 'center';
    ctx.fillText(m.value, mx, my);
  } else if (pts.length === 4) {
    [[pts[0], pts[1]], [pts[2], pts[3]]].forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    const mx = (pts[1].x + pts[3].x) / 2;
    const my = Math.min(pts[1].y, pts[3].y) - 10;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const textW = ctx.measureText(m.value).width;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mx - textW / 2 - 4, my - fontSize, textW + 8, fontSize + 4);
    ctx.fillStyle = m.color;
    ctx.textAlign = 'center';
    ctx.fillText(m.value, mx, my);
  }
}

// ─── Single ECG Panel ─────────────────────────────────────────────────────────

interface EcgCanvasPanelProps {
  panelIdx: number;
  data: PanelData;
  onDataChange: (data: PanelData) => void;
  isActive: boolean;
  onActivate: () => void;
  activeTool: Tool;
  activeSegment: Segment | null;
  brushSize: number;
  calibration: EcgCalibration;
  onCalibrate: (type: 'H' | 'V', pxPerUnit: number) => void;
  calInputMs: string;
  calInputMv: string;
}

function EcgCanvasPanel({
  panelIdx,
  data,
  onDataChange,
  isActive,
  onActivate,
  activeTool,
  activeSegment,
  brushSize,
  calibration,
  onCalibrate,
  calInputMs,
  calInputMv,
}: EcgCanvasPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pendingPoints, setPendingPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  const { image, measurements, labelStrokes } = data;
  const fontSize = Math.round(11 * Math.sqrt(zoom));

  // Redraw canvas whenever data or tool changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (image) {
      canvas.width = Math.round(image.canvasW * zoom);
      canvas.height = Math.round(image.canvasH * zoom);
    } else {
      canvas.width = 600;
      canvas.height = 300;
    }
    const liveStroke = isDrawing && currentStroke.length >= 2 && activeSegment
      ? { points: currentStroke, color: activeSegment.color, lineWidth: brushSize * zoom }
      : null;
    drawCanvas(canvas, image, measurements, labelStrokes, liveStroke, pendingPoints, activeTool, fontSize);
  }, [image, measurements, labelStrokes, pendingPoints, activeTool, zoom, isDrawing, currentStroke, activeSegment, brushSize, fontSize]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const img = await loadImage(file);
    const { w, h, scale } = scaleImage(img);
    onDataChange({ ...data, image: { id: utils.uuidv4(), img, name: file.name, canvasW: w, canvasH: h, scale } });
    if (e.target) e.target.value = '';
  }, [data, onDataChange]);

  const getCanvasPt = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  // ── Label brush mouse handlers ──
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    onActivate();
    if (activeTool !== 'LABEL' || !image || !activeSegment) return;
    e.preventDefault();
    setIsDrawing(true);
    setCurrentStroke([getCanvasPt(e)]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'LABEL' || !activeSegment) return;
    setCurrentStroke(prev => [...prev, getCanvasPt(e)]);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeSegment) return;
    setIsDrawing(false);
    if (currentStroke.length >= 2) {
      const stroke: LabelStroke = {
        id: utils.uuidv4(),
        segmentId: activeSegment.id,
        segmentName: activeSegment.name,
        color: activeSegment.color,
        points: currentStroke,
        lineWidth: brushSize * zoom,
      };
      onDataChange({ ...data, labelStrokes: [...labelStrokes, stroke] });
    }
    setCurrentStroke([]);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    onActivate();
    // Label tool uses mousedown/move/up — skip click handler
    if (activeTool === 'LABEL') return;
    if (!image) return;
    const pt = getCanvasPt(e);
    const tool = activeTool;
    const pending = [...pendingPoints, pt];

    const commit = (m: Measurement, extra?: Partial<PanelData>) => {
      onDataChange({ ...data, measurements: [...data.measurements, m], ...extra });
      setPendingPoints([]);
    };

    if (tool === 'CALIBRATE_H' && pending.length === 2) {
      const dx = Math.abs(pending[1].x - pending[0].x);
      const knownMs = parseFloat(calInputMs) || 200;
      onCalibrate('H', dx / knownMs);
      commit({ id: utils.uuidv4(), tool, points: pending, label: 'Cal-H', color: TOOL_COLORS[tool], value: `${knownMs}ms` });
      return;
    }

    if (tool === 'CALIBRATE_V' && pending.length === 2) {
      const dy = Math.abs(pending[1].y - pending[0].y);
      const knownMv = parseFloat(calInputMv) || 1.0;
      onCalibrate('V', dy / knownMv);
      commit({ id: utils.uuidv4(), tool, points: pending, label: 'Cal-V', color: TOOL_COLORS[tool], value: `${knownMv}mV` });
      return;
    }

    if ((tool === 'TIME' || tool === 'RR_INTERVAL' || tool === 'QT_INTERVAL' || tool === 'QTC') && pending.length === 2) {
      const dx = Math.abs(pending[1].x - pending[0].x);
      const ms = pxToMs(dx, calibration);
      let valueStr = `${ms} ms`;
      let extra: Partial<PanelData> = {};

      if (tool === 'RR_INTERVAL') {
        const hr = heartRate(ms);
        valueStr = `RR: ${ms}ms | HR: ${hr.bpm} bpm`;
        extra = { rrIntervals: [...data.rrIntervals, ms], rrMsForQtc: ms };
      } else if (tool === 'QT_INTERVAL') {
        valueStr = `QT: ${ms} ms`;
        extra = { qtMs: ms };
      } else if (tool === 'QTC') {
        extra = { qtMs: ms };
        valueStr = data.rrMsForQtc !== null
          ? `QTc: ${bazettQTc(ms, data.rrMsForQtc).qtcMs}ms (Bazett)`
          : `QT: ${ms}ms — measure RR next`;
      }
      commit({ id: utils.uuidv4(), tool, points: pending, label: '', color: TOOL_COLORS[tool], value: valueStr }, extra);
      return;
    }

    if (tool === 'AMPLITUDE' && pending.length === 2) {
      const dy = Math.abs(pending[1].y - pending[0].y);
      const mv = pxToMv(dy, calibration);
      commit({ id: utils.uuidv4(), tool, points: pending, label: 'A', color: TOOL_COLORS[tool], value: `${mv} mV` });
      return;
    }

    if (tool === 'QRS_AXIS' && pending.length === 4) {
      const leadI_dy = pending[0].y - pending[1].y;
      const avf_dy = pending[2].y - pending[3].y;
      const leadIMv = pxToMv(leadI_dy, calibration);
      const avfMv = pxToMv(avf_dy, calibration);
      const result = qrsAxis(leadIMv, avfMv);
      commit({ id: utils.uuidv4(), tool, points: pending, label: 'Axis', color: TOOL_COLORS[tool], value: `${result.axisDegrees}° ${result.interpretation}` });
      return;
    }

    setPendingPoints(pending);
  };

  const clearPanel = () => {
    onDataChange({ ...data, measurements: [], rrIntervals: [], qtMs: null, rrMsForQtc: null, labelStrokes: [] });
    setPendingPoints([]);
  };

  const removeImage = () => {
    onDataChange(emptyPanel());
    setPendingPoints([]);
  };

  const canvasCursor = activeTool === 'LABEL'
    ? (activeSegment ? 'crosshair' : 'not-allowed')
    : 'crosshair';

  return (
    <div
      className={`flex h-full flex-col overflow-hidden ${isActive ? 'ring-2 ring-inset ring-blue-500' : 'ring-1 ring-inset ring-gray-800'}`}
      onClick={onActivate}
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Panel header bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900/70 px-2 py-1">
        <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
          {image ? image.name.slice(0, 22) : `Panel ${panelIdx + 1}`}
        </span>
        {image && (
          <label className="flex items-center gap-1 text-xs text-gray-400">
            <input
              type="range" min={0.5} max={3} step={0.1} value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="w-14"
              onClick={e => e.stopPropagation()}
            />
            {zoom.toFixed(1)}×
          </label>
        )}
        {image && (
          <button onClick={e => { e.stopPropagation(); clearPanel(); }} className="text-xs text-gray-600 hover:text-yellow-400" title="Clear all">
            ⊘
          </button>
        )}
        {image && (
          <button onClick={e => { e.stopPropagation(); removeImage(); }} className="text-xs text-gray-600 hover:text-red-400" title="Remove image">
            ×
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className="rounded bg-emerald-800 px-2 py-0.5 text-xs text-white hover:bg-emerald-700"
        >
          {image ? 'Change' : '+ Upload'}
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex flex-1 flex-col overflow-auto bg-gray-950 p-2">
        {!image ? (
          <div
            className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-900 hover:border-blue-500"
            style={{ minHeight: '150px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="mb-2 h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-400">Click to upload ECG image</p>
            <p className="mt-1 text-xs text-gray-600">PNG · JPG · BMP</p>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="rounded border border-gray-700 shadow-lg"
              style={{ maxWidth: '100%', cursor: canvasCursor }}
            />
            {activeTool === 'LABEL' && !activeSegment && (
              <div className="mt-2 rounded bg-yellow-900/50 px-3 py-1.5 text-xs text-yellow-300">
                Select a segment in the Label Map tab to paint
              </div>
            )}
            {pendingPoints.length > 0 && (
              <div className="mt-2 rounded bg-blue-900/50 px-3 py-1.5 text-xs text-blue-200">
                {activeTool === 'QRS_AXIS'
                  ? `Point ${pendingPoints.length}/4 — Lead I baseline & peak, then aVF baseline & peak`
                  : `Point ${pendingPoints.length}/2 — click second point`}
                <button
                  onClick={e => { e.stopPropagation(); setPendingPoints([]); }}
                  className="ml-3 text-red-300 hover:text-red-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Results helper ───────────────────────────────────────────────────────────

function ResultRow({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Layout selector icons ────────────────────────────────────────────────────

const LAYOUT_OPTIONS: { mode: LayoutMode; label: string; title: string }[] = [
  { mode: 1, label: '▣', title: '1 panel' },
  { mode: 2, label: '▣▣', title: '2 panels' },
  { mode: 4, label: '⊞', title: '4 panels' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PanelEcgViewer() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(1);
  const [activePanelIdx, setActivePanelIdx] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('TIME');
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
  const [brushSize, setBrushSize] = useState(8);
  const [calibration, setCalibration] = useState<EcgCalibration>({ pxPerMs: 0.25, pxPerMv: 10 });
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calInputMs, setCalInputMs] = useState('200');
  const [calInputMv, setCalInputMv] = useState('1.0');
  const [rightTab, setRightTab] = useState<'results' | 'labels'>('results');

  const [panels, setPanels] = useState<PanelData[]>(() => [emptyPanel()]);

  const handlePanelDataChange = useCallback((idx: number, data: PanelData) => {
    setPanels(prev => prev.map((p, i) => (i === idx ? data : p)));
  }, []);

  const handleLayoutChange = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
    setPanels(prev =>
      prev.length >= mode
        ? prev
        : [...prev, ...Array.from({ length: mode - prev.length }, emptyPanel)]
    );
  }, []);

  const handleCalibrate = useCallback((type: 'H' | 'V', pxPerUnit: number) => {
    setCalibration(prev => ({
      pxPerMs: type === 'H' ? pxPerUnit : prev.pxPerMs,
      pxPerMv: type === 'V' ? pxPerUnit : prev.pxPerMv,
    }));
    setIsCalibrated(true);
  }, []);

  const activeData = panels[activePanelIdx] ?? panels[0];

  const qtcResult = useMemo(
    () =>
      activeData.qtMs !== null && activeData.rrMsForQtc !== null
        ? bazettQTc(activeData.qtMs, activeData.rrMsForQtc)
        : null,
    [activeData.qtMs, activeData.rrMsForQtc]
  );

  const rrVarianceResult = useMemo(
    () => (activeData.rrIntervals.length >= 2 ? rrVariance(activeData.rrIntervals) : null),
    [activeData.rrIntervals]
  );

  // Group label strokes by segment for the label map panel
  const strokesBySegment = useMemo(() => {
    const map = new Map<string, { segmentName: string; color: string; strokes: LabelStroke[] }>();
    activeData.labelStrokes.forEach(s => {
      if (!map.has(s.segmentId)) {
        map.set(s.segmentId, { segmentName: s.segmentName, color: s.color, strokes: [] });
      }
      map.get(s.segmentId)!.strokes.push(s);
    });
    return map;
  }, [activeData.labelStrokes]);

  const deleteStroke = useCallback((strokeId: string) => {
    const idx = activePanelIdx;
    setPanels(prev => prev.map((p, i) =>
      i === idx ? { ...p, labelStrokes: p.labelStrokes.filter(s => s.id !== strokeId) } : p
    ));
  }, [activePanelIdx]);

  const deleteSegmentStrokes = useCallback((segmentId: string) => {
    const idx = activePanelIdx;
    setPanels(prev => prev.map((p, i) =>
      i === idx ? { ...p, labelStrokes: p.labelStrokes.filter(s => s.segmentId !== segmentId) } : p
    ));
  }, [activePanelIdx]);

  const cols = layoutMode >= 2 ? 2 : 1;
  const rows = layoutMode === 4 ? 2 : 1;

  const toolBtn = (tool: Tool) => (
    <button
      key={tool}
      onClick={() => setActiveTool(tool)}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        activeTool === tool ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      }`}
      title={TOOL_LABELS[tool]}
    >
      {TOOL_LABELS[tool]}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-gray-950 text-white">

      {/* ── Top Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-2">
        <span className="text-sm font-bold text-green-400">ECG Tools</span>
        <div className="h-4 w-px bg-gray-700" />

        {/* Layout selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Layout:</span>
          {LAYOUT_OPTIONS.map(({ mode, label, title }) => (
            <button
              key={mode}
              onClick={() => handleLayoutChange(mode)}
              title={title}
              className={`rounded px-2 py-1 text-xs font-medium ${
                layoutMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-gray-700" />

        {/* Measurement tools */}
        {(['TIME', 'AMPLITUDE', 'RR_INTERVAL', 'QT_INTERVAL', 'QTC', 'QRS_AXIS'] as Tool[]).map(toolBtn)}
        <div className="h-4 w-px bg-gray-700" />

        {/* Label brush tool */}
        <button
          onClick={() => { setActiveTool('LABEL'); setRightTab('labels'); }}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            activeTool === 'LABEL' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          title="Label Brush — paint segments on ECG"
        >
          Label Brush
        </button>
        {activeTool === 'LABEL' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Size:</span>
            {BRUSH_SIZES.map(sz => (
              <button
                key={sz}
                onClick={() => setBrushSize(sz)}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  brushSize === sz ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={`${sz}px`}
              >
                <span style={{ display: 'block', width: sz / 2, height: sz / 2, borderRadius: '50%', background: 'currentColor' }} />
              </button>
            ))}
            {activeSegment && (
              <span className="ml-1 flex items-center gap-1 text-xs text-purple-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: activeSegment.color }} />
                {activeSegment.name}
              </span>
            )}
          </div>
        )}
        <div className="h-4 w-px bg-gray-700" />

        {/* Calibration */}
        {toolBtn('CALIBRATE_H')}
        {activeTool === 'CALIBRATE_H' && (
          <label className="flex items-center gap-1 text-xs text-yellow-300">
            Known time:
            <input type="number" value={calInputMs} onChange={e => setCalInputMs(e.target.value)}
              className="w-16 rounded bg-gray-700 px-1 py-0.5 text-white" />
            ms
          </label>
        )}
        {toolBtn('CALIBRATE_V')}
        {activeTool === 'CALIBRATE_V' && (
          <label className="flex items-center gap-1 text-xs text-green-300">
            Known amplitude:
            <input type="number" value={calInputMv} onChange={e => setCalInputMv(e.target.value)}
              className="w-16 rounded bg-gray-700 px-1 py-0.5 text-white" />
            mV
          </label>
        )}
      </div>

      {/* ── Calibration status ── */}
      <div className="flex items-center gap-4 border-b border-gray-800 bg-gray-900/60 px-4 py-1 text-xs">
        <span className={isCalibrated ? 'text-green-400' : 'text-yellow-400'}>
          {isCalibrated ? '✓ Calibrated' : '⚠ Using defaults — calibrate for clinical accuracy'}
        </span>
        <span className="text-gray-500">
          {(calibration.pxPerMs * 25).toFixed(2)} px/mm · {calibration.pxPerMv.toFixed(2)} px/mV
        </span>
        {layoutMode > 1 && (
          <span className="text-gray-500">Active: Panel {activePanelIdx + 1}</span>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ECG panel grid */}
        <div
          className="min-h-0 flex-1"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: '2px',
          }}
        >
          {Array.from({ length: layoutMode }, (_, i) => (
            <EcgCanvasPanel
              key={i}
              panelIdx={i}
              data={panels[i] ?? emptyPanel()}
              onDataChange={d => handlePanelDataChange(i, d)}
              isActive={activePanelIdx === i}
              onActivate={() => setActivePanelIdx(i)}
              activeTool={activeTool}
              activeSegment={activeSegment}
              brushSize={brushSize}
              calibration={calibration}
              onCalibrate={handleCalibrate}
              calInputMs={calInputMs}
              calInputMv={calInputMv}
            />
          ))}
        </div>

        {/* Right panel */}
        <div className="flex w-64 flex-col overflow-hidden border-l border-gray-800 bg-gray-900 text-xs">
          {/* Tab header */}
          <div className="flex shrink-0 border-b border-gray-800">
            <button
              onClick={() => setRightTab('results')}
              className={`flex-1 py-1.5 text-center text-xs font-medium ${
                rightTab === 'results' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Measurements
            </button>
            <button
              onClick={() => setRightTab('labels')}
              className={`flex-1 py-1.5 text-center text-xs font-medium ${
                rightTab === 'labels' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Label Map
            </button>
          </div>

          {rightTab === 'results' ? (
            <div className="flex flex-1 flex-col overflow-y-auto">
              {/* Computed results */}
              <div className="border-b border-gray-800 p-3">
                <div className="mb-2 font-bold uppercase tracking-wide text-gray-300">
                  {layoutMode > 1 ? `Panel ${activePanelIdx + 1} Results` : 'Computed Results'}
                </div>
                {qtcResult && (
                  <>
                    <ResultRow label="QTc (Bazett)" value={`${qtcResult.qtcMs} ms`} color="text-orange-300" />
                    <ResultRow label="QT" value={`${qtcResult.qtMs} ms`} />
                    <ResultRow label="RR" value={`${qtcResult.rrMs} ms`} />
                  </>
                )}
                {activeData.rrIntervals.length > 0 && (
                  <ResultRow label="HR" value={`${heartRate(activeData.rrIntervals[activeData.rrIntervals.length - 1]).bpm} bpm`} color="text-green-300" />
                )}
                {rrVarianceResult && (
                  <>
                    <ResultRow label="RR Mean" value={`${rrVarianceResult.mean} ms`} />
                    <ResultRow label="RR StdDev" value={`${rrVarianceResult.stdDev} ms`} />
                  </>
                )}
                {!qtcResult && !rrVarianceResult && activeData.rrIntervals.length === 0 && (
                  <p className="text-gray-600">No results yet.</p>
                )}
              </div>

              {/* Measurement log */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-2 font-bold uppercase tracking-wide text-gray-300">Placed Measurements</div>
                {activeData.measurements.length === 0 && (
                  <p className="text-gray-600">No measurements placed.</p>
                )}
                {activeData.measurements.map(m => (
                  <div key={m.id} className="mb-1.5 flex items-start justify-between rounded bg-gray-800 px-2 py-1.5">
                    <div>
                      <span className="font-medium" style={{ color: m.color }}>{TOOL_LABELS[m.tool]}</span>
                      <div className="mt-0.5 text-gray-200">{m.value}</div>
                    </div>
                    <button
                      onClick={() => handlePanelDataChange(activePanelIdx, {
                        ...activeData,
                        measurements: activeData.measurements.filter(x => x.id !== m.id),
                      })}
                      className="ml-2 text-gray-600 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Clinical reference */}
              <div className="shrink-0 border-t border-gray-800 p-3 text-gray-600">
                <div className="mb-1 font-bold uppercase tracking-wide">Normal Ranges</div>
                <div>QTc: &lt;440ms (M) / &lt;460ms (F)</div>
                <div>HR: 60–100 bpm</div>
                <div>QRS: &lt;120 ms</div>
                <div>PR: 120–200 ms</div>
                <div>QRS Axis: −30° to +90°</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Segment manager */}
              <div className="shrink-0 border-b border-gray-800">
                <SegmentLabelPanel onActiveSegmentChange={setActiveSegment} />
              </div>

              {/* Drawn label strokes for active panel */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-2 flex items-center justify-between font-bold uppercase tracking-wide text-gray-300">
                  <span>{layoutMode > 1 ? `Panel ${activePanelIdx + 1} Labels` : 'Drawn Labels'}</span>
                  {activeData.labelStrokes.length > 0 && (
                    <button
                      onClick={() => handlePanelDataChange(activePanelIdx, { ...activeData, labelStrokes: [] })}
                      className="text-gray-600 hover:text-red-400"
                      title="Clear all label strokes"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {activeData.labelStrokes.length === 0 && (
                  <p className="text-gray-600">
                    {activeSegment
                      ? 'Select Label Brush and draw on the ECG image.'
                      : 'Add a segment above, then select Label Brush to paint.'}
                  </p>
                )}

                {Array.from(strokesBySegment.entries()).map(([segId, { segmentName, color, strokes }]) => (
                  <div key={segId} className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium text-gray-200">{segmentName}</span>
                        <span className="text-gray-500">({strokes.length})</span>
                      </div>
                      <button
                        onClick={() => deleteSegmentStrokes(segId)}
                        className="text-gray-600 hover:text-red-400"
                        title={`Remove all ${segmentName} strokes`}
                      >
                        ×
                      </button>
                    </div>
                    {strokes.map((stroke, idx) => (
                      <div key={stroke.id} className="mb-0.5 flex items-center justify-between rounded bg-gray-800 px-2 py-1">
                        <span className="text-gray-400">Stroke {idx + 1} · {stroke.points.length} pts</span>
                        <button
                          onClick={() => deleteStroke(stroke.id)}
                          className="text-gray-600 hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
