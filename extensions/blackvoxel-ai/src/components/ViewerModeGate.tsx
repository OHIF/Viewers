/**
 * MIMPS-25 — ViewerModeGate
 *
 * A full-screen modal portal rendered over the viewer that forces the user to
 * choose a viewer mode before interacting with any image or AI features.
 *
 * Design decisions:
 *   - Portal into document.body via ReactDOM.createPortal so it sits above
 *     every OHIF layer without modifying any platform/core component.
 *   - Only 'research' is enabled today; 'clinical' is visible but disabled
 *     with "Em breve / Coming soon" to communicate the roadmap.
 *   - The gate disappears the instant a valid mode is committed (no flicker).
 *   - A "Trocar modo / Change mode" button re-exposes the gate (MIMPS-25
 *     requirement: "re-promptable").
 *   - Dark styling mirrors AIFindingsPanel.tsx brand tokens.
 */

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useViewerMode, ViewerMode } from '../stores/useViewerModeStore';
import { LanguageToggle } from './LanguageToggle';
// MIMPS-33: clinical-mode kill-switch (default false — ships dark).
import { CLINICAL_MODE_ENABLED } from '../config/clinicalMode';

// ---------------------------------------------------------------------------
// Brand tokens (matches AIFindingsPanel.tsx)
// ---------------------------------------------------------------------------

const BRAND_VIOLET = '#7C3AED';
const BRAND_VIOLET_HOVER = '#6D28D9';
const BRAND_VIOLET_BG = 'rgba(124, 58, 237, 0.15)';
const TEXT_SECONDARY = '#A0ADB4';
const SURFACE = '#0D0D0D';
const SURFACE_CARD = '#1A1A1A';
const BORDER = 'rgba(255,255,255,0.08)';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ModeCardProps {
  title: string;
  subtitle?: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  selected: boolean;
  onClick: () => void;
}

