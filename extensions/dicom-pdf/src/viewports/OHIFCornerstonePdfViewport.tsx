import React, { useEffect, useState, useRef } from 'react';
import { useViewportRef } from '@ohif/core';
import './OHIFCornerstonePdfViewport.css';

function OHIFCornerstonePdfViewport({ displaySets, viewportId = 'pdf-viewport' }) {
  const [url, setUrl] = useState(null);
  const viewportElementRef = useRef(null);
  const viewportRef = useViewportRef(viewportId);

  useEffect(() => {
    document.body.addEventListener('drag', makePdfDropTarget);
    return function cleanup() {
      document.body.removeEventListener('drag', makePdfDropTarget);
      viewportRef.unregister();
    };
  }, []);

  const [style, setStyle] = useState('pdf-yes-click');

  const makePdfScrollable = () => {
    setStyle('pdf-yes-click');
  };

  const makePdfDropTarget = () => {
    setStyle('pdf-no-click');
  };

  if (displaySets && displaySets.length > 1) {
    throw new Error(
      'OHIFCornerstonePdfViewport: only one display set is supported for dicom pdf right now'
    );
  }

  const { renderedUrl } = displaySets[0];
  const { getRenderedUrl } = displaySets[0];

  useEffect(() => {
    let isCancelled = false;
    let revokeUrl;
    const abortController = new AbortController();

    const load = async () => {
      try {
        const result = getRenderedUrl
          ? await getRenderedUrl({ signal: abortController.signal })
          : { url: await renderedUrl };

        if (isCancelled) {
          result?.revoke?.();
          return;
        }

        revokeUrl = result?.revoke;
        setUrl(result?.url || null);
      } catch (error) {
        console.warn('Failed to load PDF', error);
        if (!isCancelled) {
          setUrl(null);
        }
        return;
      }
    };

    load();

    return () => {
      isCancelled = true;
      abortController.abort();
      revokeUrl?.();
    };
  }, [renderedUrl, getRenderedUrl]);

  return (
    <div
      className="bg-primary-black text-foreground h-full w-full"
      onClick={makePdfScrollable}
      ref={el => {
        viewportElementRef.current = el;
        if (el) {
          viewportRef.register(el);
        }
      }}
      data-viewport-id={viewportId}
    >
      <object
        data={url}
        type="application/pdf"
        className={style}
      >
        <div>No online PDF viewer installed</div>
      </object>
    </div>
  );
}



export default OHIFCornerstonePdfViewport;
