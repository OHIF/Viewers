import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, PanelSection } from '@ohif/ui-next';

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_SELECTED_POINTS = 4;
const SMALL_BOX_SECONDS = 0.04; // 1 mm at 25 mm/s
const LARGE_BOX_SECONDS = 0.2;  // 5 mm (1 large box)
const MAX_RR_HRV = 6;

const POINT_NAMES = ['A', 'B', 'C', 'D'];

const POINT_GUIDE = [
  { name: 'A', desc: 'P-wave onset', color: 'text-blue-400' },
  { name: 'B', desc: 'QRS onset (end of PR)', color: 'text-green-400' },
  { name: 'C', desc: 'QRS end / J-point', color: 'text-yellow-400' },
  { name: 'D', desc: 'T-wave end', color: 'text-orange-400' },
];

const ECG_INTERVAL_DEFS: Record<
  string,
  { name: string; desc: string; min: number | null; max: number | null; shortNote: string | null; longNote: string | null }
> = {
  AB: {
    name: 'PR Interval',
    desc: 'P-onset → QRS-onset  (atrial depolarization + AV conduction)',
    min: 120, max: 200,
    shortNote: 'Short PR (<120 ms): pre-excitation (WPW), junctional rhythm',
    longNote: 'Long PR (>200 ms): 1st degree AV block',
  },
  BC: {
    name: 'QRS Duration',
    desc: 'QRS-onset → J-point  (ventricular depolarization)',
    min: 60, max: 100,
    shortNote: null,
    longNote: 'Wide QRS (>120 ms): bundle branch block or ventricular rhythm',
  },
  CD: {
    name: 'ST-T Segment',
    desc: 'J-point → T-wave end  (early repolarization phase)',
    min: null, max: null, shortNote: null, longNote: null,
  },
  BD: {
    name: 'QT Interval',
    desc: 'QRS-onset → T-wave end  (total ventricular electrical activity)',
    min: 350, max: 440,
    shortNote: 'Short QT (<350 ms): short QT syndrome, hypercalcemia',
    longNote: 'Long QT (>440 ms): risk of torsades de pointes; >500 ms critical',
  },
};

// ── Types ──────────────────────────────────────────────────────────────────────

type Gender = 'male' | 'female';

type ChartPoint = {
  x: number;
  y: number;
  seriesIndex: number;
  pointIndex: number;
  seriesLabel?: string;
};

type IntervalResult = {
  key: string;
  from: string;
  to: string;
  ms: number;
  seconds: number;
  smallBoxes: number;
  largeBoxes: number;
  amplitudeDelta: number;
  areaUnderCurve: number | null;
  timeUnit: string;
};

type HRVStats = {
  meanRR: number;
  meanHR: number;
  sdnn: number;
  rmssd: number;
  pNN50: number;
};

// ── QTc thresholds ─────────────────────────────────────────────────────────────

const QTC_THRESHOLDS: Record<Gender, { normal: number; borderline: number; prolonged: number }> = {
  male:   { normal: 440, borderline: 460, prolonged: 460 },
  female: { normal: 460, borderline: 470, prolonged: 470 },
};

const PROLONGED_CAUSES = [
  'Amiodarone', 'Haloperidol', 'Sotalol', 'Azithromycin',
  'Hypokalemia', 'Hypomagnesemia', 'Congenital long QT syndrome',
];

// ── Pure helpers ───────────────────────────────────────────────────────────────

function fmt(value: number, digits = 1): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

function getChartDisplaySet(displaySetService) {
  return displaySetService
    .getActiveDisplaySets()
    .find(ds => ds?.instance?.chartData?.series?.length);
}

function parseTimeUnit(label = ''): string {
  const match = label.match(/\(([^)]+)\)/);
  return match?.[1]?.trim().toLowerCase() || 's';
}

function parseAmplitudeUnit(label = ''): string {
  const match = label.match(/\(([^)]+)\)/);
  return match?.[1]?.trim() || 'mV';
}

function toSeconds(value: number, unit: string): number {
  switch (unit) {
    case 'ms': return value / 1000;
    case 's':  return value;
    case 'm':  return value * 60;
    case 'h':  return value * 3600;
    default:   return value;
  }
}

// Series points are [x, y] tuples (confirmed from d3LineChart source)
function getSeriesXY(series: any[], seriesIndex: number): { x: number; y: number }[] {
  const pts = series?.[seriesIndex]?.points;
  if (!Array.isArray(pts)) return [];
  return pts.map(p => ({ x: p[0], y: p[1] }));
}

