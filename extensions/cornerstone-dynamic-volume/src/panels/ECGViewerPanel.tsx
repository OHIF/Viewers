import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, PanelSection } from '@ohif/ui-next';
import dicomParser from 'dicom-parser';

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
type LayoutMode = 'single' | 'compare';

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

type EcgData = {
  axis: { x: { label: string }; y: { label: string } };
  series: Array<{ label: string; points: [number, number][] }>;
};

type ImagePoint = {
  x: number;
  y: number;
  label: string;
  fill: string;
};

const IMAGE_POINT_COLORS = ['#60a5fa', '#4ade80', '#facc15', '#fb923c']; // A, B, C, D

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

function computeSeriesStats(pts: { x: number; y: number }[]) {
  if (!pts.length) return null;
  const ys = pts.map(p => p.y);
  const xs = pts.map(p => p.x);
  const maxY = Math.max(...ys);
  const minY = Math.min(...ys);
  const xRange = Math.max(...xs) - Math.min(...xs);
  return { maxY, minY, peakToPeak: maxY - minY, xRange };
}

// ── NEW: CSV / text ECG parser ─────────────────────────────────────────────────
// Accepts CSV with header: time, Lead_I, Lead_II, ...
// Or 2-column: time, amplitude
function parseEcgCsv(text: string): EcgData | null {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));
  if (lines.length < 2) return null;

  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
  if (headers.length < 2) return null;

  const dataRows: number[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(sep).map(v => parseFloat(v.trim().replace(/^"|"$/g, '')));
    if (vals.length >= 2 && vals.every(v => Number.isFinite(v))) {
      dataRows.push(vals);
    }
  }
  if (dataRows.length === 0) return null;

  const leadLabels = headers.slice(1);
  const series = leadLabels.map((label, li) => ({
    label: label || `Lead ${li + 1}`,
    points: dataRows.map(row => [row[0], row[li + 1]] as [number, number]),
  }));

  const timeLabel = headers[0] || 'Time';
  const xLabel = timeLabel.toLowerCase().includes('ms')
    ? `${timeLabel} (ms)`
    : `${timeLabel} (s)`;

  return {
    axis: {
      x: { label: xLabel },
      y: { label: 'Amplitude (mV)' },
    },
    series,
  };
}

// ── DICOM ECG waveform parser ──────────────────────────────────────────────────
// Handles DICOM waveform IOD (ECG SOP classes). Extracts all channels and
// converts raw ADC values → mV using channel sensitivity metadata.
function parseDicomEcg(buffer: ArrayBuffer): EcgData | null {
  try {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray, { untilTag: 'x54001010' });

    // WaveformSequence (5400,0100)
    const waveformSeq = dataSet.elements['x54000100'];
    if (!waveformSeq?.items?.length) return null;

    const wds = waveformSeq.items[0].dataSet;
    if (!wds) return null;

    const numChannels = wds.uint16('x003a0010') ?? 1;
    const numSamples = wds.uint32('x003a0005') ?? wds.uint16('x003a0005') ?? 0;
    const samplingFreqStr = wds.string('x003a001a');
    const samplingFreq = samplingFreqStr ? parseFloat(samplingFreqStr) : 500;
    const bitsAllocated = wds.uint16('x54001004') ?? 16;
    const sampleInterp = (wds.string('x54001006') ?? 'SS').trim();

    if (numSamples === 0) return null;

    // Channel definitions (003A,0200)
    const chanDefSeq = wds.elements['x003a0200'];
    const channels: { label: string; sensitivity: number; baseline: number }[] = [];
    for (let i = 0; i < numChannels; i++) {
      const ch = chanDefSeq?.items?.[i]?.dataSet;
      const rawLabel = ch?.string('x003a0203') ?? `Lead ${i + 1}`;
      const label = rawLabel.trim() || `Lead ${i + 1}`;
      const sensitivity = parseFloat(ch?.string('x003a0210') ?? '1') || 1;
      const corrFactor = parseFloat(ch?.string('x003a0212') ?? '1') || 1;
      const baseline = parseFloat(ch?.string('x003a0213') ?? '0') || 0;
      channels.push({ label, sensitivity: sensitivity * corrFactor, baseline });
    }

    // WaveformData (5400,1010)
    const wdElem = wds.elements['x54001010'];
    if (!wdElem) return null;

    const bytesPerSample = bitsAllocated / 8;
    const isSigned = sampleInterp !== 'US';
    const view = new DataView(byteArray.buffer, byteArray.byteOffset + wdElem.dataOffset, wdElem.length);

    const series: EcgData['series'] = channels.map(ch => ({ label: ch.label, points: [] }));

    for (let s = 0; s < numSamples; s++) {
      const timeMs = (s / samplingFreq) * 1000;
      for (let c = 0; c < numChannels; c++) {
        const offset = (s * numChannels + c) * bytesPerSample;
        if (offset + bytesPerSample > wdElem.length) break;
        const raw = bytesPerSample === 2
          ? (isSigned ? view.getInt16(offset, true) : view.getUint16(offset, true))
          : (isSigned ? view.getInt8(offset) : view.getUint8(offset));
        const ch = channels[c];
        // sensitivity is typically in µV/LSB — convert to mV
        const amplitudeMv = (raw * ch.sensitivity + ch.baseline) / 1000;
        series[c].points.push([timeMs, amplitudeMv]);
      }
    }

    return {
      axis: { x: { label: 'Time (ms)' }, y: { label: 'Amplitude (mV)' } },
      series,
    };
  } catch (err) {
    console.error('DICOM ECG parse error:', err);
    return null;
  }
}

