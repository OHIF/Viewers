import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { useViewportFidelity, type FidelityPresentation } from '../../hooks/useViewportFidelity';
import type { Types } from '@cornerstonejs/core';

function labelKeyOf(presentation: FidelityPresentation): string | null {
  if (presentation === 'transient') {
    return 'TransientLowFidelity';
  }
  if (presentation === 'standing') {
    return 'LowFidelity';
  }
  if (presentation === 'recovered') {
    return 'FullFidelity';
  }
  return null;
}

function ariaKeyOf(presentation: FidelityPresentation): string {
  if (presentation === 'transient') {
    return 'AriaTransient';
  }
  if (presentation === 'standing') {
    return 'AriaStanding';
  }
  if (presentation === 'recovered') {
    return 'AriaRecovered';
  }
  return 'AriaIdle';
}

function causeSummary(
  state: Types.ViewportFidelityState | null,
  t: (key: string) => string
): string | null {
  if (!state?.cause) {
    return null;
  }
  const known: Record<string, string> = {
    deviceTextureLimit: t('CauseDeviceLimit'),
    memoryBudget: t('CauseMemoryBudget'),
    performanceTarget: t('CausePerformance'),
    incompleteLoad: t('CauseIncompleteLoad'),
    missingFrames: t('CauseMissingFrames'),
    lossyDecode: t('CauseLossyDecode'),
    displayIssue: t('CauseDisplayIssue'),
  };
  return known[state.cause] ?? t('CauseUnknown');
}

/** `icon`: glyph only (default). `text`: label only. `both`: glyph and label. */
export type FidelityIndicatorDisplay = 'icon' | 'text' | 'both';

/**
 * Per-viewport fidelity indicator for OHIF (#6256 / VF-VIS), rendered last in the
 * top-right viewport action corner.
 * Consumes Cornerstone3D `VIEWPORT_FIDELITY_CHANGED` / `getFidelityState()`.
 * Glyph is a fixed yellow warning triangle; transient vs standing is carried by
 * label / aria / tooltip. No customization sets `display` yet; that comes with
 * `Replaceable` (OHIF/Viewers#6452).
 */
function FidelityIndicator({
  viewportId,
  display = 'icon',
}: {
  viewportId: string;
  display?: FidelityIndicatorDisplay;
}) {
  const { t } = useTranslation('FidelityIndicator');
  const { presentation, wasLossy, state, revealRecovered, hideRecoveredReveal } =
    useViewportFidelity({ viewportId });

  const idleRevealer = presentation === 'none' && wasLossy;
  const showIcon = display === 'icon' || display === 'both';
  const showText = display === 'text' || display === 'both';
  // Yellow triangle while lossy; green check for the recovered hold and its hover reveal.
  const showWarningGlyph =
    showIcon && (presentation === 'transient' || presentation === 'standing');
  const showRecoveredGlyph = showIcon && presentation === 'recovered';

  if (presentation === 'none' && !idleRevealer) {
    return null;
  }

  // text-only mode: nothing to show while idle (no invisible icon hit target needed for text)
  if (presentation === 'none' && idleRevealer && display === 'text') {
    return null;
  }

  const labelKey = labelKeyOf(presentation);
  const cause = causeSummary(state, t);
  const ariaPresentation = presentation === 'none' ? 'recovered' : presentation;
  const isIdle = presentation === 'none' && idleRevealer;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-cy="fidelity-indicator"
          // self-start: level with the toolbar buttons beside it. They sit at the top of a
          // taller wrapper, so a centred indicator would drop when they show (VF-VIS-9).
          className={classNames(
            'inline-flex cursor-default items-center gap-1.5 self-start leading-none',
            {
              // Invisible hover target after the recovered hold (VF-VIS-1d).
              'h-3 w-3 opacity-0': isIdle,
            }
          )}
          aria-label={t(ariaKeyOf(ariaPresentation))}
          onMouseEnter={revealRecovered}
          onMouseLeave={hideRecoveredReveal}
          onFocus={revealRecovered}
          onBlur={hideRecoveredReveal}
        >
          {showWarningGlyph ? (
            <Icons.StatusWarning
              className="h-6 w-6 shrink-0"
              aria-hidden="true"
            />
          ) : null}
          {showRecoveredGlyph ? (
            <Icons.StatusSuccess
              className="h-6 w-6 shrink-0 text-green-500"
              aria-hidden="true"
            />
          ) : null}
          {showText && labelKey ? (
            <span className="whitespace-nowrap text-xs font-semibold leading-tight [text-shadow:0_0_2px_rgb(0_0_0/70%)]">
              {t(labelKey)}
            </span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-[16rem]"
      >
        <div>{t(ariaKeyOf(ariaPresentation))}</div>
        {cause ? <div className="mt-1 opacity-[.85]">{cause}</div> : null}
        {/* VF-INFO-11: Cornerstone3D gives the issue messages in English only. */}
        {state?.issues?.map(issue => (
          <div
            key={issue.code}
            className="mt-1 opacity-[.85]"
          >
            {issue.message}
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

export default FidelityIndicator;