// Trapezoidal area, x values in raw series units
function computeArea(seriesData: { x: number; y: number }[], x1: number, x2: number): number {
  const xMin = Math.min(x1, x2);
  const xMax = Math.max(x1, x2);
  const pts = seriesData.filter(p => p.x >= xMin && p.x <= xMax).sort((a, b) => a.x - b.x);
  if (pts.length < 2) return 0;
  let area = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    area += ((pts[i].y + pts[i + 1].y) / 2) * (pts[i + 1].x - pts[i].x);
  }
  return area;
}

function buildInterval(
  from: ChartPoint,
  to: ChartPoint,
  fromName: string,
  toName: string,
  timeUnit: string,
  seriesData?: { x: number; y: number }[]
): IntervalResult {
  const deltaX = Math.abs(to.x - from.x);
  const seconds = toSeconds(deltaX, timeUnit);
  const rawArea = seriesData ? computeArea(seriesData, from.x, to.x) : null;
  // Convert area x-dimension to seconds for consistent mV·s unit
  const areaUnderCurve = rawArea !== null ? rawArea * toSeconds(1, timeUnit) : null;
  return {
    key: `${fromName}${toName}`,
    from: fromName,
    to: toName,
    ms: seconds * 1000,
    seconds,
    smallBoxes: seconds / SMALL_BOX_SECONDS,
    largeBoxes: seconds / LARGE_BOX_SECONDS,
    amplitudeDelta: Math.abs(to.y - from.y),
    areaUnderCurve,
    timeUnit,
  };
}

function getIntervalStatus(key: string, ms: number) {
  const def = ECG_INTERVAL_DEFS[key];
  if (!def || def.min === null) return null;
  if (ms < def.min) return { label: '↓ Short', note: def.shortNote, color: 'text-yellow-400' };
  if (ms > def.max) return { label: '↑ Long', note: def.longNote, color: 'text-red-400' };
  return { label: '✓ Normal', note: `Normal range: ${def.min}–${def.max} ms`, color: 'text-green-400' };
}

function qtcBazett(qtSec: number, rrSec: number): number | null {
  if (!Number.isFinite(qtSec) || !Number.isFinite(rrSec) || rrSec <= 0) return null;
  return (qtSec / Math.sqrt(rrSec)) * 1000;
}

function qtcFridericia(qtSec: number, rrSec: number): number | null {
  if (!Number.isFinite(qtSec) || !Number.isFinite(rrSec) || rrSec <= 0) return null;
  return (qtSec / Math.cbrt(rrSec)) * 1000;
}

function qtcStatusLabel(ms: number, gender: Gender): { text: string; color: string; badge: string } {
  const t = QTC_THRESHOLDS[gender];
  if (ms > 500)
    return { text: 'Critical — immediate action required', badge: 'CRITICAL', color: 'text-red-500' };
  if (ms > t.prolonged)
    return { text: `Prolonged (>${t.prolonged} ms) — high arrhythmia risk`, badge: 'PROLONGED', color: 'text-red-400' };
  if (ms > t.normal)
    return { text: `Borderline (${t.normal}–${t.prolonged} ms) — monitor`, badge: 'BORDERLINE', color: 'text-yellow-400' };
  return { text: `Normal (<${t.normal} ms) — no concern`, badge: 'NORMAL', color: 'text-green-400' };
}

// QRS Axis: atan2(aVF, Lead-I)
function computeQrsAxis(leadI: number, leadAvF: number): { degrees: number; label: string; color: string } {
  const rad = Math.atan2(leadAvF, leadI);
  const degrees = rad * (180 / Math.PI);
  if (degrees >= -30 && degrees <= 90)
    return { degrees, label: 'Normal axis (-30° to +90°)', color: 'text-green-400' };
  if (degrees > -90 && degrees < -30)
    return { degrees, label: 'Left axis deviation (LAD)', color: 'text-yellow-400' };
  if (degrees > 90 && degrees <= 180)
    return { degrees, label: 'Right axis deviation (RAD)', color: 'text-orange-400' };
  return { degrees, label: 'Extreme axis deviation', color: 'text-red-400' };
}

// HRV from array of RR intervals (ms)
function computeHRV(intervals: number[]): HRVStats | null {
  const valid = intervals.filter(v => Number.isFinite(v) && v > 200 && v < 3000);
  if (valid.length < 2) return null;
  const n = valid.length;
  const meanRR = valid.reduce((s, v) => s + v, 0) / n;
  const meanHR = 60000 / meanRR;
  const sdnn = Math.sqrt(valid.reduce((s, v) => s + (v - meanRR) ** 2, 0) / n);
  const diffs = valid.slice(1).map((v, i) => v - valid[i]);
  const rmssd = diffs.length > 0
    ? Math.sqrt(diffs.reduce((s, d) => s + d * d, 0) / diffs.length)
    : 0;
  const nn50 = diffs.filter(d => Math.abs(d) > 50).length;
  const pNN50 = diffs.length > 0 ? (nn50 / diffs.length) * 100 : 0;
  return { meanRR, meanHR, sdnn, rmssd, pNN50 };
}

