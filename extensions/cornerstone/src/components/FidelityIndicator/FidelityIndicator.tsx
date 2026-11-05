import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
import { useCustomization } from '@ohif/core';
import {
  useViewportFidelity,
  type FidelityPresentation,
} from '../../hooks/useViewportFidelity';
import type { FidelityIndicatorDisplay } from '../../customizations/fidelityIndicatorDisplayCustomization';
import type { Types } from '@cornerstonejs/core';

import './FidelityIndicator.css';

type GlyphState = 'loading' | 'lod' | 'lossy' | 'done';

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

/** Map OHIF presentation + CS3D shownState to the CS3D glyph state. */
function glyphStateOf(
  presentation: FidelityPresentation,
  shownState: Types.ViewportFidelityShownState | undefined
): GlyphState | null {
  if (presentation === 'recovered') {
    return 'done';
  }
  if (presentation === 'standing') {
    return 'lossy';
  }
  if (presentation === 'transient') {
    return shownState === 'lod' ? 'lod' : 'loading';
  }
  return null;
}

function FidelityGlyph() {
  return (
    <>
      <div
        className="fi-html"
        aria-hidden="true"
      >
        <div className="fi-html-ring" />
        <div className="fi-html-dot" />
      </div>
      <svg
        className="fidelity-indicator"
        width="10"
        height="10"
        viewBox="0 0 15 15"
        aria-hidden="true"
      >
        <g className="fi-glyph">
          <circle
            className="fi-disc"
            cx="7.5"
            cy="7.5"
            r="7.5"
          />
          <g className="fi-dot-wrap">
            <circle
              className="fi-dot"
              cx="7.5"
              cy="7.5"
              r="4.5"
            />
          </g>
          <path
            className="fi-check"
            d="M4.7 7.8 L6.7 9.7 L10.3 5.7"
          />
          <path
            className="fi-dash"
            d="M5 7.5 H10"
          />
        </g>
      </svg>
    </>
  );
}

/**
 * Per-viewport fidelity indicator for OHIF (#6256 / VF-VIS).
 * Consumes Cornerstone3D `VIEWPORT_FIDELITY_CHANGED` / `getFidelityState()`.
 * Disc matches CS3D product glyph; label is OHIF i18n when display allows it.
 * `cornerstone.fidelityIndicator.display`: `icon` | `text` | `both` (default `icon`).
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

  const glyphState = glyphStateOf(presentation, state?.shownState);
  const prevGlyphRef = useRef<GlyphState | null>(null);
  const dataFrom =
    glyphState === 'lossy' && prevGlyphRef.current === 'loading' ? 'loading' : undefined;

  useEffect(() => {
    if (glyphState) {
      prevGlyphRef.current = glyphState;
    }
  }, [glyphState]);

  const idleRevealer = presentation === 'none' && wasLossy;
  const showIcon = display === 'icon' || display === 'both';
  const showText = display === 'text' || display === 'both';

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
          className={`ohif-fidelity${isIdle ? ' ohif-fidelity--idle' : ''}`}
          data-state={glyphState ?? undefined}
          data-from={dataFrom}
          data-shown={glyphState === 'done' ? 'true' : undefined}
          aria-label={t(ariaKeyOf(ariaPresentation))}
          onMouseEnter={revealRecovered}
          onMouseLeave={hideRecoveredReveal}
          onFocus={revealRecovered}
          onBlur={hideRecoveredReveal}
        >
          {showIcon && !isIdle ? <FidelityGlyph /> : null}
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
