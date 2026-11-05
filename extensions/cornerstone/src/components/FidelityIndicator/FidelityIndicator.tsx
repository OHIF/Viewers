import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import {
  useViewportFidelity,
  type FidelityPresentation,
} from '../../hooks/useViewportFidelity';
import type { Types } from '@cornerstonejs/core';

import './FidelityIndicator.css';

const PRESENTATION_CLASS: Record<Exclude<FidelityPresentation, 'none'>, string> = {
  transient: 'ohif-fidelity--transient',
  standing: 'ohif-fidelity--standing',
  recovered: 'ohif-fidelity--recovered',
};

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
  // Generic copy until VF-VOCAB registry lands; never surface renderer jargon as the title.
  const known: Record<string, string> = {
    deviceTextureLimit: t('CauseDeviceLimit'),
    memoryBudget: t('CauseMemoryBudget'),
    performanceTarget: t('CausePerformance'),
    incompleteLoad: t('CauseIncompleteLoad'),
    lossyDecode: t('CauseLossyDecode'),
  };
  return known[state.cause] ?? t('CauseUnknown');
}

/**
 * Per-viewport fidelity indicator for OHIF (#6256 / VF-VIS).
 * Consumes Cornerstone3D `VIEWPORT_FIDELITY_CHANGED` / `getFidelityState()`.
 * Register on `viewportOverlay.*` (VF-REG-1), not viewport action menus.
 */
function FidelityIndicator({
  viewportId,
  element,
}: {
  viewportId: string;
  element?: HTMLElement | null;
}) {
  const { t } = useTranslation('FidelityIndicator');
  const { presentation, wasLossy, state, revealRecovered, hideRecoveredReveal } =
    useViewportFidelity({ viewportId, element });

  // Invisible hover target after recovery withdrew (VF-VIS-1d / VF-VIS-1e).
  const idleRevealer = presentation === 'none' && wasLossy;

  if (presentation === 'none' && !idleRevealer) {
    return null;
  }

  const labelKey = labelKeyOf(presentation);
  const cause = causeSummary(state, t);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`ohif-fidelity ${presentation !== 'none' ? PRESENTATION_CLASS[presentation] : 'ohif-fidelity--idle'}`}
          aria-label={t(ariaKeyOf(presentation === 'none' ? 'recovered' : presentation))}
          onMouseEnter={revealRecovered}
          onMouseLeave={hideRecoveredReveal}
          onFocus={revealRecovered}
          onBlur={hideRecoveredReveal}
        >
          <span className="ohif-fidelity__disc" aria-hidden="true" />
          {labelKey ? <span className="ohif-fidelity__label">{t(labelKey)}</span> : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="ohif-fidelity__tooltip">
        <div>{t(ariaKeyOf(presentation === 'none' ? 'recovered' : presentation))}</div>
        {cause ? <div className="ohif-fidelity__cause">{cause}</div> : null}
      </TooltipContent>
    </Tooltip>
  );
}

export default FidelityIndicator;
