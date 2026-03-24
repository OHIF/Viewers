import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, PanelSection } from '@ohif/ui-next';
import dicomParser from 'dicom-parser';

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_SELECTED_POINTS = 4;
const SMALL_BOX_SECONDS = 0.04; // 1 mm at 25 mm/s
const LARGE_BOX_SECONDS = 0.2;  // 5 mm (1 large box)
const MAX_RR_HRV = 6;
const MAX_DICOM_POINTS_PER_SERIES = 4000;
const ECG_PAPER_BG = {
  backgroundColor: '#fff8f8',
  backgroundImage: `
    linear-gradient(to right, rgba(244,114,114,0.22) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(244,114,114,0.22) 1px, transparent 1px),
    linear-gradient(to right, rgba(239,68,68,0.38) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(239,68,68,0.38) 1px, transparent 1px)
  `,
  backgroundSize: '8px 8px, 8px 8px, 40px 40px, 40px 40px',
  backgroundPosition: '0 0, 0 0, 0 0, 0 0',
} as const;

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

type SvgPoint = {
  x: number;
  y: number;
  dataX: number;
  dataY: number;
  pointIndex: number;
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

function getSensitivityScaleToMv(channelDataSet: any): number {
  const unitsSeq = channelDataSet?.elements?.['x003a0211'];
  const codeValue = unitsSeq?.items?.[0]?.dataSet?.string('x00080100')?.trim().toLowerCase();
  const codeMeaning = unitsSeq?.items?.[0]?.dataSet?.string('x00080104')?.trim().toLowerCase();
  const unitText = `${codeValue ?? ''} ${codeMeaning ?? ''}`;

  if (unitText.includes('millivolt') || codeValue === 'mv') {
    return 1;
  }
  if (unitText.includes('microvolt') || codeValue === 'uv') {
    return 1 / 1000;
  }
  if (unitText.includes('volt') || codeValue === 'v') {
    return 1000;
  }

  // ECG waveform sensitivity is most commonly stored in microvolts.
  return 1 / 1000;
}

function downsampleSeriesPoints(points: [number, number][], maxPoints = MAX_DICOM_POINTS_PER_SERIES) {
  if (!Array.isArray(points) || points.length <= maxPoints) {
    return points;
  }

  // Min-max downsampling: for each bucket keep the min and max sample so that
  // peak and trough values (QRS spikes, P/T waves) are never dropped.
  const buckets = Math.floor(maxPoints / 2);
  const bucketSize = points.length / buckets;
  const sampled: [number, number][] = [];

  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * bucketSize);
    const end = Math.min(Math.floor((b + 1) * bucketSize), points.length);
    if (start >= end) continue;

    let minIdx = start;
    let maxIdx = start;
    for (let i = start + 1; i < end; i++) {
      if (points[i][1] < points[minIdx][1]) minIdx = i;
      if (points[i][1] > points[maxIdx][1]) maxIdx = i;
    }

    // Always emit in time order so the path doesn't cross itself.
    if (minIdx <= maxIdx) {
      sampled.push(points[minIdx]);
      if (minIdx !== maxIdx) sampled.push(points[maxIdx]);
    } else {
      sampled.push(points[maxIdx]);
      if (minIdx !== maxIdx) sampled.push(points[minIdx]);
    }
  }

  return sampled;
}

function normalizeLeadLabel(label = ''): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findLeadIndex(series: EcgData['series'], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeLeadLabel);
  return series.findIndex(lead => normalizedAliases.includes(normalizeLeadLabel(lead.label)));
}

function isStandard12LeadLike(ecgData: EcgData | null) {
  if (!ecgData?.series?.length) {
    return false;
  }

  const requiredGroups = [
    ['i', 'lead1', 'leadi'],
    ['ii', 'lead2', 'leadii'],
    ['iii', 'lead3', 'leadiii'],
    ['avr'],
    ['avl'],
    ['avf'],
  ];

  return (
    ecgData.series.length >= 8 &&
    requiredGroups.every(group => findLeadIndex(ecgData.series, group) !== -1)
  );
}

function filterPointsInRange(points: [number, number][], startMs: number, endMs: number) {
  return points.filter(([x]) => x >= startMs && x <= endMs);
}

function getNearestSvgPoint(points: SvgPoint[], x: number, y: number, maxDistance = 60) {
  let nearest: SvgPoint | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const point of points) {
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = point;
    }
  }

  return nearestDistance <= maxDistance ? nearest : null;
}

type EcgSheetRendererProps = {
  ecgData: EcgData;
  selectedPoints: ChartPoint[];
  setSelectedPoints: React.Dispatch<React.SetStateAction<ChartPoint[]>>;
};

