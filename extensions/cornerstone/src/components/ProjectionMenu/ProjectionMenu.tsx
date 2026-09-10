import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Numeric, Switch } from '@ohif/ui-next';
import { useViewportProjection } from '../../hooks/useViewportProjection';
import { SLAB_COMMIT_DELAY_MS, SLAB_SLIDER_STEP } from '../../projection/projectionConstants';

interface ProjectionMenuProps {
  viewportId: string;
  className?: string;
}

const REASON_KEYS: Record<string, string> = {
  'not-volume': 'Projection needs a volume viewport',
  volume3d: 'Not available on 3D viewports',
  'cpu-lane': 'Not available with CPU rendering',
  'layer-unresolved': 'Layer not ready',
  'volume-not-loaded': 'Waiting for the volume to finish loading',
};

/**
 * Projection (MIP) controls for one viewport: a mode toggle (an on/off switch
 * because exactly one projectable mode is UI-exposed; a selector otherwise) and
 * a slab-thickness slider. All state is derived from the engine through
 * useViewportProjection; the slider keeps a local draft while dragging and
 * commits once after SLAB_COMMIT_DELAY_MS.
 */
function ProjectionMenu({ viewportId, className }: ProjectionMenuProps) {
  const { t } = useTranslation('Buttons');
  const {
    isProjecting,
    modeId,
    modes,
    slabThickness,
    slabRange,
    canEnable,
    unsupportedReason,
    setMode,
    setSlabThickness,
  } = useViewportProjection(viewportId);

  const [draft, setDraft] = useState<number>(slabThickness);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow the engine whenever it changes underneath us (other tools, restore).
  useEffect(() => {
    if (commitTimer.current === null) {
      setDraft(slabThickness);
    }
  }, [slabThickness]);

  useEffect(
    () => () => {
      if (commitTimer.current !== null) {
        clearTimeout(commitTimer.current);
      }
    },
    []
  );

  const min = Math.max(slabRange?.min ?? SLAB_SLIDER_STEP, SLAB_SLIDER_STEP);
  const max = Math.max(Math.ceil(slabRange?.max ?? 100), min + SLAB_SLIDER_STEP);
  const singleMode = modes.length === 1;
  const toggleMode = modes[0];

  const onDraftChange = (value: number) => {
    setDraft(value);
    if (commitTimer.current !== null) {
      clearTimeout(commitTimer.current);
    }
    commitTimer.current = setTimeout(() => {
      commitTimer.current = null;
      setSlabThickness(value);
    }, SLAB_COMMIT_DELAY_MS);
  };

  const reasonText = unsupportedReason
    ? t(REASON_KEYS[unsupportedReason] ?? unsupportedReason)
    : '';

  return (
    <div
      className={className}
      data-cy="projection-menu"
    >
      <div className="bg-popover w-72 rounded-lg p-3 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-muted-foreground text-base">{t('Projection')}</span>
          {singleMode ? (
            <div className="flex items-center gap-2">
              <span className="text-foreground text-sm">{t(toggleMode.shortLabel)}</span>
              <Switch
                data-cy="projection-toggle"
                aria-label={t(toggleMode.label)}
                checked={isProjecting}
                disabled={!canEnable && !isProjecting}
                onCheckedChange={checked => setMode(checked ? toggleMode.id : 'none')}
              />
            </div>
          ) : (
            <select
              data-cy="projection-mode-select"
              aria-label={t('Projection')}
              className="bg-popover text-foreground border-input rounded border px-2 py-1 text-sm"
              value={modeId}
              disabled={!canEnable && !isProjecting}
              onChange={event => setMode(event.target.value as typeof modeId)}
            >
              <option value="none">{t('Projection off')}</option>
              {modes.map(mode => (
                <option
                  key={mode.id}
                  value={mode.id}
                >
                  {t(mode.shortLabel)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t('Slab thickness')}</span>
          <span
            className="text-foreground text-sm"
            data-cy="projection-slab-value"
          >
            {`${Math.round(draft)} mm`}
          </span>
        </div>
        <Numeric.Container
          mode="singleRange"
          value={draft}
          onChange={(val: number | [number, number]) => {
            if (typeof val === 'number') {
              onDraftChange(val);
            }
          }}
          min={min}
          max={max}
          step={SLAB_SLIDER_STEP}
        >
          <div data-cy="projection-slab-slider">
            <Numeric.SingleRange showNumberInput={false} />
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground text-xs">{`${min} mm`}</span>
            <span className="text-muted-foreground text-xs">{`${max} mm`}</span>
          </div>
        </Numeric.Container>
        {!canEnable && reasonText ? (
          <div
            className="text-muted-foreground mt-2 text-xs"
            data-cy="projection-unsupported-reason"
          >
            {reasonText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProjectionMenu;
