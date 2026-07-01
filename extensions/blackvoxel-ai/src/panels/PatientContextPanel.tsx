/**
 * PatientContextPanel.tsx (MIMPS-35)
 *
 * The "Contexto Clínico" side panel. Renders ONLY in clinical mode and only
 * when CLINICAL_MODE_ENABLED (ships dark): in research mode, or with the flag
 * off, it shows a brief inert placeholder and NEVER fetches.
 *
 * Flow (consent-first, ephemeral):
 *   1. Show the active study's DICOM demographics (usePatientDemographics).
 *   2. A CONSENT TOGGLE — required true before ANY fetch. No consent → no call.
 *   3. An ephemeral banner: "dados usados apenas neste laudo e descartados".
 *   4. On "Load clinical context" we call labsClient.getPatientContext and
 *      publish the de-identified result into the clinical-context store, where
 *      AIFindingsPanel reads it (MIMPS-36) to attach `clinical_context` to the
 *      InferenceRequest. The value is in-memory + ephemeral.
 *   5. Withdrawing consent (or leaving clinical mode / unmount) clears the
 *      stored context immediately.
 *
 * Diagnostic claims are [RA-GATE]; this panel is "para raciocínio apenas".
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/LanguageToggle';
import { useViewerMode } from '../stores/useViewerModeStore';
import { useClinicalContext } from '../stores/useClinicalContextStore';
import { usePatientDemographics } from '../hooks/usePatientDemographics';
import { getPatientContext } from '../services/labsClient';
import { InferenceError, LabResult } from '../services/inferenceClient';
import { CLINICAL_MODE_ENABLED } from '../config/clinicalMode';

// Brand tokens (shared with AIFindingsPanel / ViewerModeGate).
// VWR-BRAND-01 (2026-07): canonical BlackVoxel accent-dim, >=4.5:1 white-on-fill.
const BRAND_VIOLET = '#5d5da0';
const TEXT_SECONDARY = '#A0ADB4';
const AMBER = '#D97706';

interface PatientContextPanelProps {
  servicesManager?: unknown;
  studyInstanceUID?: string;
}

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      className="mb-1.5 text-[10px] font-bold tracking-wider"
      style={{ color: TEXT_SECONDARY }}
    >
      {children}
    </div>
  );
}

/** A lab-result row with an H/L/N flag chip — values are reasoning context only. */
function LabRow({ lab }: { lab: LabResult }): React.ReactElement {
  const flagColor =
    lab.flag === 'H'
      ? '#FCA5A5'
      : lab.flag === 'L'
        ? '#93C5FD'
        : TEXT_SECONDARY;
  const range =
    lab.ref_low != null && lab.ref_high != null ? ` (${lab.ref_low}–${lab.ref_high})` : '';
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5">
      <span className="text-[12px] font-medium text-white">{lab.label}</span>
      <span className="flex items-center gap-1.5 text-[11px]" style={{ color: TEXT_SECONDARY }}>
        <span className="font-bold text-white">
          {lab.value} {lab.unit}
        </span>
        <span style={{ color: TEXT_SECONDARY }}>{range}</span>
        {lab.flag && lab.flag !== 'N' && (
          <span
            className="inline-block rounded px-1 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: flagColor }}
          >
            {lab.flag}
          </span>
        )}
      </span>
    </div>
  );
}

