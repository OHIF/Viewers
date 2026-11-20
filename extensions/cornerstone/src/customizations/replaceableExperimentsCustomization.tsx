import React, { Children } from 'react';
import { CinePlayer, useCine } from '@ohif/ui-next';

/*
 * Opt-in experiments for Replaceable. Nothing here is active by default. Apply
 * one entry at run time, for example:
 *   customizationService.setCustomizations(
 *     ['@ohif/extension-cornerstone.customizationModule.replaceable-e2'], 'mode')
 */

/** E2: wraps the default action corners and renders `children`. */
function BorderedActionCorners({ children }: { children?: React.ReactNode }) {
  return (
    <div
      data-cy="e2-wrap"
      className="border-primary pointer-events-none absolute inset-0 border-2"
    >
      {children}
    </div>
  );
}

/** E4: the cine display in a viewport action corner, as a toolbar uiType. */
export function CineCornerDisplay({ viewportId }: { viewportId: string }) {
  const [{ isCineEnabled, cines }, cineService] = useCine();
  const cine = cines?.[viewportId];
  if (!isCineEnabled || !cine) {
    return null;
  }
  return (
    <div data-cy="e4-cine-corner">
      <CinePlayer
        className="!static !translate-x-0"
        isPlaying={!!cine.isPlaying}
        frameRate={cine.frameRate}
        onPlayPauseChange={isPlaying => cineService.setCine({ id: viewportId, isPlaying })}
        onFrameRateChange={frameRate => cineService.setCine({ id: viewportId, frameRate })}
        onClose={() => {
          cineService.setCine({ id: viewportId, isPlaying: false });
          cineService.setIsCineEnabled(false);
          cineService.setViewportCineClosed(viewportId);
        }}
      />
    </div>
  );
}

/** E5: the same parts of the viewport in a different order. */
function ReorderedViewport({ children }: { children?: React.ReactNode }) {
  const [wrapper, notification, corners] = Children.toArray(children);
  return (
    <div
      data-cy="e5-layout"
      className="contents"
    >
      {corners}
      {wrapper}
      {notification}
    </div>
  );
}

/** E8: two markers, to see which scope wins. */
const ScopeMarkerA = () => <div data-cy="e8-a" />;
const ScopeMarkerB = () => <div data-cy="e8-b" />;

export default {
  'replaceable-e2': {
    'components.ohifViewportActionCorners': { component: BorderedActionCorners },
  },
  'replaceable-e3-cine': { 'components.cinePlayer': { props: { className: 'e3-class' } } },
  'replaceable-e3-markers': {
    'components.viewportOrientationMarkers': { props: { className: 'e3-class' } },
  },
  'replaceable-e4': { 'components.cinePlayer': { component: null } },
  'replaceable-e5': { 'components.cornerstoneViewport': { component: ReorderedViewport } },
  'replaceable-e6': { 'components.viewportScrollbar': { component: null } },
  'replaceable-e8-a': { 'components.viewportNotification': { component: ScopeMarkerA } },
  'replaceable-e8-b': { 'components.viewportNotification': { component: ScopeMarkerB } },
};
