/**
 * CondutaSusPanel.tsx (SUS-12)
 *
 * The "Conduta SUS" side panel. From a physician-SIGNED chest-X-ray read it
 * lets the physician GENERATE A DRAFT SUS regulation request and — as a
 * separate, explicit, confirmed action — SUBMIT it. It calls the platform
 * proxy (SUS-11) `POST /api/v1/conduta/{draft,submit}`, which forwards to the
 * 5_sus service.
 *
 * Ships DARK. The panel renders its active UI ONLY when ALL hold:
 *   (a) CONDUTA_SUS_ENABLED (build-time flag, default off), AND
 *   (b) the viewer is in CLINICAL mode (useViewerMode), AND
 *   (c) a physician-SIGNED read has been published (useSignedReport).
 * Anything else → an inert placeholder. The panel is not even registered when
 * the flag is off (see getPanelModule.tsx), so (a) is also enforced upstream.
 *
 * Hard invariant #1 (mirrored from the contract): a draft is NEVER produced
 * from an unsigned read. With no signed read the panel shows a prominent
 * "disponível após assinatura do laudo" message and the draft/submit actions do
 * not exist. The AI `report_draft` (unsigned) is deliberately NOT used here.
 *
 * Governance framing throughout: decision-SUPPORT only, claims:"none". The AI
 * drafts → the physician signs → the *médico regulador* decides. The suggested
 * Prioridade/cor/rationale/justificativa are ALWAYS editable. `submit` is never
 * automatic — it requires an explicit confirm step. `submit` reaches NO real
 * RNDS (mock connector; `accepted` is a STRUCTURAL signal, not a clinical or
 * regulatory acceptance).
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/LanguageToggle';
import { useViewerMode } from '../stores/useViewerModeStore';
import { useSignedReport } from '../stores/useSignedReportStore';
import { CONDUTA_SUS_ENABLED } from '../config/condutaSus';
import {
  condutaDraft,
  condutaSubmit,
  isCondutaError,
  CondutaDisabledError,
  CondutaError,
  CondutaColor,
  CondutaPathway,
  CondutaPriority,
  CondutaRequest,
  CondutaDraftSuccess,
  CondutaSubmitSuccess,
} from '../services/conductaClient';

// Brand tokens (shared with AIFindingsPanel / PatientContextPanel).
// VWR-BRAND-01 (2026-07): canonical BlackVoxel accent-dim, >=4.5:1 white-on-fill.
const BRAND_VIOLET = '#5d5da0';
const TEXT_SECONDARY = '#A0ADB4';
const AMBER = '#D97706';

// ---------------------------------------------------------------------------
// Pathway cards
// ---------------------------------------------------------------------------

/**
 * The three pathway cards. Aguda/Crônica map to the contract's acute/chronic
 * (they draft + submit one bundle). Triagem is INFORMATIONAL only: the seam
 * rejects 'triage' (it ranks many reads, not one bundle), so its card has no
 * draft/submit action — it explains that triagem ranks a worklist, decided by
 * the regulador. This keeps the panel honest about what the seam does.
 */
type CardKind = 'acute' | 'chronic' | 'triage';

interface PathwayCardDef {
  kind: CardKind;
  /** The contract pathway, or null for the informational Triagem card. */
  pathway: CondutaPathway | null;
}

const PATHWAY_CARDS: PathwayCardDef[] = [
  { kind: 'acute', pathway: 'acute' },
  { kind: 'chronic', pathway: 'chronic' },
  { kind: 'triage', pathway: null },
];

// ---------------------------------------------------------------------------
// Prioridade / cor chips (BandChip-style, reused visual language)
// ---------------------------------------------------------------------------

/** SUS waiting-list cor → swatch color. */
const COLOR_SWATCH: Record<CondutaColor, string> = {
  vermelho: '#EF4444',
  amarelo: '#FBBF24',
  verde: '#34D399',
  azul: '#60A5FA',
};