function ModeCard({
  title,
  subtitle,
  description,
  badge,
  disabled = false,
  selected,
  onClick,
}: ModeCardProps): React.ReactElement {
  const isSelected = selected && !disabled;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      className="w-full rounded-xl border text-left transition-all"
      style={{
        backgroundColor: isSelected ? BRAND_VIOLET_BG : SURFACE_CARD,
        borderColor: isSelected ? BRAND_VIOLET : disabled ? 'rgba(255,255,255,0.06)' : BORDER,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        padding: '16px 20px',
        outline: 'none',
      }}
      // Keyboard focus ring
      onFocus={e => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 2px ${BRAND_VIOLET}`;
        }
      }}
      onBlur={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Radio indicator */}
        <div
          className="mt-0.5 flex-shrink-0 rounded-full border-2"
          style={{
            width: 18,
            height: 18,
            borderColor: isSelected ? BRAND_VIOLET : disabled ? 'rgba(255,255,255,0.2)' : '#4B5563',
            backgroundColor: isSelected ? BRAND_VIOLET : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          {isSelected && (
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#fff',
              }}
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="text-[15px] font-bold"
              style={{ color: disabled ? TEXT_SECONDARY : '#fff' }}
            >
              {title}
            </span>
            {subtitle && (
              <span
                className="text-[11px] font-normal"
                style={{ color: TEXT_SECONDARY }}
              >
                / {subtitle}
              </span>
            )}
            {badge && (
              <span
                className="flex-shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: 'rgba(217,119,6,0.2)',
                  color: '#FBBF24',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            className="m-0 mt-1 text-[12px] leading-relaxed"
            style={{ color: TEXT_SECONDARY }}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

interface ViewerModeModalProps {
  onConfirm: (mode: ViewerMode) => void;
  /** If a mode is already active, pre-select it so the change dialog is consistent. */
  initialSelection?: ViewerMode | null;
}

function ViewerModeModal({
  onConfirm,
  initialSelection,
}: ViewerModeModalProps): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  const [selected, setSelected] = useState<ViewerMode | null>(initialSelection ?? null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the Confirm button when the modal opens so keyboard users can
  // confirm immediately without tabbing through the full card list first.
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  // MIMPS-33: clinical mode is selectable/confirmable ONLY when the build flag
  // is on. Default (flag off) keeps the legacy research-only behaviour exactly:
  // the clinical card is disabled and clinical can never be confirmed.
  const canConfirm =
    selected === 'research' || (selected === 'clinical' && CLINICAL_MODE_ENABLED);

  function handleConfirm(): void {
    if (selected && canConfirm) {
      onConfirm(selected);
    }
  }

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bv-mode-gate-title"
      aria-describedby="bv-mode-gate-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: SURFACE,
          borderColor: BORDER,
        }}
      >
        {/* Header strip */}
        <div
          className="rounded-t-2xl px-6 py-4"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* Sparkle icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="rgba(255,255,255,0.85)"
              aria-hidden="true"
            >
              <path d="M12 2l2.1 5.9L20 10l-5.9 2.1L12 18l-2.1-5.9L4 10l5.9-2.1L12 2zM19 15l1.05 2.95L23 19l-2.95 1.05L19 23l-1.05-2.95L15 19l2.95-1.05L19 15z" />
            </svg>
            <span
              id="bv-mode-gate-title"
              className="text-[15px] font-bold text-white"
            >
              {t('mode.brand')}
            </span>
            <span className="ml-auto flex flex-shrink-0 items-center gap-2">
              <LanguageToggle />
              <span
                className="whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                {t('mode.researchOnlyBadge')}
              </span>
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6">
          <p
            id="bv-mode-gate-desc"
            className="mb-5 text-[13px] leading-relaxed"
            style={{ color: TEXT_SECONDARY }}
          >
            {t('mode.prompt')}
          </p>

          {/* Mode cards */}
          <div className="flex flex-col gap-3">
            <ModeCard
              title={t('mode.research.title')}
              description={t('mode.research.desc')}
              selected={selected === 'research'}
              onClick={() => setSelected('research')}
            />

            <ModeCard
              title={t('mode.clinical.title')}
              description={t('mode.clinical.desc')}
              // MIMPS-33: hide the "Em breve / Coming soon" badge once clinical
              // mode is actually enabled; keep it (and the disabled state) dark
              // by default.
              badge={CLINICAL_MODE_ENABLED ? undefined : t('mode.clinical.badge')}
              disabled={!CLINICAL_MODE_ENABLED}
              selected={selected === 'clinical'}
              onClick={() => setSelected('clinical')}
            />
          </div>

          {/* Confirm */}
          <button
            ref={confirmRef}
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="mt-5 w-full rounded-xl py-3 text-[14px] font-bold text-white transition-colors"
            style={{
              backgroundColor: canConfirm ? BRAND_VIOLET : 'rgba(124,58,237,0.35)',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => {
              if (canConfirm) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = BRAND_VIOLET_HOVER;
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = canConfirm
                ? BRAND_VIOLET
                : 'rgba(124,58,237,0.35)';
            }}
            aria-disabled={!canConfirm}
          >
            {t('mode.confirm')}
          </button>

          {/* Disclaimer */}
          <p
            className="mb-0 mt-4 text-center text-[10px] leading-snug"
            style={{ color: 'rgba(160,173,180,0.6)' }}
          >
            {t('mode.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Change-mode trigger button (rendered inside the AI panel header area)
// ---------------------------------------------------------------------------

export function ChangeModeButton(): React.ReactElement {
  const { t } = useTranslation('blackvoxel-ai');
  const { clearMode } = useViewerMode();
  return (
    <button
      type="button"
      onClick={clearMode}
      className="rounded px-2 py-0.5 text-[10px] font-semibold transition-colors"
      style={{
        backgroundColor: 'rgba(124,58,237,0.25)',
        color: '#C4B5FD',
        border: `1px solid rgba(124,58,237,0.4)`,
        cursor: 'pointer',
      }}
      title={t('mode.change')}
      aria-label={t('mode.change')}
    >
      {t('mode.change')}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Gate component — rendered by ViewerModeGateProvider
// ---------------------------------------------------------------------------

/**
 * Renders the full-screen mode-selection modal as a React portal into
 * document.body when no valid mode is active.  The viewer content underneath
 * is rendered but visually and functionally blocked by the modal backdrop.
 *
 * Usage: drop <ViewerModeGate /> inside any always-mounted extension component.
 */
export function ViewerModeGate(): React.ReactElement | null {
  const { mode, setMode } = useViewerMode();

  // Once the user has a valid (non-null, non-clinical) mode, hide the gate.
  const isGated = mode === null;

  if (!isGated) {
    return null;
  }

  // Portal so the modal floats above every OHIF z-index layer regardless of
  // where in the component tree this component lives.
  return ReactDOM.createPortal(
    <ViewerModeModal
      onConfirm={setMode}
      initialSelection={null}
    />,
    document.body
  );
}

export default ViewerModeGate;
