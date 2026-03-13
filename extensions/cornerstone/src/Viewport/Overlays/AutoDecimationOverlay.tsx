import React from 'react';
import { useViewportRendering } from '../../hooks';

/**
 * Renders the auto-decimation message in the viewport top-right, same style as
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
    viewportType === 1 || viewportType === 2 || // Enums.ViewportType.ORTHOGRAPHIC, VOLUME_3D
    viewportType === 'orthographic' ||
    viewportType === 'volume3d';

  if (!info?.message || !isVolume) {
    return null;
  }

  const colorClass = isLight ? 'text-neutral-dark' : 'text-neutral-light';
  const shadowClass = isLight ? 'shadow-light' : 'shadow-dark';

  return (
    <div
      className={`absolute right-0 viewport-overlay pointer-events-none ${colorClass} ${shadowClass} text-base leading-5 text-right`}
      style={{ top: '2.15rem', maxWidth: '85%' }}
      title="Volume auto-decimated"
      data-cy="auto-decimation-overlay"
    >
      <div className="overlay-item flex flex-row flex-wrap max-w-[85%]">
        <span className="shrink-0 break-words whitespace-normal">{info.message}</span>
      </div>
    </div>
  );
}

export default AutoDecimationOverlay;
