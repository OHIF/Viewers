import React, { useEffect, useState } from 'react';
import { useViewportElementRegistration } from '@ohif/core';

type OHIFDicomVideoViewportProps = {
  displaySets: AppTypes.DisplaySet[];
  viewportId?: string;
};

type LoadedVideo = {
  // The display set the result was loaded for; a result for any other display
  // set is stale and is ignored until the new load finishes.
  displaySet: AppTypes.DisplaySet;
  url: string | null;
  failed: boolean;
};

/**
 * getVideoUrl fetches with the data source's auth headers and returns an
 * object URL; without it the direct WADO URL is used as-is.
 */
async function fetchVideoUrl(
  videoUrl,
  getVideoUrl,
  signal: AbortSignal
): Promise<{ url?: string; revoke?: () => void } | undefined> {
  if (getVideoUrl) {
    return getVideoUrl({ signal });
  }
  return { url: await videoUrl };
}

/**
 * Plays a DICOM video display set in a native HTML5 <video> element.
 *
 * This is the non-Cornerstone path for video: modes whose image viewports are
 * not Cornerstone (e.g. the NiiVue mode) map the dicom-video SOP class handler
 * here. Measurement and image tools do not apply; the browser's own playback
 * controls are shown.
 */
function OHIFDicomVideoViewport({
  displaySets,
  viewportId = 'video-viewport',
}: OHIFDicomVideoViewportProps) {
  const [loaded, setLoaded] = useState<LoadedVideo | null>(null);
  const { register: registerViewportElement, unregister: unregisterViewportElement } =
    useViewportElementRegistration(viewportId);

  if (displaySets && displaySets.length > 1) {
    throw new Error(
      'OHIFDicomVideoViewport: only one display set is supported for dicom video right now'
    );
  }

  const displaySet = displaySets[0];
  const { videoUrl, getVideoUrl } = displaySet;
  const current = loaded?.displaySet === displaySet ? loaded : null;

  useEffect(() => {
    let isCancelled = false;
    let revokeUrl;
    const abortController = new AbortController();

    fetchVideoUrl(videoUrl, getVideoUrl, abortController.signal).then(
      result => {
        if (isCancelled) {
          result?.revoke?.();
          return;
        }

        revokeUrl = result?.revoke;
        setLoaded({ displaySet, url: result?.url || null, failed: !result?.url });
      },
      error => {
        console.warn('Failed to load video', error);
        if (!isCancelled) {
          setLoaded({ displaySet, url: null, failed: true });
        }
      }
    );

    return () => {
      isCancelled = true;
      abortController.abort();
      revokeUrl?.();
    };
  }, [displaySet, videoUrl, getVideoUrl]);

  return (
    <div
      className="bg-primary-black text-foreground flex h-full w-full items-center justify-center"
      ref={el => {
        registerViewportElement(el);
        return () => unregisterViewportElement();
      }}
      data-viewport-id={viewportId}
      data-cy="dicom-video-viewport"
    >
      {current?.failed ? (
        <div>Video could not be loaded</div>
      ) : (
        current?.url && (
          <video
            src={current.url}
            controls
            preload="auto"
            className="h-full w-full object-contain"
            onError={() => setLoaded({ ...current, url: null, failed: true })}
          />
        )
      )}
    </div>
  );
}

export default OHIFDicomVideoViewport;