// ── Interval card renderer (standalone function for reuse) ─────────────────────

function renderIntervalCard(iv: IntervalResult, ampUnit: string, highlight = false) {
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
        <span>{fmt(iv.seconds, 3)} s / {fmt(iv.ms, 0)} ms</span>
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
}

// ── QTc section (standalone for reuse in A & B) ────────────────────────────────

type QtcSectionProps = {
  chartData: any;
  qtInterval: IntervalResult | null;
  gender: Gender;
  setGender: (g: Gender) => void;
  rrMs: string;
  setRrMs: (v: string) => void;
  hrBpm: string;
  setHrBpm: (v: string) => void;
  manualQtMs: string;
  setManualQtMs: (v: string) => void;
  label?: string;
};

function QtcSection({
  chartData,
  qtInterval,
  gender,
  setGender,
  rrMs,
  setRrMs,
  hrBpm,
  setHrBpm,
  manualQtMs,
  setManualQtMs,
  label = '',
}: QtcSectionProps) {
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

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</div>
      )}
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
}

// ── ECG Chart Block (one ECG: chart + point markers + intervals) ──────────────

type EcgChartBlockProps = {
  ecgData: EcgData | null;
  imageUrl: string | null;
  label: string;
  accentColor: string;
  selectedPoints: ChartPoint[];
  setSelectedPoints: React.Dispatch<React.SetStateAction<ChartPoint[]>>;
  uploadedFileName: string | null;
  onUploadClick: () => void;
  onClearUpload: () => void;
  showUploadButton: boolean;
  imagePoints: ImagePoint[];
  setImagePoints: React.Dispatch<React.SetStateAction<ImagePoint[]>>;
  imgCalibPxPerBox: string;
  setImgCalibPxPerBox: (v: string) => void;
  onQtFromImage?: (ms: number) => void;
};

