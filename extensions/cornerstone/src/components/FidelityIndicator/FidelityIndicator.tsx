import React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { useCustomization } from '@ohif/core';
import {
  useViewportFidelity,
  type FidelityPresentation,
} from '../../hooks/useViewportFidelity';
import type { FidelityIndicatorDisplay } from '../../customizations/fidelityIndicatorDisplayCustomization';
import type { Types } from '@cornerstonejs/core';

import './FidelityIndicator.css';

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
    lossyDecode: t('CauseLossyDecode'),
  };
  return known[state.cause] ?? t('CauseUnknown');
}

function normalizeDisplay(value: unknown): FidelityIndicatorDisplay {
  if (value === 'text' || value === 'both' || value === 'icon') {
    return value;
  }
  return 'icon';
}

/**
 * Per-viewport fidelity indicator for OHIF (#6256 / VF-VIS).
 * Consumes Cornerstone3D `VIEWPORT_FIDELITY_CHANGED` / `getFidelityState()`.
 * Glyph is a fixed yellow warning triangle; transient vs standing is carried by
 * label / aria / tooltip. `cornerstone.fidelityIndicator.display`:
 * `icon` | `text` | `both` (default `icon`). The mode is also a class on the
 * button (`ohif-fidelity--icon` etc.); FidelityIndicator.css uses it for placement.
 */
function FidelityIndicator({
  viewportId,
  element,
}: {
  viewportId: string;
  element?: HTMLElement | null;
}) {
  const { t } = useTranslation('FidelityIndicator');
  const display = normalizeDisplay(useCustomization('cornerstone.fidelityIndicator.display'));
  const { presentation, wasLossy, state, revealRecovered, hideRecoveredReveal } =
    useViewportFidelity({ viewportId, element });

  const idleRevealer = presentation === 'none' && wasLossy;
  const showIcon = display === 'icon' || display === 'both';
  const showText = display === 'text' || display === 'both';
  // Yellow triangle only while lossy; recovered uses text (if enabled) then withdraws.
  const showWarningGlyph =
    showIcon && (presentation === 'transient' || presentation === 'standing');

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
          className={classNames('ohif-fidelity', `ohif-fidelity--${display}`, {
            'ohif-fidelity--idle': isIdle,
          })}
          aria-label={t(ariaKeyOf(ariaPresentation))}
          onMouseEnter={revealRecovered}
          onMouseLeave={hideRecoveredReveal}
          onFocus={revealRecovered}
          onBlur={hideRecoveredReveal}
        >
          {showWarningGlyph ? (
            <Icons.StatusWarning
              className="ohif-fidelity__glyph"
              aria-hidden="true"
            />
          ) : null}
          {showText && labelKey ? (
            <span className="ohif-fidelity__label">{t(labelKey)}</span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="ohif-fidelity__tooltip"
      >
        <div>{t(ariaKeyOf(ariaPresentation))}</div>
        {cause ? <div className="ohif-fidelity__cause">{cause}</div> : null}
      </TooltipContent>
    </Tooltip>
  );
}

export default FidelityIndicator;