function EcgSheetRenderer({ ecgData, selectedPoints, setSelectedPoints }: EcgSheetRendererProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const series = ecgData.series;
  const totalDurationMs = Math.max(
    ...series.map(lead => lead.points[lead.points.length - 1]?.[0] ?? 0),
    10000
  );
  const segmentDurationMs = totalDurationMs / 4;

  const sheetWidth = 1200;
  const marginX = 28;
  const marginTop = 26;
  const marginBottom = 34;
  const cols = 4;
  const cellWidth = (sheetWidth - marginX * 2) / cols;
  const largeBoxPx = cellWidth / 12.5;
  const smallBoxPx = largeBoxPx / 5;
  const mvToPx = largeBoxPx * 2;
  const rowHeight = largeBoxPx * 7;
  const rhythmHeight = rowHeight;
  const sheetHeight = marginTop + rowHeight * 3 + rhythmHeight + marginBottom;
  const rhythmTop = marginTop + rowHeight * 3;
  const rhythmBaseline = rhythmTop + rowHeight / 2;

  const leadLayout = [
    [['I', 'lead1', 'leadi'], ['aVR', 'avr'], ['V1', 'v1'], ['V4', 'v4']],
    [['II', 'lead2', 'leadii'], ['aVL', 'avl'], ['V2', 'v2'], ['V5', 'v5']],
    [['III', 'lead3', 'leadiii'], ['aVF', 'avf'], ['V3', 'v3'], ['V6', 'v6']],
  ];

  const rhythmLeadAliases = ['II', 'lead2', 'leadii'];
  const rhythmSeriesIndex = Math.max(0, findLeadIndex(series, rhythmLeadAliases));
  const rhythmSeries = series[rhythmSeriesIndex];

  const buildPath = (
    leadPoints: [number, number][],
    startMs: number,
    endMs: number,
    xOffset: number,
    baselineY: number,
    width: number
  ) => {
    const pts = filterPointsInRange(leadPoints, startMs, endMs);
    if (!pts.length) {
      return '';
    }

    return pts
      .map(([x, y], idx) => {
        const px = xOffset + ((x - startMs) / (endMs - startMs || 1)) * width;
        const py = baselineY - y * mvToPx;
        return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`;
      })
      .join(' ');
  };

  const rhythmSvgPoints: SvgPoint[] = useMemo(() => {
    const points = rhythmSeries?.points ?? [];
    return points.map(([x, y], pointIndex) => ({
      x: marginX + (x / (totalDurationMs || 1)) * (sheetWidth - marginX * 2),
      y: rhythmBaseline - y * mvToPx,
      dataX: x,
      dataY: y,
      pointIndex,
    }));
  }, [marginX, mvToPx, rhythmBaseline, rhythmSeries, sheetWidth, totalDurationMs]);

  const handleSheetClick = (event: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const scaleX = sheetWidth / rect.width;
    const scaleY = sheetHeight / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const nearest = getNearestSvgPoint(rhythmSvgPoints, x, y);
    if (!nearest) {
      return;
    }

    setSelectedPoints(prev => {
      const id = `${rhythmSeriesIndex}-${nearest.pointIndex}`;
      const existingIdx = prev.findIndex(p => `${p.seriesIndex}-${p.pointIndex}` === id);
      if (existingIdx !== -1) {
        // Already placed — keep it, do not toggle off
        return prev;
      }
      if (prev.length >= MAX_SELECTED_POINTS) {
        return prev;
      }
      return [
        ...prev,
        {
          x: nearest.dataX,
          y: nearest.dataY,
          seriesIndex: rhythmSeriesIndex,
          pointIndex: nearest.pointIndex,
          seriesLabel: rhythmSeries?.label,
        },
      ];
    });
  };

  return (
    <div className="space-y-2">
      <div className="rounded bg-white/5 px-3 py-2 text-xs text-white/60">
        ECG sheet view. Point selection is placed on the rhythm strip ({rhythmSeries?.label ?? 'Lead II'}).
      </div>
      <div
        className="overflow-hidden rounded border border-red-200/80 shadow-inner"
        style={ECG_PAPER_BG}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
          className="block h-auto w-full"
          aria-label="ECG sheet"
        >
          <defs>
            <pattern id="ecg-small-grid" width={smallBoxPx} height={smallBoxPx} patternUnits="userSpaceOnUse">
              <path d={`M ${smallBoxPx} 0 L 0 0 0 ${smallBoxPx}`} fill="none" stroke="rgba(244,114,114,0.22)" strokeWidth="1" />
            </pattern>
            <pattern id="ecg-large-grid" width={largeBoxPx} height={largeBoxPx} patternUnits="userSpaceOnUse">
              <rect width={largeBoxPx} height={largeBoxPx} fill="url(#ecg-small-grid)" />
              <path d={`M ${largeBoxPx} 0 L 0 0 0 ${largeBoxPx}`} fill="none" stroke="rgba(239,68,68,0.38)" strokeWidth="1.2" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={sheetWidth} height={sheetHeight} fill="url(#ecg-large-grid)" />

          {leadLayout.map((row, rowIndex) =>
            row.map((aliases, colIndex) => {
              const seriesIndex = findLeadIndex(series, aliases);
              if (seriesIndex === -1) {
                return null;
              }

              const lead = series[seriesIndex];
              const startMs = colIndex * segmentDurationMs;
              const endMs = (colIndex + 1) * segmentDurationMs;
              const xOffset = marginX + colIndex * cellWidth;
              const baselineY = marginTop + rowIndex * rowHeight + rowHeight / 2;
              const path = buildPath(lead.points, startMs, endMs, xOffset, baselineY, cellWidth);

              return (
                <g key={`${rowIndex}-${colIndex}`}>
                  <text x={xOffset + 10} y={baselineY - rowHeight / 2 + 18} fill="#222" fontSize="18" fontWeight="700">
                    {lead.label}
                  </text>
                  <path d={path} fill="none" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
                </g>
              );
            })
          )}

          <g>
            <text x={marginX + 10} y={rhythmTop + 18} fill="#222" fontSize="18" fontWeight="700">
              {rhythmSeries?.label ?? 'II'}
            </text>
            <path
              d={buildPath(rhythmSeries?.points ?? [], 0, totalDurationMs, marginX, rhythmBaseline, sheetWidth - marginX * 2)}
              fill="none"
              stroke="#111"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {selectedPoints
              .filter(point => point.seriesIndex === rhythmSeriesIndex)
              .sort((a, b) => a.x - b.x)
              .map((point, index, arr) => {
                const svgPoint = rhythmSvgPoints.find(p => p.pointIndex === point.pointIndex);
                if (!svgPoint) {
                  return null;
                }
                const nextChartPoint = index < arr.length - 1 ? arr[index + 1] : null;
                const nextPoint = nextChartPoint
                  ? rhythmSvgPoints.find(p => p.pointIndex === nextChartPoint.pointIndex)
                  : null;
                const color = IMAGE_POINT_COLORS[index] ?? '#60a5fa';
                const deltaMs = nextChartPoint !== null
                  ? Math.round(Math.abs(nextChartPoint.x - point.x))
                  : null;
                const midSvgX = nextPoint ? (svgPoint.x + nextPoint.x) / 2 : svgPoint.x;
                const midSvgY = nextPoint ? Math.min(svgPoint.y, nextPoint.y) - 18 : svgPoint.y;

                return (
                  <g key={`${point.seriesIndex}-${point.pointIndex}`}>
                    {nextPoint && (
                      <>
                        <line
                          x1={svgPoint.x}
                          y1={svgPoint.y}
                          x2={nextPoint.x}
                          y2={nextPoint.y}
                          stroke={color}
                          strokeWidth="2"
                        />
                        {deltaMs !== null && (
                          <>
                            <text
                              x={midSvgX} y={midSvgY - 2}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.85)" fontSize="16" fontWeight="bold" fontFamily="monospace"
                              stroke="rgba(0,0,0,0.85)" strokeWidth={4} paintOrder="stroke"
                            >
                              {deltaMs} ms
                            </text>
                            <text
                              x={midSvgX} y={midSvgY - 2}
                              textAnchor="middle"
                              fill={color} fontSize="16" fontWeight="bold" fontFamily="monospace"
                            >
                              {deltaMs} ms
                            </text>
                            <text
                              x={midSvgX} y={midSvgY + 16}
                              textAnchor="middle"
                              fill="rgba(0,0,0,0.7)" fontSize="11" fontFamily="monospace"
                              stroke="rgba(0,0,0,0.7)" strokeWidth={3} paintOrder="stroke"
                            >
                              {(deltaMs / 200).toFixed(2)} lg □ · {(deltaMs / 40).toFixed(1)} sm □
                            </text>
                            <text
                              x={midSvgX} y={midSvgY + 16}
                              textAnchor="middle"
                              fill={color} fontSize="11" fontFamily="monospace" opacity={0.8}
                            >
                              {(deltaMs / 200).toFixed(2)} lg □ · {(deltaMs / 40).toFixed(1)} sm □
                            </text>
                          </>
                        )}
                      </>
                    )}
                    <circle cx={svgPoint.x} cy={svgPoint.y} r="6" fill={color} stroke="#fff" strokeWidth="1.2" />
                    <text x={svgPoint.x + 10} y={svgPoint.y - 8} fill={color} fontSize="14" fontWeight="700">
                      {POINT_GUIDE[index]?.name ?? index + 1}
                    </text>
                  </g>
                );
              })}

            {/* Total span bracket below rhythm strip */}
            {(() => {
              const sorted = selectedPoints
                .filter(p => p.seriesIndex === rhythmSeriesIndex)
                .sort((a, b) => a.x - b.x);
              if (sorted.length < 2) return null;
              const first = rhythmSvgPoints.find(p => p.pointIndex === sorted[0].pointIndex);
              const last = rhythmSvgPoints.find(p => p.pointIndex === sorted[sorted.length - 1].pointIndex);
              if (!first || !last) return null;
              const totalMs = Math.round(Math.abs(sorted[sorted.length - 1].x - sorted[0].x));
              const by = rhythmTop + rhythmHeight + 10;
              const tickH = 6;
              return (
                <g>
                  {/* bracket line */}
                  <line x1={first.x} y1={by} x2={last.x} y2={by} stroke="#facc15" strokeWidth={2} />
                  <line x1={first.x} y1={by - tickH} x2={first.x} y2={by + tickH} stroke="#facc15" strokeWidth={2} />
                  <line x1={last.x} y1={by - tickH} x2={last.x} y2={by + tickH} stroke="#facc15" strokeWidth={2} />
                  {/* total label */}
                  <text
                    x={(first.x + last.x) / 2} y={by + 20}
                    textAnchor="middle"
                    fill="black" fontSize="15" fontWeight="bold" fontFamily="monospace"
                    stroke="black" strokeWidth={4} paintOrder="stroke"
                  >
                    Total A→{sorted.length >= 4 ? 'D' : sorted.length === 3 ? 'C' : 'B'}: {totalMs} ms
                  </text>
                  <text
                    x={(first.x + last.x) / 2} y={by + 20}
                    textAnchor="middle"
                    fill="#facc15" fontSize="15" fontWeight="bold" fontFamily="monospace"
                  >
                    Total A→{sorted.length >= 4 ? 'D' : sorted.length === 3 ? 'C' : 'B'}: {totalMs} ms
                  </text>
                  <text
                    x={(first.x + last.x) / 2} y={by + 35}
                    textAnchor="middle"
                    fill="black" fontSize="11" fontFamily="monospace"
                    stroke="black" strokeWidth={3} paintOrder="stroke"
                  >
                    min interval: {Math.min(...sorted.slice(0, -1).map((p, i) => Math.round(Math.abs(sorted[i + 1].x - p.x))))} ms
                  </text>
                  <text
                    x={(first.x + last.x) / 2} y={by + 35}
                    textAnchor="middle"
                    fill="#facc15" fontSize="11" fontFamily="monospace" opacity={0.8}
                  >
                    min interval: {Math.min(...sorted.slice(0, -1).map((p, i) => Math.round(Math.abs(sorted[i + 1].x - p.x))))} ms
                  </text>
                </g>
              );
            })()}

            <rect
              x={marginX}
              y={rhythmTop}
              width={sheetWidth - marginX * 2}
              height={rhythmHeight}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onClick={handleSheetClick}
            />
          </g>
        </svg>
      </div>
    </div>
  );
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

// ── Butterworth lowpass filter (zero-phase, 2nd order) ────────────────────────
// Matches the 40 Hz filter applied by ecg.galliera.it for display smoothing.
// Uses forward + backward pass (filtfilt) to eliminate phase distortion.
function butterworthLowpass(signal: number[], fs: number, fc = 40): number[] {
  if (signal.length < 3 || fc <= 0 || fc >= fs / 2) return signal;

  // Bilinear transform coefficients for 2nd-order Butterworth lowpass
  const c = 1 / Math.tan(Math.PI * fc / fs);
  const c2 = c * c;
  const norm = 1 / (1 + Math.SQRT2 * c + c2);
  const b0 = norm;
  const b1 = 2 * norm;
  const b2 = norm;
  const a1 = 2 * norm * (1 - c2);
  const a2 = norm * (1 - Math.SQRT2 * c + c2);

  // Single-pass IIR filter
  function filterPass(x: number[]): number[] {
    const y = new Array(x.length).fill(0);
    for (let n = 0; n < x.length; n++) {
      y[n] = b0 * x[n]
           + b1 * (n >= 1 ? x[n - 1] : x[0])
           + b2 * (n >= 2 ? x[n - 2] : x[0])
           - a1 * (n >= 1 ? y[n - 1] : 0)
           - a2 * (n >= 2 ? y[n - 2] : 0);
    }
    return y;
  }

  // Forward pass, then reverse, then backward pass, then reverse again (filtfilt)
  const forward = filterPass(signal);
  forward.reverse();
  const backward = filterPass(forward);
  backward.reverse();
  return backward;
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
    const dataSet = dicomParser.parseDicom(byteArray);

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
    const channels: { label: string; sensitivity: number; baseline: number; scaleToMv: number }[] = [];
    for (let i = 0; i < numChannels; i++) {
      const ch = chanDefSeq?.items?.[i]?.dataSet;
      const rawLabel = ch?.string('x003a0203') ?? `Lead ${i + 1}`;
      const label = rawLabel.trim() || `Lead ${i + 1}`;
      const sensitivity = parseFloat(ch?.string('x003a0210') ?? '1') || 1;
      const corrFactor = parseFloat(ch?.string('x003a0212') ?? '1') || 1;
      const baseline = parseFloat(ch?.string('x003a0213') ?? '0') || 0;
      const scaleToMv = getSensitivityScaleToMv(ch);
      channels.push({ label, sensitivity, baseline, scaleToMv: scaleToMv * corrFactor });
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
        // DICOM waveform conversion: (sample + baseline) × sensitivity × correctionFactor.
        const amplitudeMv = (raw + ch.baseline) * ch.sensitivity * ch.scaleToMv;
        series[c].points.push([timeMs, amplitudeMv]);
      }
    }

    // Apply 40 Hz Butterworth lowpass filter (zero-phase) matching ecg.galliera.it
    const filteredSeries = series.map(channel => {
      const rawMv = channel.points.map(p => p[1]);
      const filtered = butterworthLowpass(rawMv, samplingFreq, 40);
      const points: [number, number][] = channel.points.map((p, i) => [p[0], filtered[i]]);
      return { ...channel, points };
    });

    return {
      axis: { x: { label: 'Time (ms)' }, y: { label: 'Amplitude (mV)' } },
      series: filteredSeries.map(channel => ({
        ...channel,
        points: downsampleSeriesPoints(channel.points),
      })),
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
      {/* How-it's-calculated box */}
      <div className="mt-2 rounded bg-black/30 px-2.5 py-2 font-mono text-xs leading-relaxed text-white/50">
        <div className="mb-1 font-sans font-semibold not-italic text-white/40 uppercase tracking-wide text-[10px]">How calculated</div>
        <div>
          Δt = |t<sub>{iv.to}</sub> − t<sub>{iv.from}</sub>| = <span className="text-white/75 font-semibold">{fmt(iv.ms, 0)} ms</span>
        </div>
        <div className="text-white/35">
          At 25 mm/s → 1 mm = 40 ms, 5 mm = 200 ms (1 large □)
        </div>
        <div>
          = <span className="text-white/65">{fmt(iv.largeBoxes, 2)}</span> large boxes × 200 ms
          &nbsp;=&nbsp;
          <span className="text-white/65">{fmt(iv.smallBoxes, 1)}</span> small boxes × 40 ms
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-2 text-xs text-white/45">
        <span>{fmt(iv.seconds, 3)} s</span>
        <span>{fmt(iv.ms, 0)} ms</span>
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
  imageQtMs?: number | null;
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
  imageQtMs = null,
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

  const imageQtSec = imageQtMs !== null ? imageQtMs / 1000 : null;
  const qtSec = qtInterval?.seconds ?? imageQtSec ?? manualQtSec;
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
        ) : imageQtMs !== null ? (
          <span>
            QT from uploaded ECG image B→D:{' '}
            <span className="font-semibold text-yellow-300">{fmt(imageQtMs, 0)} ms</span>
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
  const shouldRenderSheet = !imageUrl && isStandard12LeadLike(ecgData);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [estimatedPxPerBox, setEstimatedPxPerBox] = useState<number | null>(null);
  const [imageDisplayRect, setImageDisplayRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const pxBox = useMemo(() => {
    const parsed = parseFloat(imgCalibPxPerBox);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return estimatedPxPerBox;
  }, [estimatedPxPerBox, imgCalibPxPerBox]);
  const usingEstimatedCalibration = !imgCalibPxPerBox && estimatedPxPerBox !== null;
  const sortedImgPts = useMemo(() => [...imagePoints].sort((a, b) => a.x - b.x), [imagePoints]);
  const imgIntervals = useMemo(
    () =>
      sortedImgPts.slice(0, -1).map((p, i) => {
        const next = sortedImgPts[i + 1];
        const px = Math.round(Math.abs(next.x - p.x));
        const ms = pxBox ? Math.round((px / pxBox) * 200) : null;
        return { label: `${p.label} → ${next.label}`, px, ms };
      }),
    [pxBox, sortedImgPts]
  );
  const ptB = useMemo(() => imagePoints.find(p => p.label === 'B'), [imagePoints]);
  const ptD = useMemo(() => imagePoints.find(p => p.label === 'D'), [imagePoints]);
  const bdPx = useMemo(
    () => (ptB && ptD ? Math.round(Math.abs(ptD.x - ptB.x)) : null),
    [ptB, ptD]
  );
  const bdMs = useMemo(
    () => (bdPx && pxBox ? Math.round((bdPx / pxBox) * 200) : null),
    [bdPx, pxBox]
  );

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

  useEffect(() => {
    if (onQtFromImage && bdMs !== null) {
      onQtFromImage(bdMs);
    }
  }, [bdMs, onQtFromImage]);

  const updateEstimatedCalibration = useCallback(() => {
    if (!imageRef.current || !imageContainerRef.current) {
      return;
    }

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const renderedRect = imageRef.current.getBoundingClientRect();
    const nextRect = {
      left: renderedRect.left - containerRect.left,
      top: renderedRect.top - containerRect.top,
      width: renderedRect.width,
      height: renderedRect.height,
    };
    setImageDisplayRect(nextRect);

    const renderedWidth = renderedRect.width;
    if (!renderedWidth) {
      return;
    }

    // Default estimate: a standard ECG print spans about 10 seconds across the width,
    // which corresponds to 50 large boxes at 25 mm/s.
    setEstimatedPxPerBox(renderedWidth / 50);
  }, []);

  useEffect(() => {
    if (!imageUrl) {
      setEstimatedPxPerBox(null);
      return;
    }

    updateEstimatedCalibration();
    window.addEventListener('resize', updateEstimatedCalibration);
    return () => window.removeEventListener('resize', updateEstimatedCalibration);
  }, [imageUrl, updateEstimatedCalibration]);

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
        const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
          if (!imageDisplayRect) {
            return;
          }

          // Read coordinates before entering the async state updater —
          // e.currentTarget is nulled by React after the event completes.
          const rect = e.currentTarget.getBoundingClientRect();
          const localX = e.clientX - rect.left;
          const localY = e.clientY - rect.top;

          const insideImage =
            localX >= imageDisplayRect.left &&
            localX <= imageDisplayRect.left + imageDisplayRect.width &&
            localY >= imageDisplayRect.top &&
            localY <= imageDisplayRect.top + imageDisplayRect.height;

          if (!insideImage) {
            return;
          }

          const x = localX - imageDisplayRect.left;
          const y = localY - imageDisplayRect.top;

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
                      <span className="text-green-400 font-mono">
                        {Math.round(pxBox)} px = 200 ms
                        {usingEstimatedCalibration ? ' (estimated)' : ''}
                      </span>
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
              ref={imageContainerRef}
              role="button"
              tabIndex={0}
              className="relative overflow-hidden rounded border border-white/10 bg-black/20"
              style={{ cursor: calibMode || imagePoints.length < MAX_SELECTED_POINTS ? 'crosshair' : 'default' }}
              onClick={handleImageClick}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={uploadedFileName ?? 'ECG image'}
                className="pointer-events-none block w-full object-contain"
                style={{ maxHeight: 360 }}
                onLoad={updateEstimatedCalibration}
                draggable={false}
              />
              <svg
                className="pointer-events-none absolute"
                style={{
                  overflow: 'visible',
                  left: imageDisplayRect?.left ?? 0,
                  top: imageDisplayRect?.top ?? 0,
                  width: imageDisplayRect?.width ?? '100%',
                  height: imageDisplayRect?.height ?? '100%',
                }}
              >
                {/* Lines + measurement labels between consecutive points */}
                {imagePoints.slice(0, -1).map((pt, i) => {
                  const next = imagePoints[i + 1];
                  const midX = (pt.x + next.x) / 2;
                  const midY = Math.max(pt.y, next.y) + 18;
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
                      {ms !== null ? (
                        <>
                          <text
                            x={midX} y={midY}
                            textAnchor="middle"
                            fill="black" fontSize="13" fontWeight="bold" fontFamily="monospace"
                            stroke="black" strokeWidth={4} paintOrder="stroke"
                          >
                            {ms} ms
                          </text>
                          <text
                            x={midX} y={midY}
                            textAnchor="middle"
                            fill={lineColor} fontSize="13" fontWeight="bold" fontFamily="monospace"
                          >
                            {ms} ms
                          </text>
                          <text
                            x={midX} y={midY + 18}
                            textAnchor="middle"
                            fill="black" fontSize="13" fontFamily="monospace"
                            stroke="black" strokeWidth={3} paintOrder="stroke"
                          >
                            {(ms / 200).toFixed(2)} lg □ · {(ms / 40).toFixed(1)} sm □
                          </text>
                          <text
                            x={midX} y={midY + 18}
                            textAnchor="middle"
                            fill={lineColor} fontSize="13" fontFamily="monospace" opacity={0.9}
                          >
                            {(ms / 200).toFixed(2)} lg □ · {(ms / 40).toFixed(1)} sm □
                          </text>
                        </>
                      ) : (
                        <>
                          <text
                            x={midX} y={midY}
                            textAnchor="middle"
                            fill="black" fontSize="13" fontFamily="sans-serif"
                            stroke="black" strokeWidth={3} paintOrder="stroke"
                          >
                            set scale for ms
                          </text>
                          <text
                            x={midX} y={midY}
                            textAnchor="middle"
                            fill={lineColor} fontSize="13" fontFamily="sans-serif" opacity={0.9}
                          >
                            set scale for ms
                          </text>
                        </>
                      )}
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
                  <div
                    key={iv.label}
                    className="rounded border border-blue-500/30 bg-blue-900/20 px-3 py-2 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-yellow-300">{iv.label}</span>
                      {iv.ms !== null ? (
                        <span className="font-mono font-semibold text-yellow-300 text-xs">{iv.ms} ms</span>
                      ) : (
                        <span className="text-yellow-200/70 text-xs">— ms (set calibration)</span>
                      )}
                    </div>
                    {iv.ms !== null && (
                      <div className="font-mono text-yellow-200/75 text-[10px]">
                        = {(iv.ms / 200).toFixed(2)} large □ × 200 ms
                        &nbsp;=&nbsp;{(iv.ms / 40).toFixed(1)} small □ × 40 ms
                      </div>
                    )}
                  </div>
                ))}

                {/* B→D (QT) summary row */}
                {bdPx !== null && (
                  <div className="rounded border border-yellow-500/30 bg-yellow-900/10 px-3 py-2 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-yellow-300">B → D (QT Interval)</span>
                      <div className="flex items-center gap-2">
                      {bdMs !== null ? (
                        <>
                          <span className="font-mono font-semibold text-white">{bdMs} ms</span>
                          <span className="rounded bg-yellow-600/60 px-2 py-0.5 text-yellow-100">
                            Used in QTc
                          </span>
                        </>
                      ) : (
                          <span className="text-white/30">— ms</span>
                        )}
                      </div>
                    </div>
                    {bdMs !== null && (
                      <div className="font-mono text-white/40 text-[10px]">
                        = {(bdMs / 200).toFixed(2)} large □ × 200 ms
                        &nbsp;=&nbsp;{(bdMs / 40).toFixed(1)} small □ × 40 ms
                      </div>
                    )}
                  </div>
                )}

                {!pxBox && (
                  <div className="text-xs text-white/30 text-center">
                    Enter calibration above to convert pixels to milliseconds
                  </div>
                )}
                {usingEstimatedCalibration && (
                  <div className="text-xs text-yellow-300/80 text-center">
                    Using default ms estimate from ECG width. Calibrate manually if you need exact values.
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
          {shouldRenderSheet ? (
            <EcgSheetRenderer
              ecgData={ecgData}
              selectedPoints={selectedPoints}
              setSelectedPoints={setSelectedPoints}
            />
          ) : (
            <div
              className="h-[320px] overflow-hidden rounded border border-red-200/80 shadow-inner"
              style={ECG_PAPER_BG}
            >
              <LineChart
                showLegend={true}
                legendWidth={120}
                showAxisGrid={false}
                transparentChartBackground={true}
                axis={{
                  x: { label: axis.x.label, indexRef: 0, type: 'x', range: { min: 0 } },
                  y: { label: axis.y.label, indexRef: 1, type: 'y' },
                }}
                series={series}
                selectedPoints={selectedPoints}
                onPointClick={handlePointClick}
              />
            </div>
          )}

          {/* Unit info */}
          <div className="flex items-center justify-between rounded bg-white/5 px-3 py-1.5 text-xs text-white/50">
            <span>
              Y: <span className="font-semibold text-white/70">{ampUnit}</span>
              &nbsp;·&nbsp; X: <span className="font-semibold text-white/70">{timeUnit}</span>
            </span>
            <span>{shouldRenderSheet ? 'ECG sheet 25 mm/s, 10 mm/mV' : '25 mm/s'}</span>
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
                      className="rounded border border-white/10 bg-black/20 px-2 py-2 text-left text-xs hover:border-white/30"
                    >
                      {/* Point header: letter + clinical role */}
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${g.color}`}>{g.name}</span>
                        <span className="text-white/30">|</span>
                        <span className="text-white/65">{g.desc}</span>
                      </div>
                      {/* Time measurement */}
                      <div className="mb-0.5 font-mono">
                        <span className="text-white/40">t = </span>
                        <span className="font-semibold text-white">
                          {timeUnit === 'ms' ? fmt(pt.x, 0) : fmt(pt.x * 1000, 0)} ms
                        </span>
                        <span className="ml-1.5 text-white/30">
                          ({fmt((timeUnit === 'ms' ? pt.x : pt.x * 1000) / 200, 2)} lg box)
                        </span>
                      </div>
                      {/* Amplitude measurement */}
                      <div className="font-mono">
                        <span className="text-white/40">V = </span>
                        <span className={`font-semibold ${pt.y >= 0 ? 'text-cyan-300' : 'text-orange-300'}`}>
                          {fmt(pt.y, 3)} {ampUnit}
                        </span>
                        <span className="ml-1.5 text-white/30">
                          ({fmt(pt.y * 10, 1)} mm @ ×1 gain)
                        </span>
                      </div>
                      <div className="mt-1 text-white/25 italic">click to remove</div>
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
  const [imageQtMsA, setImageQtMsA] = useState<number | null>(null);
  const [genderA, setGenderA] = useState<Gender>('male');
  const [rrEntriesA, setRrEntriesA] = useState<string[]>(Array(MAX_RR_HRV).fill(''));
  const [qrsLeadI, setQrsLeadI] = useState('');
  const [qrsLeadAvF, setQrsLeadAvF] = useState('');

  // ECG B measurement state
  const [selectedPointsB, setSelectedPointsB] = useState<ChartPoint[]>([]);
  const [rrMsB, setRrMsB] = useState('');
  const [hrBpmB, setHrBpmB] = useState('');
  const [manualQtMsB, setManualQtMsB] = useState('');
  const [imageQtMsB, setImageQtMsB] = useState<number | null>(null);
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
          setImageQtMsA(null);
          setRrMsA(''); setHrBpmA(''); setManualQtMsA('');
        } else {
          setUploadedImageB(dataUrl);
          setUploadedEcgB(null);
          setUploadedEcgBName(file.name);
          setSelectedPointsB([]);
          setImageQtMsB(null);
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
          setImageQtMsA(null);
          setRrMsA(''); setHrBpmA(''); setManualQtMsA('');
        } else {
          setUploadedEcgB(parsed);
          setUploadedImageB(null);
          setUploadedEcgBName(file.name);
          setSelectedPointsB([]);
          setImageQtMsB(null);
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
        setImageQtMsA(null);
        setRrMsA(''); setHrBpmA(''); setManualQtMsA('');
      } else {
        setUploadedEcgB(parsed);
        setUploadedImageB(null);
        setUploadedEcgBName(file.name);
        setSelectedPointsB([]);
        setImageQtMsB(null);
        setRrMsB(''); setHrBpmB(''); setManualQtMsB('');
      }
    };
    reader.onerror = () => setUploadError(`Failed to read file "${file.name}".`);
    reader.readAsText(file);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-y-auto text-white">

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
        <PanelSection.Content className="bg-muted px-4 pt-3 pb-4">

          <div className={layoutMode === 'compare' ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>

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
              setImageQtMsA(null);
              setImagePointsA([]);
              setImgCalibPxPerBoxA('');
            }}
            showUploadButton={!ecgAData || !!uploadedEcgA || !!uploadedImageA}
            imagePoints={imagePointsA}
            setImagePoints={setImagePointsA}
            imgCalibPxPerBox={imgCalibPxPerBoxA}
            setImgCalibPxPerBox={setImgCalibPxPerBoxA}
            onQtFromImage={ms => {
              setImageQtMsA(ms);
              setManualQtMsA(String(ms));
            }}
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
                setImageQtMsB(null);
                setImagePointsB([]);
                setImgCalibPxPerBoxB('');
              }}
              showUploadButton={true}
              imagePoints={imagePointsB}
              setImagePoints={setImagePointsB}
              imgCalibPxPerBox={imgCalibPxPerBoxB}
              setImgCalibPxPerBox={setImgCalibPxPerBoxB}
              onQtFromImage={ms => {
                setImageQtMsB(ms);
                setManualQtMsB(String(ms));
              }}
            />
          )}

          </div>
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
            imageQtMs={imageQtMsA}
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
                imageQtMs={imageQtMsB}
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

      <EcgDocumentationSection />
    </div>
  );
}

