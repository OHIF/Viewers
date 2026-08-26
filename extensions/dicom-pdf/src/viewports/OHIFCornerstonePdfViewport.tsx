import React, { useEffect, useState, useRef } from 'react';
import { useViewportRef } from '@ohif/core';
import './OHIFCornerstonePdfViewport.css';

/**
 * Resolves the display set's rendered PDF, or null if it fails.
 *
 * Module scope on purpose: the conditional inside this try/catch is a React
 * Compiler limitation ("value blocks within a try/catch") that bails the whole
 * component when inlined. Plain functions are never compiled.
 */
async function loadRenderedPdf(getRenderedUrl, renderedUrl, signal) {
  try {
    return getRenderedUrl ? await getRenderedUrl({ signal }) : { url: await renderedUrl };
  } catch (error) {
    console.warn('Failed to load PDF', error);
    return null;
  }
}

function OHIFCornerstonePdfViewport({ displaySets, viewportId = 'pdf-viewport' }) {
  const [url, setUrl] = useState(null);
  const viewportElementRef = useRef(null);
  const viewportRef = useViewportRef(viewportId);

  // Declared above the effect that subscribes makePdfDropTarget: the effect body
  // only runs after render, but a reference that textually precedes its
  // declaration is something the compiler refuses to reason about.
  const [style, setStyle] = useState('pdf-yes-click');

  const makePdfScrollable = () => {
    setStyle('pdf-yes-click');
  };

  const makePdfDropTarget = () => {
    setStyle('pdf-no-click');
  };

  useEffect(() => {
    document.body.addEventListener('drag', makePdfDropTarget);
    return function cleanup() {
      document.body.removeEventListener('drag', makePdfDropTarget);
      viewportRef.unregister();
    };
  }, []);


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
      const result = await loadRenderedPdf(
        getRenderedUrl,
        renderedUrl,
        abortController.signal
      );

      if (isCancelled) {
        result?.revoke?.();
        return;
      }

      revokeUrl = result?.revoke;
      setUrl(result?.url || null);
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