function sdnnInterpretation(sdnn: number): { label: string; color: string } {
  if (sdnn < 20) return { label: 'Very poor HRV', color: 'text-red-400' };
  if (sdnn < 50) return { label: 'Poor HRV', color: 'text-orange-400' };
  if (sdnn < 100) return { label: 'Moderate HRV', color: 'text-yellow-400' };
  return { label: 'Good HRV', color: 'text-green-400' };
}

// Per-series amplitude stats
function computeSeriesStats(pts: { x: number; y: number }[]) {
  if (!pts.length) return null;
  const ys = pts.map(p => p.y);
  const xs = pts.map(p => p.x);
  const maxY = Math.max(...ys);
  const minY = Math.min(...ys);
  const xRange = Math.max(...xs) - Math.min(...xs);
  return { maxY, minY, peakToPeak: maxY - minY, xRange };
}

// ─────────────────────────────────────────────────────────────────────────────

function ECGViewerPanel({ servicesManager }: withAppTypes) {
  const { displaySetService } = servicesManager.services;

  const [chartDisplaySet, setChartDisplaySet] = useState(() =>
    getChartDisplaySet(displaySetService)
  );
  const [selectedPoints, setSelectedPoints] = useState<ChartPoint[]>([]);

  // QTc
  const [rrMs, setRrMs] = useState('');
  const [hrBpm, setHrBpm] = useState('');
  const [manualQtMs, setManualQtMs] = useState('');
  const [gender, setGender] = useState<Gender>('male');

  // HRV
  const [rrEntries, setRrEntries] = useState<string[]>(Array(MAX_RR_HRV).fill(''));

  // QRS Axis
  const [qrsLeadI, setQrsLeadI] = useState('');
  const [qrsLeadAvF, setQrsLeadAvF] = useState('');

  useEffect(() => {
    const sync = () => setChartDisplaySet(getChartDisplaySet(displaySetService));
    sync();
    const s1 = displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_ADDED, sync);
    const s2 = displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_CHANGED, sync);
    return () => { s1.unsubscribe(); s2.unsubscribe(); };
  }, [displaySetService]);

  useEffect(() => {
    setSelectedPoints([]);
    setRrMs(''); setHrBpm(''); setManualQtMs('');
  }, [chartDisplaySet?.displaySetInstanceUID]);

  const chartData = chartDisplaySet?.instance?.chartData;
  const axis = chartData?.axis;
  const series = chartData?.series;
  const timeUnit = parseTimeUnit(axis?.x?.label);
  const ampUnit = parseAmplitudeUnit(axis?.y?.label);

  const orderedPoints = useMemo(
    () => [...selectedPoints].sort((a, b) => a.x - b.x),
    [selectedPoints]
  );

  const consecutiveIntervals: IntervalResult[] = useMemo(() => {
    if (orderedPoints.length < 2) return [];
    return orderedPoints.slice(0, -1).map((pt, i) => {
      const seriesData = series ? getSeriesXY(series, pt.seriesIndex) : undefined;
      return buildInterval(pt, orderedPoints[i + 1], POINT_NAMES[i], POINT_NAMES[i + 1], timeUnit, seriesData);
    });
  }, [orderedPoints, timeUnit, series]);

  const qtInterval: IntervalResult | null = useMemo(() => {
    if (orderedPoints.length < 4) return null;
    const seriesData = series ? getSeriesXY(series, orderedPoints[1].seriesIndex) : undefined;
    return buildInterval(orderedPoints[1], orderedPoints[3], 'B', 'D', timeUnit, seriesData);
  }, [orderedPoints, timeUnit, series]);

  const rrSec = useMemo(() => {
    const val = parseFloat(rrMs);
    return Number.isFinite(val) && val > 0 ? val / 1000 : null;
  }, [rrMs]);

  const manualQtSec = useMemo(() => {
    const val = parseFloat(manualQtMs);
    return Number.isFinite(val) && val > 0 ? val / 1000 : null;
  }, [manualQtMs]);

  const qtSec = qtInterval?.seconds ?? manualQtSec;
  const bazett = useMemo(() => qtcBazett(qtSec, rrSec), [qtSec, rrSec]);
  const fridericia = useMemo(() => qtcFridericia(qtSec, rrSec), [qtSec, rrSec]);
  const bazettStatus = useMemo(
    () => (bazett !== null ? qtcStatusLabel(bazett, gender) : null),
    [bazett, gender]
  );
  const fridericiaStatus = useMemo(
    () => (fridericia !== null ? qtcStatusLabel(fridericia, gender) : null),
    [fridericia, gender]
  );

  const hrvStats = useMemo(() => {
    const vals = rrEntries.map(v => parseFloat(v)).filter(v => Number.isFinite(v) && v > 0);
    return computeHRV(vals);
  }, [rrEntries]);

  const qrsAxis = useMemo(() => {
    const i = parseFloat(qrsLeadI);
    const avf = parseFloat(qrsLeadAvF);
    if (!Number.isFinite(i) || !Number.isFinite(avf)) return null;
    return computeQrsAxis(i, avf);
  }, [qrsLeadI, qrsLeadAvF]);

  const allSeriesStats = useMemo(() => {
    if (!series?.length) return [];
    return series
      .map((s: any, idx: number) => {
        const pts = getSeriesXY(series, idx);
        const stats = computeSeriesStats(pts);
        return stats ? { label: s.label || `Lead ${idx + 1}`, ...stats } : null;
      })
      .filter(Boolean);
  }, [series]);

  const handleRrInput = (val: string) => {
    setRrMs(val);
    const ms = parseFloat(val);
    setHrBpm(Number.isFinite(ms) && ms > 0 ? fmt(60000 / ms, 0) : '');
  };

  const handleHrInput = (val: string) => {
    setHrBpm(val);
    const hr = parseFloat(val);
    setRrMs(Number.isFinite(hr) && hr > 0 ? fmt(60000 / hr, 0) : '');
  };

  const handlePointClick = (point: ChartPoint) => {
    setSelectedPoints(prev => {
      const id = `${point.seriesIndex}-${point.pointIndex}`;
      const existingIdx = prev.findIndex(p => `${p.seriesIndex}-${p.pointIndex}` === id);
      if (existingIdx !== -1) return prev.filter((_, i) => i !== existingIdx);
      if (prev.length >= MAX_SELECTED_POINTS) return prev;
      return [...prev, { ...point, seriesLabel: series?.[point.seriesIndex]?.label }];
    });
  };

  const nextPointHint =
    selectedPoints.length === 0 ? 'Place point A at P-wave onset.' :
    selectedPoints.length === 1 ? 'Place point B at QRS onset (end of PR interval).' :
    selectedPoints.length === 2 ? 'Place point C at QRS end / J-point.' :
                                   'Place point D at T-wave end.';

  // ── Interval card ──────────────────────────────────────────────────────────

  const renderIntervalCard = (iv: IntervalResult, highlight = false) => {
    const def = ECG_INTERVAL_DEFS[iv.key];
    const status = getIntervalStatus(iv.key, iv.ms);
    return (
      <div
        key={iv.key}
        className={`rounded border px-3 py-2 text-sm ${
          highlight
            ? 'border-indigo-500/40 bg-indigo-900/20'
            : 'border-white/10 bg-black/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className={`font-semibold ${highlight ? 'text-indigo-300' : ''}`}>
              {iv.from} → {iv.to}
            </span>
            {def && <span className="ml-1.5 text-xs text-white/55">{def.name}</span>}
          </div>
          <span className="text-base font-bold text-white">{fmt(iv.ms, 0)} ms</span>
        </div>
        {def && <div className="mt-0.5 text-xs text-white/45">{def.desc}</div>}
        {status && (
          <div className={`mt-1 text-xs font-semibold ${status.color}`}>
            {status.label}
            {status.note && <span className="ml-1 font-normal text-white/55">— {status.note}</span>}
          </div>
        )}
        <div className="mt-1.5 grid grid-cols-2 gap-x-2 text-xs text-white/45">
          <span>{fmt(iv.seconds, 3)} s</span>
          <span>
            {fmt(iv.seconds, 3)} s /{' '}
            {fmt(iv.ms, 0)} ms
          </span>
          <span>Small boxes: {fmt(iv.smallBoxes, 1)}</span>
          <span>Large boxes: {fmt(iv.largeBoxes, 2)}</span>
          <span>Δ Amplitude: {fmt(iv.amplitudeDelta, 3)} {ampUnit}</span>
          {iv.seconds > 0 && <span>Rate est.: {fmt(60 / iv.seconds, 0)} bpm</span>}
          {iv.areaUnderCurve !== null && (
            <span className="col-span-2">
              Area: {fmt(iv.areaUnderCurve, 4)} {ampUnit}·s
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── QTc section ────────────────────────────────────────────────────────────

  const qtcSection = (
    <div className="space-y-2">
      <div className="rounded bg-white/5 px-3 py-2 text-xs text-white/55 font-mono leading-relaxed">
        <div>QTc (Bazett) = QT<sub>sec</sub> / √RR<sub>sec</sub></div>
        <div className="mt-0.5 text-white/35">= (QT_ms / 1000) / √(RR_ms / 1000) × 1000</div>
      </div>

      {/* Gender selector */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-white/55">Patient sex:</span>
        {(['male', 'female'] as Gender[]).map(g => (
          <button
            key={g}
            type="button"
            onClick={() => setGender(g)}
            className={`rounded px-3 py-1 font-semibold transition-colors ${
              gender === g
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/55 hover:bg-white/20'
            }`}
          >
            {g === 'male' ? '♂ Male' : '♀ Female'}
          </button>
        ))}
      </div>

      {/* QT source */}
      <div className="rounded bg-white/5 px-3 py-1.5 text-xs text-white/55">
        {qtSec !== null && qtInterval ? (
          <span>
            QT from points B→D:{' '}
            <span className="font-semibold text-white/80">{fmt(qtSec * 1000, 0)} ms</span>
          </span>
        ) : (
          <span>
            {chartData
              ? 'Place all 4 points (A–D) to auto-fill QT, or enter manually:'
              : 'Enter QT and RR manually:'}
          </span>
        )}
      </div>

      {!qtInterval && (
        <div>
          <label className="mb-0.5 block text-xs text-white/45">QT Interval (ms)</label>
          <input
            type="number"
            min={100}
            max={800}
            placeholder="e.g. 380"
            value={manualQtMs}
            onChange={e => setManualQtMs(e.target.value)}
            className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
          />
        </div>
      )}

      <div className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs">
        <div className="mb-2 text-white/55">RR interval or heart rate:</div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-0.5 block text-white/45">RR (ms)</label>
            <input
              type="number"
              min={200}
              max={2000}
              placeholder="e.g. 800"
              value={rrMs}
              onChange={e => handleRrInput(e.target.value)}
              className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
            />
          </div>
          <div className="flex items-end pb-1 text-sm text-white/30">or</div>
          <div className="flex-1">
            <label className="mb-0.5 block text-white/45">HR (bpm)</label>
            <input
              type="number"
              min={20}
              max={300}
              placeholder="e.g. 75"
              value={hrBpm}
              onChange={e => handleHrInput(e.target.value)}
              className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
            />
          </div>
        </div>
        {qtSec !== null && rrSec !== null && (
          <div className="mt-2 rounded bg-black/30 px-2 py-1.5 font-mono text-xs text-white/45 leading-relaxed">
            <div>QT = {fmt(qtSec * 1000, 0)} ms = {fmt(qtSec, 3)} s</div>
            <div>RR = {fmt(rrSec * 1000, 0)} ms = {fmt(rrSec, 3)} s</div>
            <div>√RR = {fmt(Math.sqrt(rrSec), 3)}</div>
            <div className="text-white/65">
              QTcB = {fmt(qtSec, 3)} / {fmt(Math.sqrt(rrSec), 3)} × 1000 = {fmt(bazett, 0)} ms
            </div>
          </div>
        )}
      </div>

      {/* Bazett result */}
      {bazett !== null && bazettStatus && (
        <div
          className={`rounded border px-3 py-2 text-sm ${
            bazettStatus.badge === 'CRITICAL'   ? 'border-red-500/60 bg-red-950/40' :
            bazettStatus.badge === 'PROLONGED'  ? 'border-red-400/40 bg-red-900/20' :
            bazettStatus.badge === 'BORDERLINE' ? 'border-yellow-400/40 bg-yellow-900/20' :
                                                  'border-green-500/40 bg-green-900/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">QTc Bazett</span>
              <span className="ml-1.5 text-xs text-white/45">QT / √RR</span>
            </div>
            <span className="text-xl font-bold text-white">{fmt(bazett, 0)} ms</span>
          </div>
          <div className={`mt-1 flex items-center gap-2 text-xs font-semibold ${bazettStatus.color}`}>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                bazettStatus.badge === 'CRITICAL'   ? 'bg-red-600 text-white' :
                bazettStatus.badge === 'PROLONGED'  ? 'bg-red-500/80 text-white' :
                bazettStatus.badge === 'BORDERLINE' ? 'bg-yellow-500/80 text-black' :
                                                      'bg-green-600/80 text-white'
              }`}
            >
              {bazettStatus.badge}
            </span>
            {bazettStatus.text}
          </div>
        </div>
      )}

      {/* Fridericia result */}
      {fridericia !== null && fridericiaStatus && (
        <div className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-purple-300">QTc Fridericia</span>
              <span className="ml-1.5 text-xs text-white/45">QT / ∛RR</span>
            </div>
            <span className="text-base font-bold text-white">{fmt(fridericia, 0)} ms</span>
          </div>
          <div className={`mt-1 text-xs font-semibold ${fridericiaStatus.color}`}>
            {fridericiaStatus.badge} — {fridericiaStatus.text}
          </div>
        </div>
      )}

      {!rrSec && (
        <div className="px-1 text-xs text-white/40">
          Enter RR interval or heart rate above to compute QTc.
        </div>
      )}

      <details className="group rounded border border-white/10">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-white/55 hover:text-white/80">
          <span>Clinical Reference (Bazett)</span>
          <span className="text-white/30 transition-transform group-open:rotate-90">▶</span>
        </summary>
        <div className="px-3 pb-3 pt-1 text-xs">
          <table className="w-full border-collapse text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/45">
                <th className="pb-1 pr-2">QTc</th>
                <th className="pb-1 pr-2">♂ Male</th>
                <th className="pb-1 pr-2">♀ Female</th>
                <th className="pb-1">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-1 pr-2 font-semibold text-green-400">Normal</td>
                <td className="py-1 pr-2">&lt;440 ms</td>
                <td className="py-1 pr-2">&lt;460 ms</td>
                <td className="py-1 text-white/55">No concern</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-1 pr-2 font-semibold text-yellow-400">Borderline</td>
                <td className="py-1 pr-2">440–460 ms</td>
                <td className="py-1 pr-2">460–470 ms</td>
                <td className="py-1 text-white/55">Monitor</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-1 pr-2 font-semibold text-red-400">Prolonged</td>
                <td className="py-1 pr-2">&gt;460 ms</td>
                <td className="py-1 pr-2">&gt;470 ms</td>
                <td className="py-1 text-white/55">High risk</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-semibold text-red-500">Critical</td>
                <td className="py-1 pr-2">&gt;500 ms</td>
                <td className="py-1 pr-2">&gt;500 ms</td>
                <td className="py-1 text-white/55">Act now</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-white/40">
            <span className="font-semibold text-white/55">Common causes: </span>
            {PROLONGED_CAUSES.join(', ')}
          </div>
        </div>
      </details>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col text-white">

      {/* ── Section 1: Waveform & Intervals ─────────────────────────────────── */}
      <PanelSection defaultOpen={true}>
        <PanelSection.Header>ECG Waveform &amp; Intervals</PanelSection.Header>
        <PanelSection.Content className="bg-muted space-y-3 px-4 pt-3 pb-4">
          {!chartData ? (
            <div className="rounded bg-white/5 px-3 py-2 text-sm text-white/70">
              No ECG chart data available for this study.
              <div className="mt-1 text-xs text-white/45">
                Use the QTc calculator below with manual QT and RR entry.
              </div>
            </div>
          ) : (
            <>
              {/* Point placement guide */}
              <div className="rounded bg-white/5 px-3 py-2 text-xs">
                <div className="mb-1.5 font-semibold text-white/80">Point Placement Guide</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {POINT_GUIDE.map(g => (
                    <div key={g.name} className="flex items-start gap-1.5">
                      <span className={`mt-px font-bold ${g.color}`}>{g.name}</span>
                      <span className="text-white/60">{g.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="h-[260px] overflow-hidden rounded border border-white/10">
                <LineChart
                  showLegend={true}
                  legendWidth={120}
                  axis={{
                    x: { label: axis.x.label, indexRef: 0, type: 'x', range: { min: 0 } },
                    y: { label: axis.y.label, indexRef: 1, type: 'y' },
                  }}
                  series={series}
                  selectedPoints={selectedPoints}
                  onPointClick={handlePointClick}
                />
              </div>

              {/* Amplitude / unit note */}
              <div className="flex items-center justify-between rounded bg-white/5 px-3 py-1.5 text-xs text-white/50">
                <span>
                  Y-axis unit: <span className="font-semibold text-white/70">{ampUnit}</span>
                  &nbsp;·&nbsp; X-axis unit: <span className="font-semibold text-white/70">{timeUnit}</span>
                </span>
                <span>25 mm/s standard speed</span>
              </div>

              {/* Progress hint */}
              {selectedPoints.length < MAX_SELECTED_POINTS && (
                <div className="rounded bg-white/5 px-3 py-1.5 text-xs text-white/55">
                  <span className="font-semibold text-white/75">Next → </span>
                  {nextPointHint}
                </div>
              )}

              {/* Marked points grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/55">
                  <span>Marked Points ({selectedPoints.length} / {MAX_SELECTED_POINTS})</span>
                  {selectedPoints.length > 0 && (
                    <button
                      type="button"
                      className="text-primary-light hover:text-white"
                      onClick={() => setSelectedPoints([])}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {selectedPoints.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {orderedPoints.map((pt, i) => {
                      const g = POINT_GUIDE[i];
                      return (
                        <button
                          key={`${pt.seriesIndex}-${pt.pointIndex}`}
                          type="button"
                          title="Click to remove"
                          onClick={() =>
                            setSelectedPoints(prev =>
                              prev.filter(
                                p => !(p.seriesIndex === pt.seriesIndex && p.pointIndex === pt.pointIndex)
                              )
                            )
                          }
                          className="rounded border border-white/10 bg-black/20 px-2 py-1.5 text-left text-xs hover:border-white/30"
                        >
                          <div className={`mb-0.5 font-bold ${g.color}`}>{g.name}</div>
                          <div className="text-white/60">t = {fmt(pt.x, 4)} {timeUnit}</div>
                          <div className="text-white/60">
                            {ampUnit} = {fmt(pt.y, 3)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-white/10 px-3 py-2 text-xs text-white/50">
                    Click waveform to place points A → B → C → D in sequence.
                  </div>
                )}
              </div>

              {/* Consecutive intervals */}
              {consecutiveIntervals.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wide text-white/55">ECG Intervals</div>
                  {consecutiveIntervals.map(iv => renderIntervalCard(iv))}
                </div>
              )}

              {/* Derived QT (B→D) */}
              {qtInterval && (
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wide text-white/55">Derived Interval</div>
                  {renderIntervalCard(qtInterval, true)}
                </div>
              )}
            </>
          )}
        </PanelSection.Content>
      </PanelSection>

      {/* ── Section 2: QTc Calculator ───────────────────────────────────────── */}
      <PanelSection defaultOpen={true}>
        <PanelSection.Header>QTc Calculator — Bazett / Fridericia</PanelSection.Header>
        <PanelSection.Content className="bg-muted space-y-3 px-4 pt-3 pb-4">
          {qtcSection}
        </PanelSection.Content>
      </PanelSection>

      {/* ── Section 3: Heart Rate Variability ──────────────────────────────── */}
      <PanelSection defaultOpen={false}>
        <PanelSection.Header>Heart Rate Variability (HRV)</PanelSection.Header>
        <PanelSection.Content className="bg-muted space-y-3 px-4 pt-3 pb-4">
          <div className="text-xs text-white/55">
            Enter up to {MAX_RR_HRV} consecutive RR intervals (ms) measured from the waveform.
          </div>
          <div className="grid grid-cols-3 gap-2">
            {rrEntries.map((val, idx) => (
              <div key={idx}>
                <label className="mb-0.5 block text-xs text-white/40">RR {idx + 1}</label>
                <input
                  type="number"
                  min={200}
                  max={2000}
                  placeholder="ms"
                  value={val}
                  onChange={e => {
                    const next = [...rrEntries];
                    next[idx] = e.target.value;
                    setRrEntries(next);
                  }}
                  className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
                />
              </div>
            ))}
          </div>
          {rrEntries.some(v => v !== '') && (
            <button
              type="button"
              className="text-xs text-white/40 hover:text-white/70"
              onClick={() => setRrEntries(Array(MAX_RR_HRV).fill(''))}
            >
              Clear all RR entries
            </button>
          )}

          {hrvStats ? (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-white/55">HRV Results</div>
              <div className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-white/50">Mean RR</span>
                    <div className="font-bold text-white">{fmt(hrvStats.meanRR, 0)} ms</div>
                  </div>
                  <div>
                    <span className="text-white/50">Mean HR</span>
                    <div className="font-bold text-white">{fmt(hrvStats.meanHR, 0)} bpm</div>
                  </div>
                  <div>
                    <span className="text-white/50">SDNN</span>
                    <div className="font-bold text-white">{fmt(hrvStats.sdnn, 1)} ms</div>
                  </div>
                  <div>
                    <span className="text-white/50">RMSSD</span>
                    <div className="font-bold text-white">{fmt(hrvStats.rmssd, 1)} ms</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-white/50">pNN50</span>
                    <div className="font-bold text-white">{fmt(hrvStats.pNN50, 1)}%</div>
                  </div>
                </div>
                {(() => {
                  const interp = sdnnInterpretation(hrvStats.sdnn);
                  return (
                    <div className={`mt-2 text-xs font-semibold ${interp.color}`}>
                      {interp.label}
                      <span className="ml-1 font-normal text-white/45">
                        (SDNN: &lt;20=very poor, 20–50=poor, 50–100=moderate, &gt;100=good)
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="rounded bg-white/5 px-3 py-2 text-xs text-white/45 leading-relaxed">
                <div><span className="text-white/60">SDNN</span> — SD of NN intervals; overall HRV</div>
                <div><span className="text-white/60">RMSSD</span> — root mean square successive diff; vagal tone</div>
                <div><span className="text-white/60">pNN50</span> — % intervals differing by &gt;50 ms</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-white/40">
              Enter at least 2 valid RR intervals to compute HRV metrics.
            </div>
          )}
        </PanelSection.Content>
      </PanelSection>

      {/* ── Section 4: QRS Electrical Axis ─────────────────────────────────── */}
      <PanelSection defaultOpen={false}>
        <PanelSection.Header>QRS Electrical Axis</PanelSection.Header>
        <PanelSection.Content className="bg-muted space-y-3 px-4 pt-3 pb-4">
          <div className="text-xs text-white/55">
            Enter the net QRS deflection amplitude from Lead I and Lead aVF (positive = upward, negative = downward).
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-0.5 block text-xs text-white/45">Lead I ({ampUnit})</label>
              <input
                type="number"
                step={0.1}
                placeholder="e.g. 0.8"
                value={qrsLeadI}
                onChange={e => setQrsLeadI(e.target.value)}
                className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs text-white/45">Lead aVF ({ampUnit})</label>
              <input
                type="number"
                step={0.1}
                placeholder="e.g. 0.6"
                value={qrsLeadAvF}
                onChange={e => setQrsLeadAvF(e.target.value)}
                className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
              />
            </div>
          </div>

          {qrsAxis ? (
            <div className="space-y-2">
              <div className="rounded border border-white/15 bg-black/25 px-4 py-3 text-center">
                <div className="text-3xl font-bold text-white">{fmt(qrsAxis.degrees, 1)}°</div>
                <div className={`mt-1 text-sm font-semibold ${qrsAxis.color}`}>
                  {qrsAxis.label}
                </div>
              </div>
              <div className="rounded bg-white/5 px-3 py-2 text-xs leading-relaxed text-white/45">
                <div className="mb-1 font-semibold text-white/60">Normal ranges:</div>
                <div><span className="text-green-400">Normal</span>: −30° to +90°</div>
                <div><span className="text-yellow-400">LAD</span>: −30° to −90° — left ant. fascicular block, inf. MI, WPW</div>
                <div><span className="text-orange-400">RAD</span>: +90° to +180° — RVH, left post. fascicular block, lat. MI</div>
                <div><span className="text-red-400">Extreme</span>: outside ±180° — ventricular rhythm, lead reversal</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-white/40">
              Enter Lead I and Lead aVF amplitudes above to calculate the electrical axis.
            </div>
          )}

          <div className="rounded bg-white/5 px-3 py-2 text-xs text-white/40 font-mono leading-relaxed">
            <div>Axis (°) = atan2(aVF, Lead I) × 180/π</div>
          </div>
        </PanelSection.Content>
      </PanelSection>

      {/* ── Section 5: Lead / Series Comparison ─────────────────────────────── */}
      {allSeriesStats.length > 1 && (
        <PanelSection defaultOpen={false}>
          <PanelSection.Header>Lead / Series Comparison</PanelSection.Header>
          <PanelSection.Content className="bg-muted space-y-3 px-4 pt-3 pb-4">
            <div className="text-xs text-white/55">
              Amplitude statistics per lead/series from loaded study data.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-white/70">
                <thead>
                  <tr className="border-b border-white/10 text-left text-white/45">
                    <th className="pb-1.5 pr-3">Lead</th>
                    <th className="pb-1.5 pr-3">Max ({ampUnit})</th>
                    <th className="pb-1.5 pr-3">Min ({ampUnit})</th>
                    <th className="pb-1.5 pr-3">P-P ({ampUnit})</th>
                    <th className="pb-1.5">Duration ({timeUnit})</th>
                  </tr>
                </thead>
                <tbody>
                  {allSeriesStats.map((s: any) => (
                    <tr key={s.label} className="border-b border-white/5">
                      <td className="py-1.5 pr-3 font-semibold text-white">{s.label}</td>
                      <td className="py-1.5 pr-3">{fmt(s.maxY, 3)}</td>
                      <td className="py-1.5 pr-3">{fmt(s.minY, 3)}</td>
                      <td className="py-1.5 pr-3 font-semibold text-cyan-300">{fmt(s.peakToPeak, 3)}</td>
                      <td className="py-1.5">{fmt(s.xRange, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-white/35">
              P-P = peak-to-peak amplitude. Standard calibration: 1 mV = 10 mm at gain ×1.
            </div>
          </PanelSection.Content>
        </PanelSection>
      )}
    </div>
  );
}

export default ECGViewerPanel;
