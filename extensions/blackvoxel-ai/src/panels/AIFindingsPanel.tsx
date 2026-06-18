import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { utilities as cornerstoneUtilities } from '@cornerstonejs/core';
import { LanguageToggle } from '../components/LanguageToggle';
import {
  getInference,
  InferenceError,
  InferenceFinding,
  InferenceResponse,
} from '../services/inferenceClient';
import { clearAIBoundingBoxes, showAIBoundingBoxes } from '../services/viewportOverlay';
import { toPtLabel, toSeverityDisplay } from '../utils/labels';
import { STATIC_DEMO_DATA } from './staticDemoData';
// MIMPS-26: research-only DICOM import button
import { DicomImportButton } from '../components/DicomImportButton';
// MIMPS-27: viewer-mode gate — AI inference is Research-mode only
import { useViewerMode } from '../stores/useViewerModeStore';

// ---------------------------------------------------------------------------
// Brand constants (MIMPS-02 palette)
// ---------------------------------------------------------------------------

const BRAND_VIOLET = '#7C3AED';
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
  return [
    'TÉCNICA',
    report.tecnica,
    '',
    'ACHADOS',
    report.achados,
    '',
    'IMPRESSÃO',
    report.impressao,
  ].join('\n');
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

function FindingRow({ finding }: { finding: InferenceFinding }): React.ReactElement {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-white">
          {toPtLabel(finding.label)}
          {finding.region ? (
            <span title="Localização aproximada disponível" aria-label="Localização disponível"> ◎</span>
          ) : null}
        </span>
        {finding.band ? <BandChip band={finding.band} /> : <SeverityChip severity={finding.severity} />}
      </div>
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
// Main panel
// ---------------------------------------------------------------------------

function AIFindingsPanel({
  servicesManager,
  studyInstanceUID,
  seriesInstanceUID,
}: AIFindingsPanelProps): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  // MIMPS-27: gate — all hooks must be called unconditionally (Rules of Hooks).
  // The mode value guards the effect body so getInference never fires outside Research.
  const { mode } = useViewerMode();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InferenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // MIMPS-27: Research mode is required for AI inference.
    // Rationale: Research = de-identified / non-PHI → external model calls
    // (including Gemini/MedGemma) are permitted.  Clinical = PHI context →
    // no model network calls until a compliant deployment is in place.
    if (mode !== 'research') {
      // Ensure any stale overlay from a previous research session is cleared.
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

      try {
        const result = await getInference({
          study_uid: studyUid,
          series_uid: seriesUid,
          modality: 'CXR',
          image_data_url: capture.imageDataUrl,
          image_id: capture.imageId,
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

        // Any other error: fall back to static demo data.
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        setData(STATIC_DEMO_DATA);
        setUsingFallback(true);
        setLoading(false);
        drawOverlay(STATIC_DEMO_DATA, capture.imageId);
      }
    }

    run();

    return () => {
      cancelled = true;
      // Panel closing / re-running: never leave stale AI boxes on the viewport.
      clearAIBoundingBoxes();
    };
  }, [mode, servicesManager, studyInstanceUID, seriesInstanceUID]);

  // --- MIMPS-27: Non-research mode — AI models disabled ---
  // Render a bilingual placeholder; no inference state is shown.
  // DicomImportButton already gates itself to research mode (MIMPS-26).
  if (mode !== 'research') {
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

  // At this point data is guaranteed to be set (either real or fallback).
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
        </span>
      </div>

      {/* MIMPS-26: DICOM import affordance — only visible in Research mode */}
      <DicomImportButton />

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

      {/* Collapsible report draft */}
      <CollapsibleReport report={result.report_draft} />

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
