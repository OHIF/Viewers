import React, { useEffect, useState, useRef } from 'react';
import { useViewportRef } from '@ohif/core';
import './OHIFCornerstonePdfViewport.css';

interface OHIFCornerstonePdfViewportProps {
  displaySets: object[];
  viewportId?: string;
}

function OHIFCornerstonePdfViewport({
  displaySets,
  viewportId = 'pdf-viewport'
}: OHIFCornerstonePdfViewportProps) {
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

  useEffect(() => {
    const load = async () => {
      setUrl(await renderedUrl);
    };

    load();
  }, [renderedUrl]);

  return (
    <div
      className="bg-primary-black h-full w-full text-white"
      onClick={makePdfScrollable}
      ref={el => {
        viewportElementRef.current = el;
        if (el) viewportRef.register(el);
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