// ── ECG Viewer Documentation Panel ────────────────────────────────────────────

function EcgDocumentationSection() {
  return (
    <PanelSection defaultOpen={false}>
      <PanelSection.Header>ECG Viewer — Documentation &amp; Formulas</PanelSection.Header>
      <PanelSection.Content className="bg-muted space-y-4 px-4 pt-3 pb-5 text-xs leading-relaxed text-white/60">

        {/* Overview */}
        <div>
          <div className="mb-1.5 font-semibold text-white/80 uppercase tracking-wide text-[10px]">Overview</div>
          <p>
            This viewer decodes DICOM Waveform IOD (SOP 1.2.840.10008.5.1.4.1.1.9.1.1) 12-lead
            ECG files, applies a clinical 40 Hz lowpass filter, and renders the waveform at
            standard paper scale (25 mm/s, 10 mm/mV). Interactive point placement lets you
            measure any fiducial interval directly on the rhythm strip.
          </p>
        </div>

        {/* Measurement workflow */}
        <div>
          <div className="mb-1.5 font-semibold text-white/80 uppercase tracking-wide text-[10px]">Measurement Workflow</div>
          <ol className="list-decimal pl-4 space-y-1 text-white/55">
            <li>Click the ECG waveform to place point <span className="font-bold text-blue-400">A</span> at P-wave onset.</li>
            <li>Click to place point <span className="font-bold text-green-400">B</span> at QRS onset (end of PR segment).</li>
            <li>Click to place point <span className="font-bold text-yellow-400">C</span> at QRS end / J-point.</li>
            <li>Click to place point <span className="font-bold text-orange-400">D</span> at T-wave end.</li>
            <li>All consecutive intervals (A→B, B→C, C→D) and derived QT (B→D) are computed automatically.</li>
          </ol>
        </div>

        {/* ECG paper standard */}
        <div>
          <div className="mb-1.5 font-semibold text-white/80 uppercase tracking-wide text-[10px]">ECG Paper Standard (IEC 60601-2-51 / AHA)</div>
          <div className="rounded bg-black/30 px-3 py-2.5 font-mono space-y-1">
            <div>Paper speed : 25 mm/s</div>
            <div>Small box   : 1 mm wide  = <span className="text-yellow-300">40 ms</span></div>
            <div>Large box   : 5 mm wide  = <span className="text-yellow-300">200 ms</span>  (5 small boxes)</div>
            <div>Amplitude   : gain ×1    → 10 mm = <span className="text-cyan-300">1 mV</span>  (2 large boxes tall)</div>
          </div>
        </div>

        {/* Clinical formulas */}
        <div>
          <div className="mb-1.5 font-semibold text-white/80 uppercase tracking-wide text-[10px]">Clinical Formulas</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-left">
                  <th className="pb-1.5 pr-3 font-semibold">Measurement</th>
                  <th className="pb-1.5 pr-3 font-semibold">Formula</th>
                  <th className="pb-1.5 font-semibold">Normal range</th>
                </tr>
              </thead>
              <tbody className="font-mono text-white/55">
                <tr className="border-b border-white/5">
                  <td className="py-1.5 pr-3 font-sans text-white/70">Any interval</td>
                  <td className="py-1.5 pr-3">Δt = n<sub>large</sub> × 200 ms = n<sub>small</sub> × 40 ms</td>
                  <td className="py-1.5 text-white/35">—</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-1.5 pr-3 font-sans text-white/70">PR interval (A→B)</td>
                  <td className="py-1.5 pr-3">t<sub>B</sub> − t<sub>A</sub></td>
                  <td className="py-1.5 text-green-400">120–200 ms</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-1.5 pr-3 font-sans text-white/70">QRS duration (B→C)</td>
                  <td className="py-1.5 pr-3">t<sub>C</sub> − t<sub>B</sub></td>
                  <td className="py-1.5 text-green-400">60–100 ms</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-1.5 pr-3 font-sans text-white/70">QT interval (B→D)</td>
                  <td className="py-1.5 pr-3">t<sub>D</sub> − t<sub>B</sub></td>
                  <td className="py-1.5 text-green-400">350–440 ms</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-1.5 pr-3 font-sans text-white/70">QTc Bazett</td>
                  <td className="py-1.5 pr-3">QT<sub>s</sub> / √RR<sub>s</sub> × 1000</td>
                  <td className="py-1.5 text-green-400">&lt;440 ms ♂ / &lt;460 ms ♀</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-1.5 pr-3 font-sans text-white/70">QTc Fridericia</td>
                  <td className="py-1.5 pr-3">QT<sub>s</sub> / ∛RR<sub>s</sub> × 1000</td>
                  <td className="py-1.5 text-green-400">&lt;440 ms ♂ / &lt;460 ms ♀</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-1.5 pr-3 font-sans text-white/70">Heart rate</td>
                  <td className="py-1.5 pr-3">HR = 60 000 / RR<sub>ms</sub></td>
                  <td className="py-1.5 text-green-400">60–100 bpm</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-3 font-sans text-white/70">QRS axis</td>
                  <td className="py-1.5 pr-3">θ = atan2(aVF, I) × 180/π</td>
                  <td className="py-1.5 text-green-400">−30° to +90°</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-white/35">
            Subscript <em>s</em> = value in seconds. Subscript <em>ms</em> = value in milliseconds.
          </p>
        </div>

        {/* DICOM signal conversion */}
        <div>
          <div className="mb-1.5 font-semibold text-white/80 uppercase tracking-wide text-[10px]">DICOM Signal Conversion (PS3.3 C.10.9.1.4)</div>
          <div className="rounded bg-black/30 px-3 py-2.5 font-mono space-y-1">
            <div className="text-white/70">V<sub>mV</sub> = (ADC + Baseline) × Sensitivity × CorrFactor × unit_scale</div>
            <div className="mt-2 text-white/35 space-y-0.5">
              <div>ADC        — raw 16-bit signed sample from tag (5400,1010)</div>
              <div>Baseline   — (003A,0213) Channel Baseline coded offset</div>
              <div>Sensitivity — (003A,0210) Channel Sensitivity (per LSB)</div>
              <div>CorrFactor — (003A,0212) Channel Sensitivity Correction Factor</div>
              <div>unit_scale — (003A,0211) units: µV → ÷1000 · mV → ×1 · V → ×1000</div>
            </div>
          </div>
        </div>

        {/* Signal processing */}
        <div>
          <div className="mb-1.5 font-semibold text-white/80 uppercase tracking-wide text-[10px]">Signal Processing Pipeline</div>
          <ol className="list-decimal pl-4 space-y-1.5 text-white/55">
            <li>
              <span className="font-semibold text-white/70">Butterworth 2nd-order lowpass at 40 Hz (zero-phase)</span>
              <div className="mt-0.5 font-mono text-white/35 text-[11px]">
                H(z) = b₀(1 + z⁻¹)² / (1 + a₁z⁻¹ + a₂z⁻²),  b₀ = 1/(1 + √2·c + c²),  c = 1/tan(π·fc/fs)
              </div>
              <div className="mt-0.5 text-white/35">
                Forward + backward pass (filtfilt) eliminates phase distortion — QRS timing is preserved.
              </div>
            </li>
            <li>
              <span className="font-semibold text-white/70">Min-max downsampling</span>
              <div className="mt-0.5 text-white/35">
                Keeps both the minimum and maximum sample in every display bucket so QRS spikes and
                P/T waves are never dropped during decimation.
              </div>
            </li>
          </ol>
        </div>

        {/* Technical stack */}
        <div>
          <div className="mb-1.5 font-semibold text-white/80 uppercase tracking-wide text-[10px]">Technical Stack</div>
          <div className="space-y-1 text-white/55">
            <div className="flex gap-2">
              <span className="w-32 shrink-0 font-semibold text-white/65">dicom-parser</span>
              <span>Low-level DICOM byte-stream parser — reads waveform sequence, channel definitions, and ADC data.</span>
            </div>
            <div className="flex gap-2">
              <span className="w-32 shrink-0 font-semibold text-white/65">D3.js</span>
              <span>SVG chart rendering via d3-selection, d3-scale, d3-shape — scales data coordinates to pixels and draws polyline paths.</span>
            </div>
            <div className="flex gap-2">
              <span className="w-32 shrink-0 font-semibold text-white/65">React 18</span>
              <span>Component UI, state management (useState / useMemo / useCallback / useRef).</span>
            </div>
            <div className="flex gap-2">
              <span className="w-32 shrink-0 font-semibold text-white/65">Tailwind CSS</span>
              <span>Utility-class styling — ECG paper background via repeating CSS linear-gradients.</span>
            </div>
            <div className="flex gap-2">
              <span className="w-32 shrink-0 font-semibold text-white/65">OHIF Viewer</span>
              <span>PanelSection, LineChart, and display-set service infrastructure from the OHIF platform.</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-2 text-white/25">
          ECG measurements are for educational and clinical-assistance purposes only.
          Always verify with a qualified clinician. Not a substitute for certified diagnostic equipment.
        </div>

      </PanelSection.Content>
    </PanelSection>
  );
}

export default ECGViewerPanel;
