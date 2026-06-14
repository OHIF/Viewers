import React, { useCallback, useEffect, useRef, useState } from 'react';
import { utilities as cornerstoneUtilities } from '@cornerstonejs/core';
import {
  getInference,
  InferenceError,
  InferenceFinding,
  InferenceResponse,
} from '../services/inferenceClient';
import { clearAIBoundingBoxes, showAIBoundingBoxes } from '../services/viewportOverlay';
import { toPtLabel, toSeverityDisplay } from '../utils/labels';
import { STATIC_DEMO_DATA } from './staticDemoData';

// ---------------------------------------------------------------------------
// Brand constants (MIMPS-02 palette)
// ---------------------------------------------------------------------------

const BRAND_VIOLET = '#7C3AED';
const TEXT_SECONDARY = '#A0ADB4';
const AMBER = '#D97706';

const FOOTER_DISCLAIMER =
  'Este rascunho foi gerado por IA e requer revisão e assinatura de médico habilitado antes de qualquer uso clínico.';

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
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-label="Carregando..."
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
        Analisando...
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
        {findings.length} achados improváveis
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
          Rascunho de Laudo
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
            style={{ backgroundColor: 'rgba(124,58,237,0.25)', color: '#C4B5FD' }}
          >
            ✦ Beta
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
                { key: 'tecnica', label: 'TÉCNICA', value: report.tecnica },
                { key: 'achados', label: 'ACHADOS', value: report.achados },
                { key: 'impressao', label: 'IMPRESSÃO', value: report.impressao },
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
            {copied ? 'Copiado!' : 'Copiar Rascunho'}
          </button>

          <p
            className="mb-0 mt-2 text-[10px] leading-snug"
            style={{ color: AMBER }}
          >
            {FOOTER_DISCLAIMER}
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InferenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Resolve study/series UIDs: prefer props, fall back to URL query params.
    const params = new URLSearchParams(window.location.search);
    const studyUid = studyInstanceUID ?? params.get('StudyInstanceUIDs') ?? '';
    const seriesUid = seriesInstanceUID ?? '';

    let cancelled = false;

    function drawOverlay(result: InferenceResponse, imageId?: string): void {
      // Only findings with a real bounding_box produce a viewport overlay
      // (mock/static lanes). The live classifier returns null boxes and we
      // never fabricate localization.
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
  }, [servicesManager, studyInstanceUID, seriesInstanceUID]);

  // --- Session expired state ---
  if (sessionExpired) {
    return (
      <div
        className="flex h-full items-center justify-center bg-black p-6 text-center text-[13px]"
        style={{ color: TEXT_SECONDARY }}
      >
        Sessão expirada. Redirecionando para o login...
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
        <span className="text-[13px] font-bold text-white">BlackVoxel IA — Achados</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-white/70">{result.model_version}</span>
          {result.is_mock && (
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Mock
            </span>
          )}
          {!result.is_mock && result.is_research && (
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Research
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
          Resultados offline — exibindo dados de demonstração
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
              ? `ACHADOS — ${present.length} provável(is)`
              : `ACHADOS (${result.findings.length})`}
          </span>
          <span
            className="text-[10px]"
            style={{ color: TEXT_SECONDARY }}
          >
            Processado em {processingSeconds}s
          </span>
        </div>

        {result.findings.length === 0 ? (
          <p className="m-0 text-[12px]" style={{ color: TEXT_SECONDARY }}>
            Nenhum achado detectado.
          </p>
        ) : hasBands ? (
          <div className="flex flex-col gap-3">
            {present.length > 0 && (
              <div>
                <GroupLabel>PROVÁVEIS ({present.length})</GroupLabel>
                <div className="flex flex-col gap-2">
                  {present.map((f, i) => (
                    <FindingRow key={`p-${f.label}-${i}`} finding={f} />
                  ))}
                </div>
              </div>
            )}
            {uncertain.length > 0 && (
              <div>
                <GroupLabel>INDETERMINADOS ({uncertain.length})</GroupLabel>
                <div className="flex flex-col gap-2">
                  {uncertain.map((f, i) => (
                    <FindingRow key={`u-${f.label}-${i}`} finding={f} />
                  ))}
                </div>
              </div>
            )}
            {present.length === 0 && uncertain.length === 0 && (
              <p className="m-0 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                Nenhum achado provável ou indeterminado.
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
            Localização não disponível nesta versão do modelo
          </p>
        )}
      </div>

      {/* Collapsible report draft */}
      <CollapsibleReport report={result.report_draft} />

      {/* Server disclaimer */}
      <div className="flex-shrink-0 border-t border-white/10 px-3 py-2">
        <p
          className="m-0 text-[10px] leading-snug"
          style={{ color: AMBER }}
        >
          {result.disclaimer ?? 'Uso restrito a pesquisa. Não substitui laudo médico.'}
        </p>
      </div>
    </div>
  );
}

export default AIFindingsPanel;
