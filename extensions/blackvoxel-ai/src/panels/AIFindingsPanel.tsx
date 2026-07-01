import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { utilities as cornerstoneUtilities } from '@cornerstonejs/core';
import { LanguageToggle } from '../components/LanguageToggle';
import {
  getInference,
  classifyMeasurements,
  InferenceError,
  InferenceFinding,
  InferenceResponse,
  IctResult,
  MeasuredValue,
  MeasurementResult,
} from '../services/inferenceClient';
import {
  clearAIBoundingBoxes,
  showAIBoundingBoxes,
  highlightAIBoundingBox,
  clearAIHighlight,
  findingKey,
  colorForFinding,
} from '../services/viewportOverlay';
import { toPtLabel, toSeverityDisplay, ANATOMY_PT, anatomyToPt } from '../utils/labels';
// SD-004: STATIC_DEMO_DATA is intentionally NOT imported here. It must never be
// used as a SILENT error fallback (the old error handler masked failed real
// inference as a canned "Pneumonia 87%"). staticDemoData.ts is retained for a
// future EXPLICIT demo flag; no such flag exists today, so it stays unimported.
// MIMPS-27: viewer-mode gate — AI inference is Research-mode only
import { useViewerMode } from '../stores/useViewerModeStore';
// MIMPS-28: live ruler (Length) measurements → classify wire shape
import { useLengthMeasurements } from '../hooks/useLengthMeasurements';
// MIMPS-33/36: clinical-mode flag + ephemeral clinical-context store
import { CLINICAL_MODE_ENABLED } from '../config/clinicalMode';
import { useClinicalContext } from '../stores/useClinicalContextStore';
// MIMPS-41: modality gate — AI is CR/DR/DX (chest X-ray) only.
import { useActiveModality, isCxrModality } from '../hooks/useActiveModality';
// MIMPS-40/42: worklist gate + persisted-AIResult fetch (persisted-first, live fallback).
import { isWorklistEnabled } from '../config/worklist';
import { getWorklistDetail, toInferenceResponse } from '../services/worklistClient';

// ---------------------------------------------------------------------------
// Brand constants (MIMPS-02 palette)
// ---------------------------------------------------------------------------

// VWR-BRAND-01 (2026-07): canonical BlackVoxel accent-dim (brand.css
// --bv-accent-dim), verified >=4.5:1 white-on-fill for the panel-header/
// button uses of this const.
const BRAND_VIOLET = '#5d5da0';
const TEXT_SECONDARY = '#A0ADB4';
const AMBER = '#D97706';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AIFindingsPanelProps {
  servicesManager?: unknown; // OHIF servicesManager — typed loosely at the extension boundary
  studyInstanceUID?: string;
  seriesInstanceUID?: string;
}

interface ViewerCaptureResult {
  imageDataUrl?: string;
  imageId?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function captureActiveViewportImage(
  servicesManager?: unknown
): Promise<ViewerCaptureResult> {
  if (!isObject(servicesManager)) {
    return {};
  }
  const services = servicesManager.services;
  if (!isObject(services)) {
    return {};
  }

  const viewportGridService = services.viewportGridService;
  const cornerstoneViewportService = services.cornerstoneViewportService;
  if (!isObject(viewportGridService) || !isObject(cornerstoneViewportService)) {
    return {};
  }

  const getActiveViewportId = viewportGridService.getActiveViewportId;
  const getCornerstoneViewport = cornerstoneViewportService.getCornerstoneViewport;
  if (typeof getActiveViewportId !== 'function' || typeof getCornerstoneViewport !== 'function') {
    return {};
  }

  const activeViewportId = getActiveViewportId.call(viewportGridService);
  if (!activeViewportId) {
    return {};
  }

  const viewport = getCornerstoneViewport.call(cornerstoneViewportService, activeViewportId);
  if (!isObject(viewport)) {
    return {};
  }

  const getCurrentImageId = viewport.getCurrentImageId;
  if (typeof getCurrentImageId !== 'function') {
    return {};
  }

  const imageId = getCurrentImageId.call(viewport);
  if (!imageId) {
    return {};
  }

  const canvas = document.createElement('canvas');
  await cornerstoneUtilities.loadImageToCanvas({
    canvas,
    imageId,
    thumbnail: false,
  });

  return {
    imageDataUrl: canvas.toDataURL('image/png'),
    imageId,
  };
}

// ---------------------------------------------------------------------------
// Clipboard helper (with non-clipboard-API fallback)
// ---------------------------------------------------------------------------

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_err) {
      // Fall through to the legacy path (e.g. permissions / insecure context).
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch (_err) {
    return false;
  }
}

function buildReportPlainText(report: InferenceResponse['report_draft']): string {
  const lines = [
    'TÉCNICA',
    report.tecnica,
    '',
    'ACHADOS',
    report.achados,
  ];
  // MIMPS-30: confirmed-only measurements subsection (assembled client-side).
  // Rendered between ACHADOS and IMPRESSÃO; omitted entirely when empty so the
  // copied draft stays clean and the AI TÉCNICA/ACHADOS/IMPRESSÃO contract is
  // untouched.
  if (report.medicoes && report.medicoes.trim().length > 0) {
    lines.push('', 'MEDIÇÕES', report.medicoes);
  }
  lines.push('', 'IMPRESSÃO', report.impressao);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner(): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-label={t('state.analyzing')}
        role="img"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={BRAND_VIOLET}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="text-[12px]"
        style={{ color: TEXT_SECONDARY }}
      >
        {t('state.analyzing')}
      </span>
    </div>
  );
}

