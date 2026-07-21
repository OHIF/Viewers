import React from 'react';
import { useViewportRendering } from '../../hooks';
import { DECIMATION_OVERLAY_MESSAGE } from '../../utils/decimation/constants';

/**
 * Renders the decimation label in the viewport top-right, same style as
 * demographic overlay items (Study Date, Series Description).
 */
function AutoDecimationOverlay({
  viewportId,
  servicesManager,
}: {
  viewportId: string;
  servicesManager: AppTypes.ServicesManager;
}) {
  const { isViewportBackgroundLight: isLight } = useViewportRendering(viewportId);
  const options = servicesManager?.services?.cornerstoneViewportService
    ?.getViewportInfo(viewportId)
    ?.getViewportOptions?.();
  const info = options?.autoDecimationInfo;
  const viewportType = options?.viewportType;
  const isVolume =
    viewportType === 'orthographic' ||
    viewportType === 'volume3d';

  if (!info?.applied || !isVolume) {
    return null;
  }

  const colorClass = 'text-yellow-400';
  const shadowClass = isLight ? 'shadow-light' : 'shadow-dark';

  return (
    <div
      className={`absolute viewport-overlay auto-decimation-overlay pointer-events-none ${colorClass} ${shadowClass} text-base leading-5 text-right`}
      style={{ top: '0.5rem', right: '3.5rem', maxWidth: 'calc(100% - 4rem)' }}
      title={DECIMATION_OVERLAY_MESSAGE}
      data-cy="auto-decimation-overlay"
    >
      <div className="overlay-item">
        <span className="break-words whitespace-pre-line">{DECIMATION_OVERLAY_MESSAGE}</span>
      </div>
    </div>
  );
}

export default AutoDecimationOverlay;