function PatientContextPanel({
  servicesManager,
  studyInstanceUID,
}: PatientContextPanelProps): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  const { mode } = useViewerMode();
  const { context, setContext, clearContext } = useClinicalContext();
  const demographics = usePatientDemographics(servicesManager);

  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Render/fetch only in clinical mode with the flag on. Anything else is inert.
  const clinicalActive = CLINICAL_MODE_ENABLED && mode === 'clinical';

  // Leaving clinical mode (or the flag off) clears consent + ephemeral context.
  useEffect(() => {
    if (!clinicalActive) {
      setConsent(false);
      setError(null);
      clearContext();
    }
  }, [clinicalActive, clearContext]);

  // Clear the ephemeral context when this panel unmounts.
  useEffect(() => {
    return () => {
      clearContext();
    };
  }, [clearContext]);

  // Withdrawing consent immediately discards any loaded context.
  const onToggleConsent = useCallback(
    (next: boolean) => {
      setConsent(next);
      if (!next) {
        clearContext();
        setError(null);
      }
    },
    [clearContext]
  );

  const onLoad = useCallback(async () => {
    // Consent is REQUIRED before any fetch — hard guard in addition to the
    // disabled button so this can never fire unconsented.
    if (!clinicalActive || !consent) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const studyUid = studyInstanceUID ?? params.get('StudyInstanceUIDs') ?? '';
    // patient_ref is a FHIR Patient/{id}, never a CPF; the DICOM PatientID is
    // not a FHIR ref, so we send null and let 4_labs resolve by study_uid.
    const patientRef: string | null = null;

    setLoading(true);
    setError(null);
    try {
      const ctx = await getPatientContext(studyUid, patientRef, consent);
      setContext(ctx);
    } catch (err: unknown) {
      if (err instanceof InferenceError && err.status === 401) {
        // labsClient already triggered the SSO redirect.
        return;
      }
      setError(t('context.fetch.error'));
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [clinicalActive, consent, studyInstanceUID, setContext, t]);

  // --- Inert placeholder: research mode or flag off ---
  if (!clinicalActive) {
    return (
      <div className="flex h-full flex-col bg-black text-[13px]">
        <div
          className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          <span className="text-[13px] font-bold text-white">{t('context.panel.title')}</span>
          <span className="ml-auto">
            <LanguageToggle />
          </span>
        </div>
        <div
          className="flex flex-1 items-center justify-center p-6 text-center"
          role="status"
          aria-live="polite"
        >
          <p className="m-0 max-w-[220px] text-[12px] leading-snug" style={{ color: TEXT_SECONDARY }}>
            {t('placeholder.aiResearchOnly')}
          </p>
        </div>
      </div>
    );
  }

  // --- Active clinical panel ---
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-black text-[13px]">
      {/* Header */}
      <div
        className="flex flex-shrink-0 items-center gap-2 px-3 py-2.5"
        style={{ backgroundColor: BRAND_VIOLET }}
      >
        <span className="text-[13px] font-bold text-white">{t('context.panel.title')}</span>
        <span className="ml-auto">
          <LanguageToggle />
        </span>
      </div>

      {/* Ephemeral banner — always visible while clinical context is in scope */}
      <div
        role="note"
        className="flex-shrink-0 border-b px-3 py-1.5 text-[11px]"
        style={{
          backgroundColor: 'rgba(124,58,237,0.12)',
          borderColor: 'rgba(124,58,237,0.30)',
          color: '#C4B5FD',
        }}
      >
        {t('context.ephemeral.banner')}
      </div>

      <div className="flex-1 p-3">
        {/* Demographics */}
        <SectionLabel>{t('context.demographics.title')}</SectionLabel>
        {demographics.PatientID || demographics.PatientSex || demographics.PatientBirthDate ? (
          <div className="mb-3 flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-2.5 text-[12px] text-white">
            {demographics.PatientID && (
              <div className="flex justify-between gap-2">
                <span style={{ color: TEXT_SECONDARY }}>{t('context.demographics.id')}</span>
                <span className="font-medium">{demographics.PatientID}</span>
              </div>
            )}
            {demographics.PatientSex && (
              <div className="flex justify-between gap-2">
                <span style={{ color: TEXT_SECONDARY }}>{t('context.demographics.sex')}</span>
                <span className="font-medium">{demographics.PatientSex}</span>
              </div>
            )}
            {demographics.PatientBirthDate && (
              <div className="flex justify-between gap-2">
                <span style={{ color: TEXT_SECONDARY }}>{t('context.demographics.dob')}</span>
                <span className="font-medium">{demographics.PatientBirthDate}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="mb-3 text-[12px]" style={{ color: TEXT_SECONDARY }}>
            {t('context.demographics.none')}
          </p>
        )}

        {/* Consent toggle — required before any fetch */}
        <label className="mb-2 flex cursor-pointer items-start gap-2 rounded-md border border-white/10 bg-white/5 p-2.5">
          <input
            type="checkbox"
            checked={consent}
            onChange={e => onToggleConsent(e.target.checked)}
            className="mt-0.5"
            aria-label={t('context.consent.label')}
          />
          <span className="text-[12px] leading-snug text-white">{t('context.consent.label')}</span>
        </label>

        {!consent && (
          <p className="mb-2 text-[11px]" style={{ color: TEXT_SECONDARY }}>
            {t('context.consent.required')}
          </p>
        )}

        {/* Load button — disabled until consent is given */}
        <button
          type="button"
          onClick={onLoad}
          disabled={!consent || loading}
          className="mb-3 w-full cursor-pointer rounded-md px-3 py-2 text-[12px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 max-md:min-h-[44px]"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          {loading ? t('context.fetch.loading') : t('context.fetch.button')}
        </button>

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-md border px-3 py-2 text-[11px] leading-snug"
            style={{
              backgroundColor: 'rgba(217,119,6,0.15)',
              borderColor: 'rgba(217,119,6,0.4)',
              color: '#FBBF24',
            }}
          >
            {error}
          </div>
        )}

        {/* Loaded context */}
        {context && !loading && (
          <div className="flex flex-col gap-3">
            {context.labs.length > 0 && (
              <div>
                <SectionLabel>{t('context.labs.title')}</SectionLabel>
                <div className="flex flex-col gap-1.5">
                  {context.labs.map((lab, i) => (
                    <LabRow key={`${lab.code}-${i}`} lab={lab} />
                  ))}
                </div>
              </div>
            )}

            {context.clinical_history && (
              <div>
                <SectionLabel>{t('context.history.title')}</SectionLabel>
                <p className="m-0 text-[12px] leading-relaxed text-white/90">
                  {context.clinical_history}
                </p>
              </div>
            )}

            {context.comorbidities.length > 0 && (
              <div>
                <SectionLabel>{t('context.comorbidities.title')}</SectionLabel>
                <p className="m-0 text-[12px] leading-relaxed text-white/90">
                  {context.comorbidities.join(', ')}
                </p>
              </div>
            )}

            {context.medications.length > 0 && (
              <div>
                <SectionLabel>{t('context.medications.title')}</SectionLabel>
                <p className="m-0 text-[12px] leading-relaxed text-white/90">
                  {context.medications.join(', ')}
                </p>
              </div>
            )}

            {context.labs.length === 0 &&
              !context.clinical_history &&
              context.comorbidities.length === 0 &&
              context.medications.length === 0 && (
                <p className="m-0 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                  {t('context.fetch.empty')}
                </p>
              )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex-shrink-0 border-t border-white/10 px-3 py-2">
        <p className="m-0 text-[10px] leading-snug" style={{ color: AMBER }}>
          {t('context.disclaimer')}
        </p>
      </div>
    </div>
  );
}

export default PatientContextPanel;