/** Prioridade chip — the suggested SUS Prioridade 0-3 (lower = more urgent). */
function PriorityChip({
  priority,
  priorityName,
}: {
  priority: CondutaPriority;
  priorityName: string;
}): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: 'rgba(124,58,237,0.25)', color: '#C4B5FD' }}
      title={priorityName}
    >
      {t('conduta.priorityChip', { priority, name: priorityName })}
    </span>
  );
}

/** Cor chip — the suggested waiting-list cor, with a color swatch. */
function ColorChip({ color }: { color: CondutaColor }): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  const swatch = COLOR_SWATCH[color] ?? TEXT_SECONDARY;
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: swatch }}
      />
      {t(`conduta.color.${color}`, { defaultValue: color })}
    </span>
  );
}

/** The "✦ rascunho" badge — same visual language as the report-draft beta badge. */
function RascunhoBadge(): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[9px] font-bold"
      style={{ backgroundColor: 'rgba(124,58,237,0.25)', color: '#C4B5FD' }}
    >
      ✦ {t('conduta.rascunhoBadge')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// One pathway card
// ---------------------------------------------------------------------------

type CardPhase = 'idle' | 'drafting' | 'drafted' | 'submitting' | 'submitted' | 'error';

interface PathwayCardProps {
  def: PathwayCardDef;
  /** The signed read powering the request; guaranteed present by the parent. */
  buildRequest: (pathway: CondutaPathway) => CondutaRequest;
  /** Lifts a 503 (lane disabled) up so the whole panel shows "indisponível". */
  onLaneDisabled: () => void;
}

function PathwayCard({ def, buildRequest, onLaneDisabled }: PathwayCardProps): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');

  const [phase, setPhase] = useState<CardPhase>('idle');
  const [draft, setDraft] = useState<CondutaDraftSuccess | null>(null);
  const [submitResult, setSubmitResult] = useState<CondutaSubmitSuccess | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Body-level (ok:false) error code from the contract (e.g. unsigned_report).
  const [resultError, setResultError] = useState<string | null>(null);
  // Editable suggestion fields (the suggestion is ALWAYS editable, #editable).
  const [editJustificativa, setEditJustificativa] = useState('');
  const [editRationale, setEditRationale] = useState('');
  // The explicit confirm gate before submit — NEVER auto-send.
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const isInformational = def.pathway === null;

  const onGenerateDraft = useCallback(async () => {
    if (!def.pathway) {
      return;
    }
    setPhase('drafting');
    setErrorMsg(null);
    setResultError(null);
    setSubmitResult(null);
    setConfirmSubmit(false);
    try {
      const res = await condutaDraft(buildRequest(def.pathway));
      if (isCondutaError(res)) {
        // Body-level defect (HTTP 200, ok:false) — e.g. unsigned_report.
        setResultError(res.error.code);
        setPhase('error');
      } else {
        setDraft(res);
        setEditJustificativa(res.justificativa_pt ?? '');
        setEditRationale(res.rationale ?? '');
        setPhase('drafted');
      }
    } catch (err: unknown) {
      if (err instanceof CondutaDisabledError) {
        // Bubble up: the whole panel switches to the disabled state.
        onLaneDisabled();
        return;
      }
      if (err instanceof CondutaError && err.status === 401) {
        // The client already triggered the SSO redirect.
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, [def.pathway, buildRequest, onLaneDisabled]);

  const onSubmit = useCallback(async () => {
    if (!def.pathway || !confirmSubmit) {
      return;
    }
    setPhase('submitting');
    setErrorMsg(null);
    setResultError(null);
    try {
      // Re-send with the (possibly edited) justificativa. submit runs
      // build_draft upstream first, so #1 still holds transitively.
      const req = buildRequest(def.pathway);
      const res = await condutaSubmit({
        ...req,
        justificativa_pt: editJustificativa || req.justificativa_pt,
      });
      if (isCondutaError(res)) {
        setResultError(res.error.code);
        setPhase('error');
      } else {
        setSubmitResult(res);
        setPhase('submitted');
      }
    } catch (err: unknown) {
      if (err instanceof CondutaDisabledError) {
        onLaneDisabled();
        return;
      }
      if (err instanceof CondutaError && err.status === 401) {
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }, [def.pathway, confirmSubmit, buildRequest, editJustificativa, onLaneDisabled]);

  const onReset = useCallback(() => {
    setPhase('idle');
    setDraft(null);
    setSubmitResult(null);
    setErrorMsg(null);
    setResultError(null);
    setConfirmSubmit(false);
  }, []);

  // --- Informational Triagem card: no draft/submit, explains the worklist. ---
  if (isInformational) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-3">
        <div className="mb-1 text-[12px] font-bold text-white">{t(`conduta.card.${def.kind}.title`)}</div>
        <p className="m-0 text-[11px] leading-snug" style={{ color: TEXT_SECONDARY }}>
          {t(`conduta.card.${def.kind}.desc`)}
        </p>
        <p className="mb-0 mt-2 text-[10px] italic leading-snug" style={{ color: TEXT_SECONDARY }}>
          {t('conduta.triageNote')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      {/* Card header */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-white">{t(`conduta.card.${def.kind}.title`)}</span>
        {(phase === 'drafted' || phase === 'submitting' || phase === 'submitted') && <RascunhoBadge />}
      </div>
      <p className="m-0 text-[11px] leading-snug" style={{ color: TEXT_SECONDARY }}>
        {t(`conduta.card.${def.kind}.desc`)}
      </p>

      {/* Primary action: generate the draft. Shown only when idle or after an
          error (a retry); the 'drafting' spinner state renders separately. */}
      {(phase === 'idle' || phase === 'error') && (
        <button
          type="button"
          onClick={onGenerateDraft}
          className="mt-2.5 w-full cursor-pointer rounded-md px-3 py-2 text-[12px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 max-md:min-h-[44px]"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          {phase === 'error' ? t('conduta.retryDraft') : t('conduta.generateDraft')}
        </button>
      )}

      {phase === 'drafting' && (
        <p className="mb-0 mt-2.5 text-[11px]" style={{ color: TEXT_SECONDARY }} role="status" aria-live="polite">
          {t('conduta.drafting')}
        </p>
      )}

      {/* Body-level / transport error (NOT the disabled state — a 503 lifts to
          the parent panel via onLaneDisabled). unsigned_report should never
          happen here because the parent gates on a signed read, but we surface
          it defensively. */}
      {phase === 'error' && (
        <div
          role="alert"
          className="mt-2.5 rounded-md border px-3 py-2 text-[11px] leading-snug"
          style={{
            backgroundColor: 'rgba(217,119,6,0.15)',
            borderColor: 'rgba(217,119,6,0.4)',
            color: '#FBBF24',
          }}
        >
          {resultError === 'unsigned_report'
            ? t('conduta.error.unsigned')
            : resultError
              ? t('conduta.error.request', { code: resultError })
              : t('conduta.error.generic')}
        </div>
      )}

      {/* Draft result: editable Prioridade/cor + rationale + justificativa */}
      {phase !== 'idle' && draft && phase !== 'error' && (
        <div className="mt-3 flex flex-col gap-2.5">
          {/* Suggested Prioridade + cor */}
          <div>
            <div className="mb-1 text-[10px] font-bold tracking-wider" style={{ color: TEXT_SECONDARY }}>
              {t('conduta.suggestionLabel')}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <PriorityChip priority={draft.priority} priorityName={draft.priority_name} />
              <ColorChip color={draft.color} />
              <span className="text-[9px]" style={{ color: TEXT_SECONDARY }} title={draft.rule_id}>
                {t('conduta.ruleId', { id: draft.rule_id })}
              </span>
            </div>
          </div>

          {/* Editable rationale */}
          <div>
            <label className="mb-1 block text-[10px] font-bold tracking-wider" style={{ color: TEXT_SECONDARY }}>
              {t('conduta.rationaleLabel')}
            </label>
            <textarea
              value={editRationale}
              onChange={e => setEditRationale(e.target.value)}
              disabled={phase === 'submitting' || phase === 'submitted'}
              rows={2}
              className="w-full resize-y rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] leading-snug text-white/90 disabled:opacity-60"
              aria-label={t('conduta.rationaleLabel')}
            />
          </div>

          {/* Editable justificativa */}
          <div>
            <label className="mb-1 block text-[10px] font-bold tracking-wider" style={{ color: TEXT_SECONDARY }}>
              {t('conduta.justificativaLabel')}
            </label>
            <textarea
              value={editJustificativa}
              onChange={e => setEditJustificativa(e.target.value)}
              disabled={phase === 'submitting' || phase === 'submitted'}
              rows={3}
              placeholder={t('conduta.justificativaPlaceholder')}
              className="w-full resize-y rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] leading-snug text-white/90 disabled:opacity-60"
              aria-label={t('conduta.justificativaLabel')}
            />
          </div>

          {/* "o médico/regulador decide" framing */}
          <p className="m-0 text-[10px] italic leading-snug" style={{ color: TEXT_SECONDARY }}>
            {t('conduta.decidesNote')}
          </p>

          {/* Submitted result */}
          {phase === 'submitted' && submitResult ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border px-3 py-2 text-[11px] leading-snug"
              style={{
                backgroundColor: 'rgba(16,185,129,0.12)',
                borderColor: 'rgba(16,185,129,0.35)',
                color: '#34D399',
              }}
            >
              <div className="font-semibold">
                {submitResult.accepted
                  ? t('conduta.submitted.accepted')
                  : t('conduta.submitted.rejected')}
              </div>
              {submitResult.tracking_id && (
                <div className="mt-0.5 font-mono text-[10px] text-white/80">
                  {t('conduta.submitted.trackingId', { id: submitResult.tracking_id })}
                </div>
              )}
              {/* environment is ALWAYS "mock" in the $0 build — say so plainly. */}
              <div className="mt-0.5 text-[10px]" style={{ color: TEXT_SECONDARY }}>
                {t('conduta.submitted.mockEnv')}
              </div>
              {submitResult.problems.length > 0 && (
                <ul className="mb-0 mt-1 list-disc pl-4 text-[10px]" style={{ color: '#FBBF24' }}>
                  {submitResult.problems.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={onReset}
                className="mt-2 cursor-pointer rounded border border-white/15 bg-transparent px-2 py-1 text-[10px] font-semibold text-white max-md:min-h-[44px]"
              >
                {t('conduta.reset')}
              </button>
            </div>
          ) : (
            // The SEPARATE explicit submit action with a confirm step.
            <div className="border-t border-white/10 pt-2.5">
              <label className="mb-2 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={confirmSubmit}
                  onChange={e => setConfirmSubmit(e.target.checked)}
                  disabled={phase === 'submitting'}
                  className="mt-0.5"
                  aria-label={t('conduta.confirmSubmitLabel')}
                />
                <span className="text-[11px] leading-snug text-white">
                  {t('conduta.confirmSubmitLabel')}
                </span>
              </label>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!confirmSubmit || phase === 'submitting'}
                className="w-full cursor-pointer rounded-md border px-3 py-2 text-[12px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 max-md:min-h-[44px]"
                style={{
                  backgroundColor: confirmSubmit ? '#B45309' : 'rgba(180,83,9,0.35)',
                  borderColor: 'rgba(217,119,6,0.5)',
                }}
              >
                {phase === 'submitting' ? t('conduta.submitting') : t('conduta.submit')}
              </button>
              <p className="mb-0 mt-1.5 text-[10px] leading-snug" style={{ color: TEXT_SECONDARY }}>
                {t('conduta.submitNote')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

interface CondutaSusPanelProps {
  servicesManager?: unknown;
  studyInstanceUID?: string;
}

function PanelShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  return (
    <div className="flex h-full flex-col bg-black text-[13px]">
      <div
        className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5"
        style={{ backgroundColor: BRAND_VIOLET }}
      >
        <span className="text-[13px] font-bold text-white">{t('conduta.panel.title')}</span>
        <span className="ml-auto">
          <LanguageToggle />
        </span>
      </div>
      {children}
    </div>
  );
}

function CondutaSusPanel(_props: CondutaSusPanelProps): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  const { mode } = useViewerMode();
  const { report } = useSignedReport();
  const [laneDisabled, setLaneDisabled] = useState(false);

  // (a) flag on, (b) clinical mode, (c) a signed read present. Hooks above are
  // always called (Rules of Hooks); the gates below only affect render.
  const flagOn = CONDUTA_SUS_ENABLED;
  const clinicalActive = flagOn && mode === 'clinical';
  const hasSignedReport = report !== null && report.signed === true;

  // Assemble the request from the SIGNED read. Never from an unsigned source.
  const buildRequest = useCallback(
    (pathway: CondutaPathway): CondutaRequest => {
      // `report` is guaranteed non-null in the branch that renders the cards.
      const signed = report as NonNullable<typeof report>;
      return {
        pathway,
        report: signed,
        // Inject a deterministic timestamp for the Bundle (#3); the physician's
        // edited justificativa is passed per-action in the card.
        timestamp: new Date().toISOString(),
      };
    },
    [report]
  );

  // --- Disabled lane (503 surfaced by a card) → whole-panel disabled state. ---
  if (laneDisabled) {
    return (
      <PanelShell>
        <div className="flex flex-1 items-center justify-center p-6 text-center" role="status" aria-live="polite">
          <p className="m-0 max-w-[240px] text-[12px] leading-snug" style={{ color: TEXT_SECONDARY }}>
            {t('conduta.unavailable')}
          </p>
        </div>
      </PanelShell>
    );
  }

  // --- Inert placeholder: flag off, or not clinical mode. ---
  if (!clinicalActive) {
    return (
      <PanelShell>
        <div className="flex flex-1 items-center justify-center p-6 text-center" role="status" aria-live="polite">
          <p className="m-0 max-w-[240px] text-[12px] leading-snug" style={{ color: TEXT_SECONDARY }}>
            {t('conduta.placeholder.clinicalOnly')}
          </p>
        </div>
      </PanelShell>
    );
  }

  // --- Clinical mode, flag on, but NO signed read: the hard gate (#1). ---
  if (!hasSignedReport) {
    return (
      <PanelShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center" role="status" aria-live="polite">
          {/* Signature/lock icon */}
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
          <p className="m-0 max-w-[240px] text-[13px] font-semibold leading-snug text-white">
            {t('conduta.requiresSigned')}
          </p>
          <p className="m-0 max-w-[240px] text-[11px] leading-snug" style={{ color: TEXT_SECONDARY }}>
            {t('conduta.requiresSignedNote')}
          </p>
        </div>
      </PanelShell>
    );
  }

  // --- Active panel: signed read present, clinical mode, flag on. ---
  return (
    <PanelShell>
      <div className="flex-1 overflow-y-auto">
        {/* Intro / framing */}
        <div className="border-b border-white/10 px-3 py-2.5">
          <p className="m-0 text-[11px] leading-snug" style={{ color: TEXT_SECONDARY }}>
            {t('conduta.intro')}
          </p>
        </div>

        {/* Pathway cards */}
        <div className="flex flex-col gap-3 p-3">
          {PATHWAY_CARDS.map(def => (
            <PathwayCard
              key={def.kind}
              def={def}
              buildRequest={buildRequest}
              onLaneDisabled={() => setLaneDisabled(true)}
            />
          ))}
        </div>
      </div>

      {/* Disclaimer (AMBER) */}
      <div className="flex-shrink-0 border-t border-white/10 px-3 py-2">
        <p className="m-0 text-[10px] leading-snug" style={{ color: AMBER }}>
          {t('conduta.disclaimer')}
        </p>
      </div>
    </PanelShell>
  );
}

export default CondutaSusPanel;