function EcgChartBlock({
  ecgData,
  imageUrl,
  label,
  accentColor,
  selectedPoints,
  setSelectedPoints,
  uploadedFileName,
  onUploadClick,
  onClearUpload,
  showUploadButton,
  imagePoints,
  setImagePoints,
  imgCalibPxPerBox,
  setImgCalibPxPerBox,
  onQtFromImage,
}: EcgChartBlockProps) {
  const axis = ecgData?.axis;
  const series = ecgData?.series;
  const timeUnit = parseTimeUnit(axis?.x?.label);
  const ampUnit = parseAmplitudeUnit(axis?.y?.label);

  // Two-click calibration state
  const [calibMode, setCalibMode] = useState(false);
  const [calibX1, setCalibX1] = useState<number | null>(null);

  const orderedPoints = useMemo(
    () => [...selectedPoints].sort((a, b) => a.x - b.x),
    [selectedPoints]
  );

  const consecutiveIntervals: IntervalResult[] = useMemo(() => {
    if (orderedPoints.length < 2 || !series) return [];
    return orderedPoints.slice(0, -1).map((pt, i) => {
      const seriesData = getSeriesXY(series, pt.seriesIndex);
      return buildInterval(pt, orderedPoints[i + 1], POINT_NAMES[i], POINT_NAMES[i + 1], timeUnit, seriesData);
    });
  }, [orderedPoints, timeUnit, series]);

  const qtInterval: IntervalResult | null = useMemo(() => {
    if (orderedPoints.length < 4 || !series) return null;
    const seriesData = getSeriesXY(series, orderedPoints[1].seriesIndex);
    return buildInterval(orderedPoints[1], orderedPoints[3], 'B', 'D', timeUnit, seriesData);
  }, [orderedPoints, timeUnit, series]);

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

  return (
    <div className={`rounded border ${accentColor} bg-black/10 p-3 space-y-3`}>
      {/* Header: label + upload controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-white/70">{label}</span>
        <div className="flex items-center gap-2">
          {uploadedFileName && (
            <span className="text-xs text-white/40 truncate max-w-[120px]" title={uploadedFileName}>
              {uploadedFileName}
            </span>
          )}
          {showUploadButton && (
            <button
              type="button"
              onClick={onUploadClick}
              className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70 hover:bg-white/20 transition-colors"
            >
              {uploadedFileName ? '↺ Replace' : '↑ Upload ECG'}
            </button>
          )}
          {uploadedFileName && (
            <button
              type="button"
              onClick={onClearUpload}
              className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/40 hover:bg-red-900/40 hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {imageUrl ? (() => {
        /* ── Image view with interactive point placement ── */
        const pxBox = parseFloat(imgCalibPxPerBox) || null;
        const sortedImgPts = [...imagePoints].sort((a, b) => a.x - b.x);

        // Consecutive intervals between placed points (in order A→B→C→D)
        const imgIntervals = sortedImgPts.slice(0, -1).map((p, i) => {
          const next = sortedImgPts[i + 1];
          const px = Math.round(Math.abs(next.x - p.x));
          const ms = pxBox ? Math.round((px / pxBox) * 200) : null;
          return { label: `${p.label} → ${next.label}`, px, ms };
        });

        // B→D (QT interval)
        const ptB = imagePoints.find(p => p.label === 'B');
        const ptD = imagePoints.find(p => p.label === 'D');
        const bdPx = ptB && ptD ? Math.round(Math.abs(ptD.x - ptB.x)) : null;
        const bdMs = bdPx && pxBox ? Math.round((bdPx / pxBox) * 200) : null;

        const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
          // Read coordinates before entering the async state updater —
          // e.currentTarget is nulled by React after the event completes.
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          if (calibMode) {
            if (calibX1 === null) {
              setCalibX1(x);
            } else {
              const pxSpan = Math.abs(x - calibX1);
              if (pxSpan > 2) {
                setImgCalibPxPerBox(String(Math.round(pxSpan)));
              }
              setCalibX1(null);
              setCalibMode(false);
            }
            return;
          }

          setImagePoints(prev => {
            if (prev.length >= MAX_SELECTED_POINTS) return prev;
            const idx = prev.length;
            return [...prev, { x, y, label: POINT_GUIDE[idx].name, fill: IMAGE_POINT_COLORS[idx] }];
          });
        };

        const nextHint =
          imagePoints.length === 0 ? 'Click on P-wave onset (A)' :
          imagePoints.length === 1 ? 'Click on QRS onset — end of PR (B)' :
          imagePoints.length === 2 ? 'Click on QRS end / J-point (C)' :
          imagePoints.length === 3 ? 'Click on T-wave end (D)' : 'All 4 points placed';

        return (
          <div className="space-y-2">
            {/* Calibration */}
            <div className="rounded bg-white/5 px-3 py-2 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white/60 font-semibold">Calibration:</span>
                {calibMode ? (
                  <span className={`font-semibold ${calibX1 === null ? 'text-yellow-300' : 'text-green-300'}`}>
                    {calibX1 === null
                      ? '① Click the LEFT edge of one large box (= 200 ms)'
                      : '② Click the RIGHT edge of that same large box'}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setCalibMode(true); setCalibX1(null); }}
                      className="rounded bg-yellow-600/60 px-2 py-0.5 text-yellow-100 hover:bg-yellow-600 transition-colors font-semibold"
                    >
                      Click 2 points to calibrate
                    </button>
                    {pxBox ? (
                      <span className="text-green-400 font-mono">{Math.round(pxBox)} px = 200 ms</span>
                    ) : (
                      <span className="text-white/30">not set — click to calibrate for accurate ms</span>
                    )}
                  </>
                )}
                {calibMode && (
                  <button
                    type="button"
                    onClick={() => { setCalibMode(false); setCalibX1(null); }}
                    className="ml-auto text-white/40 hover:text-red-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {!calibMode && (
                <div className="flex items-center gap-2">
                  <span className="text-white/30">or enter manually:</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="px per large box"
                    value={imgCalibPxPerBox}
                    onChange={e => setImgCalibPxPerBox(e.target.value)}
                    className="w-28 rounded bg-white/10 px-2 py-0.5 text-white placeholder:text-white/30 outline-none"
                  />
                  <span className="text-white/30">px = 200 ms</span>
                </div>
              )}
            </div>

            {/* Point guide */}
            <div className="rounded bg-white/5 px-3 py-2 text-xs">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-semibold text-white/80">
                  {imagePoints.length < MAX_SELECTED_POINTS ? nextHint : 'All 4 points placed'}
                </span>
                {imagePoints.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setImagePoints([])}
                    className="text-white/40 hover:text-red-300 transition-colors"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {POINT_GUIDE.map((g, i) => {
                  const placed = imagePoints.find(p => p.label === g.name);
                  const isNext = imagePoints.length === i;
                  return (
                    <div
                      key={g.name}
                      className={`flex items-start gap-1.5 transition-opacity ${placed ? 'opacity-70' : isNext ? 'opacity-100' : 'opacity-30'}`}
                    >
                      <span className={`mt-px font-bold ${g.color}`}>{g.name}</span>
                      <span className="text-white/60">{g.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Image + SVG overlay */}
            <div
              role="button"
              tabIndex={0}
              className="relative overflow-hidden rounded border border-white/10 bg-black/20"
              style={{ cursor: calibMode || imagePoints.length < MAX_SELECTED_POINTS ? 'crosshair' : 'default' }}
              onClick={handleImageClick}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
            >
              <img
                src={imageUrl}
                alt={uploadedFileName ?? 'ECG image'}
                className="pointer-events-none block w-full object-contain"
                style={{ maxHeight: 360 }}
                draggable={false}
              />
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{ overflow: 'visible' }}
              >
                {/* Lines + measurement labels between consecutive points */}
                {imagePoints.slice(0, -1).map((pt, i) => {
                  const next = imagePoints[i + 1];
                  const midX = (pt.x + next.x) / 2;
                  const midY = Math.min(pt.y, next.y) - 14;
                  const px = Math.round(Math.abs(next.x - pt.x));
                  const ms = pxBox ? Math.round((px / pxBox) * 200) : null;
                  const lineColor = pt.fill;
                  return (
                    <g key={`seg-${i}`}>
                      {/* Shadow for visibility */}
                      <line
                        x1={pt.x} y1={pt.y} x2={next.x} y2={next.y}
                        stroke="black" strokeWidth={4} opacity={0.5}
                      />
                      {/* Colored line */}
                      <line
                        x1={pt.x} y1={pt.y} x2={next.x} y2={next.y}
                        stroke={lineColor} strokeWidth={2.5} opacity={1}
                      />
                      {/* Measurement label above midpoint */}
                      <text
                        x={midX} y={midY}
                        textAnchor="middle"
                        fill="black" fontSize="12" fontWeight="bold" fontFamily="monospace"
                        stroke="black" strokeWidth={3} paintOrder="stroke"
                      >
                        {ms !== null ? `${ms} ms` : `${px} px`}
                      </text>
                      <text
                        x={midX} y={midY}
                        textAnchor="middle"
                        fill={lineColor} fontSize="12" fontWeight="bold" fontFamily="monospace"
                      >
                        {ms !== null ? `${ms} ms` : `${px} px`}
                      </text>
                    </g>
                  );
                })}
                {/* Point markers */}
                {imagePoints.map(pt => (
                  <g key={pt.label}>
                    <circle cx={pt.x} cy={pt.y} r={8} fill={pt.fill} opacity={0.75} />
                    <circle cx={pt.x} cy={pt.y} r={8} fill="none" stroke="white" strokeWidth={1.2} opacity={0.5} />
                    <text
                      x={pt.x + 11} y={pt.y - 6}
                      fill={pt.fill} fontSize="13" fontWeight="bold" fontFamily="monospace"
                      style={{ textShadow: '0 0 3px #000' }}
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
                {/* Calibration markers */}
                {calibX1 !== null && (
                  <line
                    x1={calibX1} y1={0} x2={calibX1} y2="100%"
                    stroke="#facc15" strokeWidth={2} strokeDasharray="6 3" opacity={0.8}
                  />
                )}
              </svg>
            </div>

            {/* Interval measurements */}
            {imagePoints.length >= 2 && (
              <div className="space-y-1.5">
                <div className="text-xs uppercase tracking-wide text-white/55">Image Measurements</div>
                {imgIntervals.map(iv => (
                  <div key={iv.label} className="flex items-center justify-between rounded bg-white/5 px-3 py-1.5 text-xs">
                    <span className="text-white/70">{iv.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white/40">{iv.px} px</span>
                      {iv.ms !== null ? (
                        <span className="font-mono font-semibold text-white">{iv.ms} ms</span>
                      ) : (
                        <span className="text-white/30">— ms (set calibration)</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* B→D (QT) summary row */}
                {bdPx !== null && (
                  <div className="flex items-center justify-between rounded border border-yellow-500/30 bg-yellow-900/10 px-3 py-1.5 text-xs">
                    <span className="font-semibold text-yellow-300">B → D (QT Interval)</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white/40">{bdPx} px</span>
                      {bdMs !== null ? (
                        <>
                          <span className="font-mono font-semibold text-white">{bdMs} ms</span>
                          {onQtFromImage && (
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); onQtFromImage(bdMs); }}
                              className="rounded bg-yellow-600/60 px-2 py-0.5 text-yellow-100 hover:bg-yellow-600 transition-colors"
                            >
                              Use in QTc ↓
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-white/30">— ms</span>
                      )}
                    </div>
                  </div>
                )}

                {!pxBox && (
                  <div className="text-xs text-white/30 text-center">
                    Enter calibration above to convert pixels to milliseconds
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })() : !ecgData ? (
        <div className="rounded bg-white/5 px-3 py-3 text-sm text-white/55 text-center">
          {showUploadButton ? (
            <>
              <div className="mb-1">No ECG data loaded</div>
              <button
                type="button"
                onClick={onUploadClick}
                className="mt-1 rounded bg-blue-600/70 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
              >
                Upload ECG File (CSV / PNG / JPG)
              </button>
              <div className="mt-2 text-xs text-white/30">
                CSV: first column = time, remaining columns = leads · PNG/JPG: image preview
              </div>
            </>
          ) : (
            <span>No ECG chart data available for this study.</span>
          )}
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
          <div className="h-[220px] overflow-hidden rounded border border-white/10">
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

          {/* Unit info */}
          <div className="flex items-center justify-between rounded bg-white/5 px-3 py-1.5 text-xs text-white/50">
            <span>
              Y: <span className="font-semibold text-white/70">{ampUnit}</span>
              &nbsp;·&nbsp; X: <span className="font-semibold text-white/70">{timeUnit}</span>
            </span>
            <span>25 mm/s</span>
          </div>

          {/* Progress hint */}
          {selectedPoints.length < MAX_SELECTED_POINTS && (
            <div className="rounded bg-white/5 px-3 py-1.5 text-xs text-white/55">
              <span className="font-semibold text-white/75">Next → </span>
              {nextPointHint}
            </div>
          )}

          {/* Marked points */}
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
                      <div className="text-white/60">{ampUnit} = {fmt(pt.y, 3)}</div>
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
              {consecutiveIntervals.map(iv => renderIntervalCard(iv, ampUnit))}
            </div>
          )}

          {/* Derived QT (B→D) */}
          {qtInterval && (
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wide text-white/55">Derived Interval</div>
              {renderIntervalCard(qtInterval, ampUnit, true)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function ECGViewerPanel({ servicesManager }: withAppTypes) {
  const { displaySetService } = servicesManager.services;

  // DICOM display set
  const [chartDisplaySet, setChartDisplaySet] = useState(() =>
    getChartDisplaySet(displaySetService)
  );

  // Layout
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');

  // Uploaded files
  const [uploadedEcgA, setUploadedEcgA] = useState<EcgData | null>(null);
  const [uploadedEcgAName, setUploadedEcgAName] = useState<string | null>(null);
  const [uploadedEcgB, setUploadedEcgB] = useState<EcgData | null>(null);
  const [uploadedEcgBName, setUploadedEcgBName] = useState<string | null>(null);
  const [uploadedImageA, setUploadedImageA] = useState<string | null>(null);
  const [uploadedImageB, setUploadedImageB] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Image point placement state
  const [imagePointsA, setImagePointsA] = useState<ImagePoint[]>([]);
  const [imagePointsB, setImagePointsB] = useState<ImagePoint[]>([]);
  const [imgCalibPxPerBoxA, setImgCalibPxPerBoxA] = useState('');
  const [imgCalibPxPerBoxB, setImgCalibPxPerBoxB] = useState('');

  // File input refs
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // ECG A measurement state
  const [selectedPointsA, setSelectedPointsA] = useState<ChartPoint[]>([]);
  const [rrMsA, setRrMsA] = useState('');
  const [hrBpmA, setHrBpmA] = useState('');
  const [manualQtMsA, setManualQtMsA] = useState('');
  const [genderA, setGenderA] = useState<Gender>('male');
  const [rrEntriesA, setRrEntriesA] = useState<string[]>(Array(MAX_RR_HRV).fill(''));
  const [qrsLeadI, setQrsLeadI] = useState('');
  const [qrsLeadAvF, setQrsLeadAvF] = useState('');

  // ECG B measurement state
  const [selectedPointsB, setSelectedPointsB] = useState<ChartPoint[]>([]);
  const [rrMsB, setRrMsB] = useState('');
  const [hrBpmB, setHrBpmB] = useState('');
  const [manualQtMsB, setManualQtMsB] = useState('');
  const [genderB, setGenderB] = useState<Gender>('male');

  // Active chart data
  // ECG A: uploaded file overrides DICOM data
  const dicomChartData = chartDisplaySet?.instance?.chartData;
  const ecgAData: EcgData | null = uploadedEcgA || (dicomChartData?.series?.length ? dicomChartData : null);
  const ecgBData: EcgData | null = uploadedEcgB;

  // Derived state for ECG A QTc
  const ecgAAxis = ecgAData?.axis;
  const ecgASeries = ecgAData?.series;
  const timeUnitA = parseTimeUnit(ecgAAxis?.x?.label);

  const orderedPointsA = useMemo(
    () => [...selectedPointsA].sort((a, b) => a.x - b.x),
    [selectedPointsA]
  );

  const qtIntervalA: IntervalResult | null = useMemo(() => {
    if (orderedPointsA.length < 4 || !ecgASeries) return null;
    const seriesData = getSeriesXY(ecgASeries, orderedPointsA[1].seriesIndex);
    return buildInterval(orderedPointsA[1], orderedPointsA[3], 'B', 'D', timeUnitA, seriesData);
  }, [orderedPointsA, timeUnitA, ecgASeries]);

  // Derived state for ECG B QTc
  const ecgBAxis = ecgBData?.axis;
  const ecgBSeries = ecgBData?.series;
  const timeUnitB = parseTimeUnit(ecgBAxis?.x?.label);

  const orderedPointsB = useMemo(
    () => [...selectedPointsB].sort((a, b) => a.x - b.x),
    [selectedPointsB]
  );

  const qtIntervalB: IntervalResult | null = useMemo(() => {
    if (orderedPointsB.length < 4 || !ecgBSeries) return null;
    const seriesData = getSeriesXY(ecgBSeries, orderedPointsB[1].seriesIndex);
    return buildInterval(orderedPointsB[1], orderedPointsB[3], 'B', 'D', timeUnitB, seriesData);
  }, [orderedPointsB, timeUnitB, ecgBSeries]);

  // HRV (ECG A)
  const hrvStats = useMemo(() => {
    const vals = rrEntriesA.map(v => parseFloat(v)).filter(v => Number.isFinite(v) && v > 0);
    return computeHRV(vals);
  }, [rrEntriesA]);

  // QRS Axis
  const qrsAxis = useMemo(() => {
    const i = parseFloat(qrsLeadI);
    const avf = parseFloat(qrsLeadAvF);
    if (!Number.isFinite(i) || !Number.isFinite(avf)) return null;
    return computeQrsAxis(i, avf);
  }, [qrsLeadI, qrsLeadAvF]);

  // Per-series amplitude stats (ECG A)
  const ampUnit = parseAmplitudeUnit(ecgAAxis?.y?.label);
  const allSeriesStats = useMemo(() => {
    if (!ecgASeries?.length) return [];
    return ecgASeries
      .map((s: any, idx: number) => {
        const pts = getSeriesXY(ecgASeries, idx);
        const stats = computeSeriesStats(pts);
        return stats ? { label: s.label || `Lead ${idx + 1}`, ...stats } : null;
      })
      .filter(Boolean);
  }, [ecgASeries]);

  // Subscribe to display set changes
  useEffect(() => {
    const sync = () => setChartDisplaySet(getChartDisplaySet(displaySetService));
    sync();
    const s1 = displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_ADDED, sync);
    const s2 = displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_CHANGED, sync);
    return () => { s1.unsubscribe(); s2.unsubscribe(); };
  }, [displaySetService]);

  // Reset ECG A measurements when display set changes (only if not using uploaded)
  useEffect(() => {
    if (!uploadedEcgA) {
      setSelectedPointsA([]);
      setRrMsA(''); setHrBpmA(''); setManualQtMsA('');
    }
  }, [chartDisplaySet?.displaySetInstanceUID, uploadedEcgA]);

  // File upload handler
  const handleFileUpload = useCallback((slot: 'A' | 'B', file: File) => {
    setUploadError(null);
    const isImage = /\.(png|jpe?g|gif|bmp|webp)$/i.test(file.name) || file.type.startsWith('image/');
    const isDicom = /\.dcm$/i.test(file.name) || file.type === 'application/dicom';

    if (isImage) {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        if (slot === 'A') {
          setUploadedImageA(dataUrl);
          setUploadedEcgA(null);
          setUploadedEcgAName(file.name);
          setSelectedPointsA([]);
          setRrMsA(''); setHrBpmA(''); setManualQtMsA('');
        } else {
          setUploadedImageB(dataUrl);
          setUploadedEcgB(null);
          setUploadedEcgBName(file.name);
          setSelectedPointsB([]);
          setRrMsB(''); setHrBpmB(''); setManualQtMsB('');
        }
      };
      reader.onerror = () => setUploadError(`Failed to read image "${file.name}".`);
      reader.readAsDataURL(file);
      return;
    }

    if (isDicom) {
      const reader = new FileReader();
      reader.onload = e => {
        const buffer = e.target?.result as ArrayBuffer;
        const parsed = parseDicomEcg(buffer);
        if (!parsed) {
          setUploadError(`Could not parse DICOM ECG from "${file.name}". Ensure it is a DICOM waveform file (ECG SOP class).`);
          return;
        }
        if (slot === 'A') {
          setUploadedEcgA(parsed);
          setUploadedImageA(null);
          setUploadedEcgAName(file.name);
          setSelectedPointsA([]);
          setRrMsA(''); setHrBpmA(''); setManualQtMsA('');
        } else {
          setUploadedEcgB(parsed);
          setUploadedImageB(null);
          setUploadedEcgBName(file.name);
          setSelectedPointsB([]);
          setRrMsB(''); setHrBpmB(''); setManualQtMsB('');
        }
      };
      reader.onerror = () => setUploadError(`Failed to read DICOM file "${file.name}".`);
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseEcgCsv(text);
      if (!parsed) {
        setUploadError(`Could not parse "${file.name}". Ensure it is a CSV with a header row and numeric data.`);
        return;
      }
      if (slot === 'A') {
        setUploadedEcgA(parsed);
        setUploadedImageA(null);
        setUploadedEcgAName(file.name);
        setSelectedPointsA([]);
        setRrMsA(''); setHrBpmA(''); setManualQtMsA('');
      } else {
        setUploadedEcgB(parsed);
        setUploadedImageB(null);
        setUploadedEcgBName(file.name);
        setSelectedPointsB([]);
        setRrMsB(''); setHrBpmB(''); setManualQtMsB('');
      }
    };
    reader.onerror = () => setUploadError(`Failed to read file "${file.name}".`);
    reader.readAsText(file);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col text-white">

      {/* ── Toolbar: Layout + Upload controls ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        {/* Layout toggle */}
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-white/40">Layout:</span>
          <button
            type="button"
            onClick={() => setLayoutMode('single')}
            title="Single ECG view"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
              layoutMode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/55 hover:bg-white/20'
            }`}
          >
            {/* Single-panel icon */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" className="opacity-80">
              <rect x="1" y="1" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            1 ECG
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('compare')}
            title="Compare two ECGs"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
              layoutMode === 'compare'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/55 hover:bg-white/20'
            }`}
          >
            {/* Split-panel icon */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" className="opacity-80">
              <rect x="1" y="1" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <rect x="9" y="1" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            Compare
          </button>
        </div>

        {/* Upload ECG A button (always visible) */}
        <button
          type="button"
          onClick={() => fileInputARef.current?.click()}
          className="rounded bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/20 transition-colors"
        >
          ↑ Upload ECG {layoutMode === 'compare' ? 'A' : ''}
        </button>

        {/* Hidden file inputs */}
        <input
          ref={fileInputARef}
          type="file"
          accept=".dcm,.csv,.txt,.tsv,.png,.jpg,.jpeg,.gif,.bmp,.webp"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload('A', file);
            e.target.value = '';
          }}
        />
        <input
          ref={fileInputBRef}
          type="file"
          accept=".dcm,.csv,.txt,.tsv,.png,.jpg,.jpeg,.gif,.bmp,.webp"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload('B', file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="mx-4 mt-2 rounded border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {uploadError}
          <button
            type="button"
            className="ml-2 text-red-400 hover:text-red-200"
            onClick={() => setUploadError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Format hint */}
      <div className="px-4 py-1.5 text-xs text-white/30">
        Supports: <span className="font-mono text-white/45">.dcm</span> (DICOM ECG waveform),
        &nbsp;<span className="font-mono text-white/45">.csv</span> (<span className="font-mono text-white/45">time, Lead_I, Lead_II, ...</span>),
        &nbsp;or image files (.png, .jpg)
      </div>

      {/* ── Section 1: ECG Waveform(s) & Intervals ───────────────────────────── */}
      <PanelSection defaultOpen={true}>
        <PanelSection.Header>
          ECG Waveform &amp; Intervals
          {layoutMode === 'compare' && <span className="ml-2 text-xs text-white/40">(comparison mode)</span>}
        </PanelSection.Header>
        <PanelSection.Content className="bg-muted space-y-4 px-4 pt-3 pb-4">

          {/* ECG A */}
          <EcgChartBlock
            ecgData={ecgAData}
            imageUrl={uploadedImageA}
            label={layoutMode === 'compare' ? 'ECG A' : 'ECG'}
            accentColor="border-blue-500/30"
            selectedPoints={selectedPointsA}
            setSelectedPoints={setSelectedPointsA}
            uploadedFileName={uploadedEcgAName}
            onUploadClick={() => fileInputARef.current?.click()}
            onClearUpload={() => {
              setUploadedEcgA(null);
              setUploadedImageA(null);
              setUploadedEcgAName(null);
              setSelectedPointsA([]);
              setImagePointsA([]);
              setImgCalibPxPerBoxA('');
            }}
            showUploadButton={!ecgAData || !!uploadedEcgA || !!uploadedImageA}
            imagePoints={imagePointsA}
            setImagePoints={setImagePointsA}
            imgCalibPxPerBox={imgCalibPxPerBoxA}
            setImgCalibPxPerBox={setImgCalibPxPerBoxA}
            onQtFromImage={ms => setManualQtMsA(String(ms))}
          />

          {/* ECG B — only in compare mode */}
          {layoutMode === 'compare' && (
            <EcgChartBlock
              ecgData={ecgBData}
              imageUrl={uploadedImageB}
              label="ECG B"
              accentColor="border-emerald-500/30"
              selectedPoints={selectedPointsB}
              setSelectedPoints={setSelectedPointsB}
              uploadedFileName={uploadedEcgBName}
              onUploadClick={() => fileInputBRef.current?.click()}
              onClearUpload={() => {
                setUploadedEcgB(null);
                setUploadedImageB(null);
                setUploadedEcgBName(null);
                setSelectedPointsB([]);
                setImagePointsB([]);
                setImgCalibPxPerBoxB('');
              }}
              showUploadButton={true}
              imagePoints={imagePointsB}
              setImagePoints={setImagePointsB}
              imgCalibPxPerBox={imgCalibPxPerBoxB}
              setImgCalibPxPerBox={setImgCalibPxPerBoxB}
              onQtFromImage={ms => setManualQtMsB(String(ms))}
            />
          )}
        </PanelSection.Content>
      </PanelSection>

      {/* ── Section 2: QTc Calculator ───────────────────────────────────────── */}
      <PanelSection defaultOpen={true}>
        <PanelSection.Header>
          QTc Calculator — Bazett / Fridericia
          {layoutMode === 'compare' && <span className="ml-2 text-xs text-white/40">(ECG A)</span>}
        </PanelSection.Header>
        <PanelSection.Content className="bg-muted space-y-3 px-4 pt-3 pb-4">
          <QtcSection
            chartData={ecgAData}
            qtInterval={qtIntervalA}
            gender={genderA}
            setGender={setGenderA}
            rrMs={rrMsA}
            setRrMs={setRrMsA}
            hrBpm={hrBpmA}
            setHrBpm={setHrBpmA}
            manualQtMs={manualQtMsA}
            setManualQtMs={setManualQtMsA}
          />
        </PanelSection.Content>
      </PanelSection>

      {/* ── Section 2B: QTc for ECG B (compare mode only) ───────────────────── */}
      {layoutMode === 'compare' && (
        <PanelSection defaultOpen={true}>
          <PanelSection.Header>
            QTc Calculator — Bazett / Fridericia
            <span className="ml-2 text-xs text-white/40">(ECG B)</span>
          </PanelSection.Header>
          <PanelSection.Content className="bg-muted space-y-3 px-4 pt-3 pb-4">
            {ecgBData ? (
              <QtcSection
                chartData={ecgBData}
                qtInterval={qtIntervalB}
                gender={genderB}
                setGender={setGenderB}
                rrMs={rrMsB}
                setRrMs={setRrMsB}
                hrBpm={hrBpmB}
                setHrBpm={setHrBpmB}
                manualQtMs={manualQtMsB}
                setManualQtMs={setManualQtMsB}
              />
            ) : (
              <div className="text-xs text-white/40">
                Upload ECG B above to enable measurements.
              </div>
            )}
          </PanelSection.Content>
        </PanelSection>
      )}

      {/* ── Section 3: Heart Rate Variability (ECG A) ──────────────────────── */}
      <PanelSection defaultOpen={false}>
        <PanelSection.Header>
          Heart Rate Variability (HRV)
          {layoutMode === 'compare' && <span className="ml-2 text-xs text-white/40">(ECG A)</span>}
        </PanelSection.Header>
        <PanelSection.Content className="bg-muted space-y-3 px-4 pt-3 pb-4">
          <div className="text-xs text-white/55">
            Enter up to {MAX_RR_HRV} consecutive RR intervals (ms) measured from the waveform.
          </div>
          <div className="grid grid-cols-3 gap-2">
            {rrEntriesA.map((val, idx) => (
              <div key={idx}>
                <label className="mb-0.5 block text-xs text-white/40">RR {idx + 1}</label>
                <input
                  type="number"
                  min={200}
                  max={2000}
                  placeholder="ms"
                  value={val}
                  onChange={e => {
                    const next = [...rrEntriesA];
                    next[idx] = e.target.value;
                    setRrEntriesA(next);
                  }}
                  className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/25 focus:border-white/40 focus:outline-none"
                />
              </div>
            ))}
          </div>
          {rrEntriesA.some(v => v !== '') && (
            <button
              type="button"
              className="text-xs text-white/40 hover:text-white/70"
              onClick={() => setRrEntriesA(Array(MAX_RR_HRV).fill(''))}
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
                    <th className="pb-1.5">Duration</th>
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
