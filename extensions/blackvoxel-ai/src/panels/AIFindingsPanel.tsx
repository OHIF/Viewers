import React, { useEffect, useState } from 'react';
import { utilities as cornerstoneUtilities } from '@cornerstonejs/core';
import {
  getInference,
  InferenceError,
  InferenceResponse,
} from '../services/inferenceClient';
import { STATIC_DEMO_DATA } from './staticDemoData';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AIFindingsPanelProps {
  servicesManager?: unknown; // OHIF servicesManager — typed loosely; extension not wired yet
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
// Sub-components
// ---------------------------------------------------------------------------

function Spinner(): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '24px',
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          animation: 'blackvoxel-spin 1s linear infinite',
        }}
        aria-label="Carregando..."
        role="img"
      >
        <style>{`@keyframes blackvoxel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#e2e8f0"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Analisando...</span>
    </div>
  );
}

interface SeverityBadgeProps {
  severity: string;
}

function SeverityBadge({ severity }: SeverityBadgeProps): React.ReactElement {
  const colorMap: Record<string, { bg: string; text: string }> = {
    low: { bg: '#dcfce7', text: '#166534' },
    moderate: { bg: '#fef9c3', text: '#854d0e' },
    high: { bg: '#fee2e2', text: '#991b1b' },
  };
  const colors = colorMap[severity.toLowerCase()] ?? { bg: '#f1f5f9', text: '#475569' };

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: colors.bg,
        color: colors.text,
        textTransform: 'capitalize',
      }}
    >
      {severity}
    </span>
  );
}

interface ConfidenceBarProps {
  confidence: number; // 0–1
}

function ConfidenceBar({ confidence }: ConfidenceBarProps): React.ReactElement {
  const pct = Math.round(confidence * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          flex: 1,
          height: '4px',
          backgroundColor: '#e2e8f0',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: '#6366f1',
            borderRadius: '2px',
          }}
        />
      </div>
      <span style={{ fontSize: '11px', color: '#64748b', minWidth: '28px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

interface CollapsibleReportProps {
  report: InferenceResponse['report_draft'];
}

function CollapsibleReport({ report }: CollapsibleReportProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px' }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          color: '#334155',
          textAlign: 'left',
        }}
        aria-expanded={open}
      >
        <span>Laudo Preliminar</span>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          {(
            [
              { key: 'tecnica', label: 'TÉCNICA', value: report.tecnica },
              { key: 'achados', label: 'ACHADOS', value: report.achados },
              { key: 'impressao', label: 'IMPRESSÃO', value: report.impressao },
            ] as const
          ).map(({ key, label, value }) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.05em',
                  marginBottom: '4px',
                }}
              >
                {label}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: '#475569',
                  lineHeight: '1.5',
                }}
              >
                {value}
              </p>
            </div>
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

    async function run(): Promise<void> {
      try {
        const capture = await captureActiveViewportImage(servicesManager);
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
        }
      } catch (err: unknown) {
        if (cancelled) return;

        if (err instanceof InferenceError && err.status === 401) {
          // getInference already triggered the redirect; show a brief message.
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
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [servicesManager, studyInstanceUID, seriesInstanceUID]);

  // --- Session expired state ---
  if (sessionExpired) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '24px',
          fontSize: '13px',
          color: '#64748b',
          textAlign: 'center',
        }}
      >
        Sessão expirada. Redirecionando...
      </div>
    );
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <Spinner />
      </div>
    );
  }

  // At this point data is guaranteed to be set (either real or fallback).
  const result = data as InferenceResponse;

  // --- Panel (success or fallback) ---
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        fontSize: '13px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#6366f1',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>BlackVoxel AI</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
          {result.model_version}
        </span>
        {result.is_mock && (
          <span
            style={{
              marginLeft: '4px',
              fontSize: '10px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            Mock
          </span>
        )}
        {!result.is_mock && result.is_research && (
          <span
            style={{
              marginLeft: '4px',
              fontSize: '10px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            Research
          </span>
        )}
      </div>

      {/* Offline / fallback banner */}
      {usingFallback && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            padding: '6px 12px',
            fontSize: '11px',
            color: '#92400e',
            flexShrink: 0,
          }}
        >
          Resultados offline — exibindo dados de demonstração
          {error && (
            <span style={{ color: '#b45309', marginLeft: '4px' }}>({error})</span>
          )}
        </div>
      )}

      {/* Findings */}
      <div style={{ padding: '12px', flex: 1 }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#94a3b8',
            letterSpacing: '0.05em',
            marginBottom: '10px',
          }}
        >
          ACHADOS ({result.findings.length})
        </div>

        {result.findings.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            Nenhum achado detectado.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.findings.map((finding, idx) => (
              <div
                key={`${finding.label}-${idx}`}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  padding: '10px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '12px' }}>
                    {finding.label}
                  </span>
                  <SeverityBadge severity={finding.severity} />
                </div>
                <ConfidenceBar confidence={finding.confidence} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible report draft */}
      <CollapsibleReport report={result.report_draft} />

      {/* Disclaimer */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #f1f5f9',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '10px',
            color: '#d97706',
            lineHeight: '1.4',
          }}
        >
          {result.disclaimer ?? 'Uso restrito a pesquisa. Nao substitui laudo medico.'}
        </p>
      </div>
    </div>
  );
}

export default AIFindingsPanel;
