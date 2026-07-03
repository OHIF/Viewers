import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function OHIFCornerstoneVideoViewport({ displaySets }) {
  if (displaySets && displaySets.length > 1) {
    throw new Error(
      'OHIFCornerstoneVideoViewport: only one display set is supported for dicom video right now'
    );
  }

  const { videoUrl, getVideoUrl } = displaySets[0];
  const mimeType = 'video/mp4';
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    let revokeUrl;
    const abortController = new AbortController();

    const load = async () => {
      try {
        const result = getVideoUrl
          ? await getVideoUrl({ signal: abortController.signal })
          : { url: await videoUrl };

        if (isCancelled) {
          result?.revoke?.();
          return;
        }

        revokeUrl = result?.revoke;
        setUrl(result?.url || null);
      } catch (error) {
        console.warn('Failed to load video', error);
        if (!isCancelled) {
          setUrl(null);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
      abortController.abort();
      revokeUrl?.();
    };
  }, [videoUrl, getVideoUrl]);

  // Need to copies of the source to fix a firefox bug
  return (
    <div className="bg-primary-black h-full w-full">
      <video
        src={url}
        controls
        controlsList="nodownload"
        preload="auto"
        className="h-full w-full"
        crossOrigin="anonymous"
      >
        <source
          src={url}
          type={mimeType}
        />
        <source
          src={url}
          type={mimeType}
        />
        Video src/type not supported:{' '}
        <a href={url}>
          {url} of type {mimeType}
        </a>
      </video>
    </div>
  );
}

OHIFCornerstoneVideoViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default OHIFCornerstoneVideoViewport;