function SeverityChip({ severity }: { severity: string }): React.ReactElement {
  const display = toSeverityDisplay(severity);
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: display.background, color: display.color }}
    >
      {display.label}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }): React.ReactElement {
  const pct = Math.round(confidence * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-sm bg-white/10">
        <div
          className="h-full rounded-sm"
          style={{ width: `${pct}%`, backgroundColor: BRAND_VIOLET }}
        />
      </div>
      <span
        className="min-w-[30px] text-right text-[11px] font-medium text-white"
        aria-label={`Confiança ${pct}%`}
      >
        {pct}%
      </span>
    </div>
  );
}

// CXR-12: calibration-band chip (provável / indeterminado / improvável).
const BAND_STYLE: Record<string, { bg: string; fg: string }> = {
  'provável': { bg: 'rgba(124,58,237,0.25)', fg: '#C4B5FD' },
  'indeterminado': { bg: 'rgba(217,119,6,0.25)', fg: '#FBBF24' },
  'improvável': { bg: 'rgba(255,255,255,0.08)', fg: '#A0ADB4' },
};

function BandChip({ band }: { band?: string }): React.ReactElement | null {
  if (!band) {
    return null;
  }
  if (band === 'experimental') {
    // Research-only experimental lane — loud red, never a clinical band.
    return (
      <span
        className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: 'rgba(239,68,68,0.28)', color: '#FCA5A5' }}
      >
        experimental
      </span>
    );
  }
  const style = BAND_STYLE[band] ?? BAND_STYLE['improvável'];
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {band}
    </span>
  );
}

/** CXR-32: pt-BR/en location phrase from CXR-31 grounding (null when ungrounded). */
function groundedLocationText(
  finding: InferenceFinding,
  t: (key: string, opts?: Record<string, unknown>) => string
): string | null {
  const lat = finding.laterality ? t(`findings.lat.${finding.laterality}`, { defaultValue: '' }) : '';
  const zone = finding.zone ? t(`findings.zone.${finding.zone}`, { defaultValue: '' }) : '';
  if (lat && zone) return t('findings.location', { zone, lat });
  if (zone) return t('findings.locationZoneOnly', { zone });
  if (lat) return t('findings.locationLatOnly', { lat });
  return null;
}

function FindingRow({ finding }: { finding: InferenceFinding }): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  // A localized finding (region or explicit box) maps to one viewport box; hover
  // or keyboard-focus highlights that box. Non-localized rows are inert.
  const localized = finding.region != null || finding.bounding_box != null;
  const boxColor = localized ? colorForFinding(finding) : null;

  const onEnter = useCallback(() => {
    if (localized) {
      highlightAIBoundingBox(findingKey(finding));
    }
  }, [localized, finding]);
  const onLeave = useCallback(() => {
    if (localized) {
      clearAIHighlight();
    }
  }, [localized]);

  return (
    <div
      className="rounded-md border border-white/10 bg-white/5 p-2.5"
      style={localized ? { cursor: 'default' } : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={localized ? 0 : undefined}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-white">
          {boxColor ? (
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: boxColor }}
            />
          ) : null}
          {toPtLabel(finding.label)}
          {finding.region ? (
            <span title="Localização aproximada disponível" aria-label="Localização disponível">
              {' '}
              ◎
            </span>
          ) : null}
        </span>
        {finding.band ? <BandChip band={finding.band} /> : <SeverityChip severity={finding.severity} />}
      </div>
      {(() => {
        const loc = groundedLocationText(finding, t);
        return loc ? (
          <div className="mb-1 text-[11px] font-medium text-white/55">{loc}</div>
        ) : null;
      })()}
      <ConfidenceBar confidence={finding.confidence} />
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      className="mb-1.5 text-[10px] font-bold tracking-wider"
      style={{ color: TEXT_SECONDARY }}
    >
      {children}
    </div>
  );
}

function UnlikelyGroup({ findings }: { findings: InferenceFinding[] }): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full cursor-pointer items-center gap-1.5 border-none bg-transparent px-0 py-1 text-left text-[11px] font-semibold max-md:min-h-[44px]"
        style={{ color: TEXT_SECONDARY }}
        aria-expanded={open}
      >
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
        {t('findings.unlikelyToggle', { count: findings.length })}
      </button>
      {open && (
        <div className="mt-1.5 flex flex-col gap-2">
          {findings.map((f, i) => (
            <FindingRow key={`${f.label}-${i}`} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CollapsibleReportProps {
  report: InferenceResponse['report_draft'];
}

function CollapsibleReport({ report }: CollapsibleReportProps): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const onCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(buildReportPlainText(report));
    if (ok) {
      setCopied(true);
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [report]);

  return (
    <div className="mt-2 border-t border-white/10">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-3 py-2.5 text-left text-[12px] font-semibold text-white max-md:min-h-[44px]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          {/* AI sparkle icon */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill={BRAND_VIOLET}
            aria-hidden="true"
          >
            <path d="M12 2l2.1 5.9L20 10l-5.9 2.1L12 18l-2.1-5.9L4 10l5.9-2.1L12 2zM19 15l1.05 2.95L23 19l-2.95 1.05L19 23l-1.05-2.95L15 19l2.95-1.05L19 15z" />
          </svg>
          {t('report.title')}
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
            style={{ backgroundColor: 'rgba(124,58,237,0.25)', color: '#C4B5FD' }}
          >
            ✦ {t('report.beta')}
          </span>
        </span>
        <span
          className="text-[10px]"
          style={{ color: TEXT_SECONDARY }}
          aria-hidden="true"
        >
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          {/* Clinical-document styling: monospace body on a subtle paper-like dark surface */}
          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            {(
              [
                { key: 'tecnica', label: t('report.section.technique'), value: report.tecnica },
                { key: 'achados', label: t('report.section.findings'), value: report.achados },
                // MIMPS-30: confirmed-only measurements; rendered only when present,
                // between ACHADOS and IMPRESSÃO. TÉCNICA/ACHADOS/IMPRESSÃO intact.
                ...(report.medicoes && report.medicoes.trim().length > 0
                  ? [{ key: 'medicoes', label: t('report.section.medicoes'), value: report.medicoes }]
                  : []),
                { key: 'impressao', label: t('report.section.impression'), value: report.impressao },
              ] as const
            ).map(({ key, label, value }) => (
              <div
                key={key}
                className="mb-3 last:mb-0"
              >
                <div
                  className="mb-1 text-[10px] font-bold tracking-wider"
                  style={{ color: '#C4B5FD' }}
                >
                  {label}
                </div>
                <p className="m-0 font-mono text-[11px] leading-relaxed text-white/90">{value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onCopy}
            className="mt-2 w-full cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors max-md:min-h-[44px]"
            style={{ backgroundColor: copied ? '#10B981' : BRAND_VIOLET }}
            aria-live="polite"
          >
            {copied ? t('report.copied') : t('report.copy')}
          </button>

          <p
            className="mb-0 mt-2 text-[10px] leading-snug"
            style={{ color: AMBER }}
          >
            {t('report.disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MIMPS-29: measurements (ruler → structure suggest/confirm) sub-components
// ---------------------------------------------------------------------------

/** The 14 segmentation structure keys (= seg_inference.TARGETS), for the dropdown. */
const STRUCTURE_KEYS = Object.keys(ANATOMY_PT);

/** Sentinel dropdown option for a free-typed pt-BR label ("Outro…"). */
const FREE_LABEL_OPTION = '__other__';

/**
 * One confirmed measurement, the single source of truth for the report
 * injection (MIMPS-30). Assembled from the classify result + user overrides.
 */
interface ConfirmedMeasurement {
  id: string;
  /** Final structure label (pt-BR), AI-suggested or user-overridden. */
  structureLabel: string;
  /** Display value already formatted with the calibration flag. */
  valueText: string;
}

/** Format mm with the calibration flag (amber "não calibrado" when uncalibrated). */
function formatMmText(
  mm: MeasurementResult['mm'],
  uncalibratedWord: string
): string {
  if (mm.value === null || mm.value === undefined) {
    return '—';
  }
  const rounded = Math.round(mm.value * 10) / 10;
  return mm.calibrated
    ? `≈ ${rounded} mm`
    : `≈ ${rounded} px · ${uncalibratedWord}`;
}

interface FindingMeasurementRowProps {
  result: MeasurementResult;
  confirmed: boolean;
  onConfirm: (m: ConfirmedMeasurement) => void;
  onUnconfirm: (id: string) => void;
}

/**
 * A single ruler measurement card: AI suggestion chip, a 14-structure override
 * dropdown (+ free pt-BR label), the value with an AMBER "não calibrado" badge
 * when uncalibrated, an ICT non-diagnostic caption, and a per-measurement
 * Confirm gate. Nothing reaches the report until Confirm is pressed.
 */
function FindingMeasurementRow({
  result,
  confirmed,
  onConfirm,
  onUnconfirm,
}: FindingMeasurementRowProps): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');

  const suggestedKey = result.suggested_structure?.key ?? '';
  // Dropdown selection: a structure key, the free-label sentinel, or '' (none).
  const [selection, setSelection] = useState<string>(suggestedKey);
  const [freeLabel, setFreeLabel] = useState<string>('');

  const isUncalibrated = result.mm.calibrated === false;
  const valueText = formatMmText(result.mm, t('measurement.uncalibrated'));

  // Resolve the effective pt-BR structure label from the current selection.
  const resolvedLabel =
    selection === FREE_LABEL_OPTION
      ? freeLabel.trim()
      : selection
        ? anatomyToPt(selection)
        : '';

  const canConfirm = resolvedLabel.length > 0;

  const handleConfirm = (): void => {
    if (!canConfirm) {
      return;
    }
    onConfirm({ id: result.id, structureLabel: resolvedLabel, valueText });
  };

  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-2.5">
      {/* Suggestion chip (or abstain note) */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {result.suggested_structure ? (
          <span
            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: 'rgba(124,58,237,0.25)', color: '#C4B5FD' }}
          >
            {t('measurement.suggestion', {
              label: result.suggested_structure.label_pt,
            })}
          </span>
        ) : (
          <span className="text-[10px] italic" style={{ color: TEXT_SECONDARY }}>
            {t('measurement.noSuggestion')}
          </span>
        )}
        {/* ICT-context caption — measurement, not diagnosis (SD-004). */}
        <span className="text-[9px]" style={{ color: TEXT_SECONDARY }}>
          {t('measurement.measurementNotDiagnosis')}
        </span>
      </div>

      {/* Override dropdown: 14 structures + free pt-BR label */}
      <div className="mb-1.5 flex flex-col gap-1.5">
        <label className="sr-only">{t('measurement.overrideLabel')}</label>
        <select
          value={selection}
          onChange={e => setSelection(e.target.value)}
          disabled={confirmed}
          className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white max-md:min-h-[44px]"
          aria-label={t('measurement.overrideLabel')}
        >
          <option value="">{t('measurement.noSuggestion')}</option>
          {STRUCTURE_KEYS.map(key => (
            <option key={key} value={key}>
              {anatomyToPt(key)}
            </option>
          ))}
          <option value={FREE_LABEL_OPTION}>{t('measurement.overrideOther')}</option>
        </select>
        {selection === FREE_LABEL_OPTION && (
          <input
            type="text"
            value={freeLabel}
            onChange={e => setFreeLabel(e.target.value)}
            disabled={confirmed}
            placeholder={t('measurement.overrideFreePlaceholder')}
            className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white max-md:min-h-[44px]"
            aria-label={t('measurement.overrideFreePlaceholder')}
          />
        )}
      </div>

      {/* Value with calibration flag */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[12px] font-bold text-white">{valueText.split(' · ')[0]}</span>
        {isUncalibrated && (
          <span
            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: 'rgba(217,119,6,0.20)', color: AMBER }}
            title={result.mm.note}
          >
            {t('measurement.uncalibrated')}
          </span>
        )}
      </div>

      {/* Confirm gate — nothing enters the report unconfirmed */}
      {confirmed ? (
        <button
          onClick={() => onUnconfirm(result.id)}
          className="w-full cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white max-md:min-h-[44px]"
          style={{ backgroundColor: 'rgba(16,185,129,0.20)', color: '#34D399' }}
        >
          ✓ {t('measurement.confirmed')} · {t('measurement.unconfirm')}
        </button>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors max-md:min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          {t('measurement.confirm')}
        </button>
      )}

      <p className="mb-0 mt-1.5 text-[9px] leading-snug" style={{ color: TEXT_SECONDARY }}>
        {result.disclaimer}
      </p>
    </div>
  );
}

/** Study-level ICT chip — always a ratio, never a cardiomegaly diagnosis. */
function IctChip({ ict }: { ict: IctResult }): React.ReactElement | null {
  const { t } = useTranslation('blackvoxel-ai');
  if (!ict.measurable || ict.ict === null || ict.ict === undefined) {
    return null;
  }
  const value = Math.round(ict.ict * 100) / 100;
  return (
    <div className="mb-2 flex items-center gap-2">
      <span
        className="inline-block rounded px-2 py-0.5 text-[11px] font-bold"
        style={{ backgroundColor: 'rgba(124,58,237,0.25)', color: '#C4B5FD' }}
      >
        {t('measurement.ict', { value })}
      </span>
      <span className="text-[10px]" style={{ color: TEXT_SECONDARY }} title={ict.note}>
        {t('measurement.ictNote')}
      </span>
    </div>
  );
}

interface MeasurementsSectionProps {
  servicesManager?: unknown;
  studyInstanceUID?: string;
  seriesInstanceUID?: string;
  /** Lifts the confirmed-measurement list up for report injection (MIMPS-30). */
  onConfirmedChange: (rows: ConfirmedMeasurement[], ict: IctResult | null) => void;
}

/**
 * The Medições section: subscribes to live Length measurements (MIMPS-28),
 * POSTs them to the classify lane, and renders a suggest/confirm card per
 * measurement. Gated to Research mode by the caller; a 503 (SEG disabled) or
 * empty result is a clean no-op (the manual ruler tool is never affected).
 */
function MeasurementsSection({
  servicesManager,
  studyInstanceUID,
  seriesInstanceUID,
  onConfirmedChange,
}: MeasurementsSectionProps): React.ReactElement | null {
  const { t } = useTranslation('blackvoxel-ai');
  const measurements = useLengthMeasurements(servicesManager, seriesInstanceUID);

  const [results, setResults] = useState<MeasurementResult[]>([]);
  const [ict, setIct] = useState<IctResult | null>(null);
  const [abstain, setAbstain] = useState(false);
  const [disabled, setDisabled] = useState(false);
  // Map of measurement id → confirmed row (only confirmed reach the report).
  const [confirmedById, setConfirmedById] = useState<Record<string, ConfirmedMeasurement>>({});

  // Re-classify whenever the live measurement set changes.
  useEffect(() => {
    if (measurements.length === 0) {
      setResults([]);
      setIct(null);
      setAbstain(false);
      return;
    }

    let cancelled = false;

    async function run(): Promise<void> {
      let capture: ViewerCaptureResult = {};
      try {
        capture = await captureActiveViewportImage(servicesManager);
      } catch (err) {
        console.warn('[blackvoxel-ai] measurement capture failed:', err);
      }
      if (!capture.imageDataUrl) {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const studyUid = studyInstanceUID ?? params.get('StudyInstanceUIDs') ?? '';

      try {
        const res = await classifyMeasurements({
          study_uid: studyUid,
          series_uid: seriesInstanceUID ?? null,
          modality: 'CXR',
          image_data_url: capture.imageDataUrl,
          image_id: capture.imageId ?? null,
          measurements: measurements as MeasuredValue[],
        });
        if (cancelled) {
          return;
        }
        setDisabled(false);
        setAbstain(res.abstain);
        setIct(res.ict);
        setResults(res.abstain ? [] : res.measurements);
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }
        if (err instanceof InferenceError && err.status === 503) {
          // SEG disabled — quiet no-op; manual ruler keeps working.
          setDisabled(true);
          setResults([]);
          setIct(null);
          return;
        }
        if (err instanceof InferenceError && err.status === 401) {
          // classifyMeasurements already triggered the SSO redirect.
          return;
        }
        console.warn('[blackvoxel-ai] classifyMeasurements failed:', err);
        setResults([]);
        setIct(null);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [measurements, servicesManager, studyInstanceUID, seriesInstanceUID]);

  // Prune confirmations whose measurement no longer exists, then lift up.
  useEffect(() => {
    const liveIds = new Set(measurements.map(m => m.id));
    setConfirmedById(prev => {
      let changed = false;
      const next: Record<string, ConfirmedMeasurement> = {};
      for (const [id, row] of Object.entries(prev)) {
        if (liveIds.has(id)) {
          next[id] = row;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [measurements]);

  useEffect(() => {
    onConfirmedChange(Object.values(confirmedById), ict);
  }, [confirmedById, ict, onConfirmedChange]);

  const handleConfirm = useCallback((row: ConfirmedMeasurement) => {
    setConfirmedById(prev => ({ ...prev, [row.id]: row }));
  }, []);

  const handleUnconfirm = useCallback((id: string) => {
    setConfirmedById(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Nothing to show: no measurements, or the lane is disabled (503).
  if (disabled || (measurements.length === 0 && !ict)) {
    return null;
  }

  return (
    <div className="border-t border-white/10 px-3 py-3">
      <div
        className="mb-2 text-[11px] font-bold tracking-wider"
        style={{ color: TEXT_SECONDARY }}
      >
        {t('measurement.section.title', { count: results.length })}
      </div>

      {ict && <IctChip ict={ict} />}

      {abstain ? (
        <p className="m-0 text-[11px] italic" style={{ color: TEXT_SECONDARY }}>
          {t('measurement.abstain')}
        </p>
      ) : results.length === 0 ? (
        <p className="m-0 text-[11px]" style={{ color: TEXT_SECONDARY }}>
          {t('measurement.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map(r => (
            <FindingMeasurementRow
              key={r.id}
              result={r}
              confirmed={Boolean(confirmedById[r.id])}
              onConfirm={handleConfirm}
              onUnconfirm={handleUnconfirm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

function AIFindingsPanel({
  servicesManager,
  studyInstanceUID,
  seriesInstanceUID,
}: AIFindingsPanelProps): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  // MIMPS-27: gate — all hooks must be called unconditionally (Rules of Hooks).
  // The mode value guards the effect body so getInference never fires outside an
  // allowed mode.
  const { mode } = useViewerMode();
  // MIMPS-36: ephemeral clinical context (populated by PatientContextPanel),
  // attached to the InferenceRequest in clinical mode only.
  const { context: clinicalContext } = useClinicalContext();

  // MIMPS-41: modality gate — the proxy-txv-v1 lane is chest-radiograph only
  // (CR/DR/DX). MR/CT/other are transport-only (no model): the panel shows a
  // neutral "not available for this modality" message and fires NO inference and
  // NO persisted-result fetch. The CXR path below is unchanged.
  const modality = useActiveModality(servicesManager);
  // null modality = study not yet resolved; treat as eligible so the CXR demo
  // (single-CR study) is byte-identical to today and we never flash the gate on
  // a study whose displaySets just haven't loaded. The gate trips only once a
  // concrete non-CXR modality is known.
  const modalityEligible = modality === null || isCxrModality(modality);

  // MIMPS-33: AI inference runs in research mode, OR clinical mode when the
  // CLINICAL_MODE_ENABLED flag is on. Default (flag off) is research-only —
  // identical to the legacy behaviour.
  const clinicalEnabled = CLINICAL_MODE_ENABLED && mode === 'clinical';
  const inferenceAllowed = (mode === 'research' || clinicalEnabled) && modalityEligible;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InferenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  // MIMPS-42: provenance of the rendered findings — 'persisted' (stored at
  // ingest, no live call) vs 'live' (just run). Drives the header source chip.
  const [source, setSource] = useState<'persisted' | 'live'>('live');
  // MIMPS-29/30: confirmed measurements (+ ICT) lifted from the Medições section.
  const [confirmedMeasurements, setConfirmedMeasurements] = useState<ConfirmedMeasurement[]>([]);
  const [confirmedIct, setConfirmedIct] = useState<IctResult | null>(null);

  const handleConfirmedChange = useCallback(
    (rows: ConfirmedMeasurement[], ict: IctResult | null) => {
      setConfirmedMeasurements(rows);
      setConfirmedIct(ict);
    },
    []
  );

  // MIMPS-30: assemble the confirmed-only Medições text for the report draft.
  // ICT is included only when a cardiac/thoracic pair was measurable; it is a
  // dimensionless ratio, framed as "medição, não diagnóstico" (SD-004).
  const medicoesText = (() => {
    const lines: string[] = [];
    if (confirmedIct && confirmedIct.measurable && confirmedIct.ict != null) {
      const value = Math.round(confirmedIct.ict * 100) / 100;
      lines.push(`${t('measurement.ict', { value })} — ${t('measurement.ictNote')}`);
    }
    for (const row of confirmedMeasurements) {
      lines.push(`${row.structureLabel}: ${row.valueText} — ${t('measurement.measurementNotDiagnosis')}`);
    }
    return lines.join('\n');
  })();

  useEffect(() => {
    // MIMPS-27/33: AI inference requires an allowed mode — research always, or
    // clinical when CLINICAL_MODE_ENABLED (ships dark, default off).
    // Rationale: Research = de-identified / non-PHI → external model calls
    // (including Gemini/MedGemma) are permitted. Clinical = PHI context →
    // gated behind the flag + a compliant deployment (RG-08).
    if (!inferenceAllowed) {
      // Ensure any stale overlay from a previous session is cleared.
      clearAIBoundingBoxes();
      // Reset inference state so switching back to research triggers a fresh run.
      setLoading(true);
      setData(null);
      setError(null);
      setUsingFallback(false);
      setSessionExpired(false);
      return;
    }

    // Resolve study/series UIDs: prefer props, fall back to URL query params.
    const params = new URLSearchParams(window.location.search);
    const studyUid = studyInstanceUID ?? params.get('StudyInstanceUIDs') ?? '';
    const seriesUid = seriesInstanceUID ?? '';

    let cancelled = false;

    function drawOverlay(result: InferenceResponse, imageId?: string): void {
      // Findings draw a viewport overlay when they carry a bounding_box
      // (mock/static lanes) or a normalized Grad-CAM region (CXR-10, live
      // proxy). Findings with neither are skipped — we never fabricate a box.
      if (!imageId) {
        return;
      }
      try {
        showAIBoundingBoxes({ servicesManager, imageId, findings: result.findings });
      } catch (err) {
        console.warn('[blackvoxel-ai] viewport overlay failed:', err);
      }
    }

    async function run(): Promise<void> {
      let capture: ViewerCaptureResult = {};
      try {
        capture = await captureActiveViewportImage(servicesManager);
      } catch (err) {
        console.warn('[blackvoxel-ai] viewport capture failed:', err);
      }

      // MIMPS-42: persisted-first. When the worklist gate is on, fetch the
      // latest persisted AIResult for this study and render it WITHOUT a live
      // inference call (faster, deterministic, no redundant model run). Any
      // miss (no persisted result, study unknown, worklist API off, or a
      // transient error) falls through to the live path below, byte-identical
      // to today. Auth (401) is the only hard stop — it triggers the SSO
      // redirect and must not silently fall back to live.
      if (isWorklistEnabled() && studyUid) {
        try {
          const detail = await getWorklistDetail(studyUid);
          if (cancelled) {
            return;
          }
          if (detail?.ai_result) {
            const persisted = toInferenceResponse(detail.ai_result, studyUid);
            setData(persisted);
            setSource('persisted');
            setUsingFallback(false);
            setLoading(false);
            // Persisted findings carry the same region/bounding_box fields the
            // overlay already draws — render the Grad-CAM via the SAME path.
            drawOverlay(persisted, capture.imageId);
            return;
          }
          // detail with no ai_result (e.g. transport-only or inference was off
          // at ingest) → fall through to live inference.
        } catch (err: unknown) {
          if (cancelled) {
            return;
          }
          if (err instanceof InferenceError && err.status === 401) {
            // getWorklistDetail already evicted the token + triggered the SSO
            // redirect. Never fall back on an auth failure.
            setSessionExpired(true);
            setLoading(false);
            return;
          }
          // Any other worklist error: treat as "no persisted result" and fall
          // through to the live path so a worklist outage never breaks CXR AI.
          console.warn('[blackvoxel-ai] worklist detail fetch failed; falling back to live:', err);
        }
      }

      setSource('live');
      try {
        const result = await getInference({
          study_uid: studyUid,
          series_uid: seriesUid,
          modality: 'CXR',
          image_data_url: capture.imageDataUrl,
          image_id: capture.imageId,
          // MIMPS-36: attach the de-identified clinical context ONLY in clinical
          // mode (and only when one has been consented + fetched). Research-mode
          // requests stay byte-identical to today (field absent).
          ...(clinicalEnabled && clinicalContext
            ? { clinical_context: clinicalContext }
            : {}),
        });
        if (!cancelled) {
          setData(result);
          setLoading(false);
          drawOverlay(result, capture.imageId);
        }
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }

        if (err instanceof InferenceError && err.status === 401) {
          // getInference already evicted the token and triggered the SSO
          // redirect; show a brief message. Never fall back to static data
          // on auth failures.
          setSessionExpired(true);
          setLoading(false);
          return;
        }

        // SD-004: any other error shows an HONEST error state — NEVER a
        // fabricated finding. Do not surface STATIC_DEMO_DATA (the old behavior
        // masked a failed real inference as a canned "Pneumonia 87%" + box,
        // which presents a fabricated diagnosis as if it were a model result).
        // Clear any AI boxes, leave data null so the panel renders the error
        // ("IA indisponível" + the message) with no finding and no overlay.
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        clearAIBoundingBoxes();
        setData(null);
        setError(message);
        setUsingFallback(false);
        setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
      // Panel closing / re-running: never leave stale AI boxes on the viewport.
      clearAIBoundingBoxes();
    };
  }, [
    mode,
    inferenceAllowed,
    // NOTE (2026-06-26 regression fix): `modality` is deliberately NOT a
    // dependency. It resolves null→'CR' asynchronously on DISPLAY_SETS_ADDED and
    // can briefly oscillate as the hanging protocol re-runs. Including it re-ran
    // THIS effect mid-inference; the cleanup set `cancelled=true`, so the
    // in-flight 200 landed in the `if (!cancelled)` guard and was DROPPED before
    // `setLoading(false)` + `drawOverlay` ever ran — the read spun forever and no
    // box drew. Modality *eligibility* transitions (the only thing that should
    // re-run this effect) are already folded into `inferenceAllowed`, which is
    // what the body actually reads; the raw `modality` string is never
    // referenced here, so excluding it is exhaustive-deps clean.
    clinicalEnabled,
    clinicalContext,
    servicesManager,
    studyInstanceUID,
    seriesInstanceUID,
  ]);

  // --- MIMPS-41: modality gate — non-CXR (MR/CT/other) is transport-only ---
  // The mode is allowed but the active study is not a chest radiograph, so the
  // proxy-txv-v1 lane does not apply. Show a NEUTRAL "not available for this
  // modality" message (info icon, not a lock/error) and render no inference
  // state. The effect above already fired no inference and no worklist fetch
  // for this study, so no request was ever made. PT/EN via i18n.
  const isModalityBlocked = (mode === 'research' || clinicalEnabled) && !modalityEligible;
  if (isModalityBlocked) {
    return (
      <div className="flex h-full flex-col bg-black text-[13px]">
        <div
          className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          <span className="text-[13px] font-bold text-white">{t('panel.title')}</span>
          <span className="ml-auto">
            <LanguageToggle />
          </span>
        </div>

        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
          role="status"
          aria-live="polite"
        >
          {/* Info icon — neutral, never an error/lock; this is an expected state */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TEXT_SECONDARY}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>

          <p
            className="m-0 max-w-[220px] text-[12px] leading-snug"
            style={{ color: TEXT_SECONDARY }}
          >
            {t('placeholder.aiModalityUnavailable')}
          </p>
        </div>
      </div>
    );
  }

  // --- MIMPS-27/33: inference-disabled mode — AI models off ---
  // Render a bilingual placeholder; no inference state is shown. Reached in
  // research-disabled states: no mode yet, or clinical mode with the flag off.
  // (MIMPS-26: DICOM import now lives at the top of the study list, not here.)
  if (!inferenceAllowed) {
    return (
      <div className="flex h-full flex-col bg-black text-[13px]">
        {/* Keep the panel header so the panel feels anchored */}
        <div
          className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          <span className="text-[13px] font-bold text-white">{t('panel.title')}</span>
          <span className="ml-auto">
            <LanguageToggle />
          </span>
        </div>

        {/* Placeholder */}
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
          role="status"
          aria-live="polite"
        >
          {/* Lock icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TEXT_SECONDARY}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>

          <p
            className="m-0 max-w-[220px] text-[12px] leading-snug"
            style={{ color: TEXT_SECONDARY }}
          >
            {t('placeholder.aiResearchOnly')}
          </p>
        </div>
      </div>
    );
  }

  // --- Session expired state ---
  if (sessionExpired) {
    return (
      <div
        className="flex h-full items-center justify-center bg-black p-6 text-center text-[13px]"
        style={{ color: TEXT_SECONDARY }}
      >
        {t('state.sessionExpired')}
      </div>
    );
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <Spinner />
      </div>
    );
  }

  // --- SD-004: honest error state ---
  // A non-401 inference failure leaves `data` null and `error` set. NEVER
  // fabricate a finding here (the removed fallback rendered a canned
  // "Pneumonia 87%" + box). Show an honest "IA indisponível" message with the
  // underlying error, no findings list, and no overlay (boxes already cleared).
  if (!data) {
    return (
      <div className="flex h-full flex-col bg-black text-[13px]">
        <div
          className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          <span className="text-[13px] font-bold text-white">{t('panel.title')}</span>
          <span className="ml-auto">
            <LanguageToggle />
          </span>
        </div>
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
          role="status"
          aria-live="polite"
        >
          {/* Warning icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="m-0 max-w-[220px] text-[13px] font-semibold leading-snug text-[#FBBF24]">
            IA indisponível
          </p>
          {error && (
            <p
              className="m-0 max-w-[240px] text-[11px] leading-snug"
              style={{ color: TEXT_SECONDARY }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // At this point data is guaranteed to be set (a real or persisted result).
  const result = data as InferenceResponse;
  const hasAnyLocalization = result.findings.some(
    f => f.bounding_box !== null || f.region != null
  );
  const processingSeconds = (result.inference_time_ms / 1000).toFixed(1);

  // CXR-12: the live multi-label proxy bands each finding. Group by band so the
  // full read is legible (present prominent, uncertain secondary, unlikely
  // collapsed). Legacy lanes without bands fall back to a flat list.
  const hasBands = result.findings.some(f => f.band);
  const present = result.findings.filter(f => f.band === 'provável');
  const uncertain = result.findings.filter(f => f.band === 'indeterminado');
  const unlikely = result.findings.filter(
    f => f.band && f.band !== 'provável' && f.band !== 'indeterminado'
  );

  // --- Panel (success or fallback) ---
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-black text-[13px]">
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5"
        style={{ backgroundColor: BRAND_VIOLET }}
      >
        <span className="text-[13px] font-bold text-white">{t('panel.title')}</span>
        <span className="ml-auto flex items-center gap-1">
          <LanguageToggle />
          <span className="text-[10px] text-white/70">{result.model_version}</span>
          {/* MIMPS-42: provenance — persisted (stored at ingest) vs live. An
              honest, small label so the radiologist knows a persisted read is a
              previously-computed analysis, not one just run now. */}
          {source === 'persisted' && (
            <span
              className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white"
              title={t('source.persistedTooltip')}
            >
              {t('source.persisted')}
            </span>
          )}
          {result.is_mock && (
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {t('panel.badge.mock')}
            </span>
          )}
          {!result.is_mock && result.is_research && (
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {t('panel.badge.research')}
            </span>
          )}
          {!result.is_mock && result.model_version.includes('experimental') && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}
            >
              {t('panel.badge.experimental')}
            </span>
          )}
        </span>
      </div>

      {/* Offline / fallback banner */}
      {usingFallback && (
        <div
          role="status"
          aria-live="polite"
          className="flex-shrink-0 border-b px-3 py-1.5 text-[11px]"
          style={{
            backgroundColor: 'rgba(120, 53, 15, 0.35)',
            borderColor: 'rgba(217, 119, 6, 0.4)',
            color: '#FBBF24',
          }}
        >
          {t('state.offlineBanner')}
          {error && <span className="ml-1 text-[#F59E0B]">({error})</span>}
        </div>
      )}

      {/* Findings */}
      <div className="flex-1 p-3">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span
            className="text-[11px] font-bold tracking-wider"
            style={{ color: TEXT_SECONDARY }}
          >
            {hasBands
              ? t('findings.headerBands', { count: present.length })
              : t('findings.header', { count: result.findings.length })}
          </span>
          <span
            className="text-[10px]"
            style={{ color: TEXT_SECONDARY }}
          >
            {t('findings.processedIn', { seconds: processingSeconds })}
          </span>
        </div>

        {result.findings.length === 0 ? (
          <p className="m-0 text-[12px]" style={{ color: TEXT_SECONDARY }}>
            {t('state.noFindings')}
          </p>
        ) : hasBands ? (
          <div className="flex flex-col gap-3">
            {present.length > 0 && (
              <div>
                <GroupLabel>{t('findings.group.probable', { count: present.length })}</GroupLabel>
                <div className="flex flex-col gap-2">
                  {present.map((f, i) => (
                    <FindingRow key={`p-${f.label}-${i}`} finding={f} />
                  ))}
                </div>
              </div>
            )}
            {uncertain.length > 0 && (
              <div>
                <GroupLabel>{t('findings.group.uncertain', { count: uncertain.length })}</GroupLabel>
                <div className="flex flex-col gap-2">
                  {uncertain.map((f, i) => (
                    <FindingRow key={`u-${f.label}-${i}`} finding={f} />
                  ))}
                </div>
              </div>
            )}
            {present.length === 0 && uncertain.length === 0 && (
              <p className="m-0 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                {t('state.noProbableOrUncertain')}
              </p>
            )}
            {unlikely.length > 0 && <UnlikelyGroup findings={unlikely} />}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {result.findings.map((finding, idx) => (
              <FindingRow key={`${finding.label}-${idx}`} finding={finding} />
            ))}
          </div>
        )}

        {result.findings.length > 0 && !hasAnyLocalization && (
          <p
            className="mb-0 mt-2.5 text-[10px] italic"
            style={{ color: TEXT_SECONDARY }}
          >
            {t('findings.noLocalization')}
          </p>
        )}
      </div>

      {/* MIMPS-42: the report draft, consistency gate, and live ruler
          measurements are LIVE-inference artifacts. A persisted (stored-at-
          ingest) read renders findings + Grad-CAM + provenance only — we never
          fabricate or re-derive a draft from a stored result. Gate all of it to
          the live source; the non-diagnostic disclaimer below shows for both. */}
      {source === 'live' && (
        <>
          {/* CXR-26: which model wrote the draft + flag when the paid model is unavailable */}
          <div
            className="mx-3 mt-2 flex flex-wrap items-center gap-1.5 text-[10px]"
            style={{ color: TEXT_SECONDARY }}
          >
            <span>
              {result.report_source === 'medgemma'
                ? t('report.source.medgemma')
                : t('report.source.free')}
            </span>
            {result.report_source !== 'medgemma' && result.paid_report_available === false && (
              <span
                className="rounded px-1.5 py-0.5"
                style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#FBBF24' }}
                title="O modelo generativo pago não está habilitado — usando o rascunho gratuito."
              >
                {t('report.paidUnavailable')}
              </span>
            )}
          </div>

          {/* CXR-14: report consistency gate */}
          {result.report_verified === false && (result.report_warnings?.length ?? 0) > 0 ? (
            <div
              role="alert"
              className="mx-3 mt-2 rounded-md border px-3 py-2 text-[11px] leading-snug"
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.15)',
                borderColor: 'rgba(217, 119, 6, 0.4)',
                color: '#FBBF24',
              }}
            >
              {t('report.inconsistent')}{' '}
              {result.report_warnings?.join(' ')}
            </div>
          ) : result.report_verified === true ? (
            <div className="mx-3 mt-2 text-[10px]" style={{ color: '#34D399' }}>
              {t('report.consistent')}
            </div>
          ) : null}

          {/* MIMPS-29: ruler measurements → structure suggest/confirm.
              Research-mode is already guaranteed in this render branch. */}
          <MeasurementsSection
            servicesManager={servicesManager}
            studyInstanceUID={studyInstanceUID}
            seriesInstanceUID={seriesInstanceUID}
            onConfirmedChange={handleConfirmedChange}
          />

          {/* Collapsible report draft — MIMPS-30 injects the confirmed Medições block */}
          <CollapsibleReport
            report={{
              ...result.report_draft,
              medicoes: medicoesText.length > 0 ? medicoesText : undefined,
            }}
          />
        </>
      )}

      {/* Server disclaimer */}
      <div className="flex-shrink-0 border-t border-white/10 px-3 py-2">
        <p
          className="m-0 text-[10px] leading-snug"
          style={{ color: AMBER }}
        >
          {result.disclaimer ?? t('disclaimer.research')}
        </p>
      </div>
    </div>
  );
}

export default AIFindingsPanel;
