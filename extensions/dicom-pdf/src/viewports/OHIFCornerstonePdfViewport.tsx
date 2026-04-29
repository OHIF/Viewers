import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSystem, useViewportRef } from '@ohif/core';
import './OHIFCornerstonePdfViewport.css';

function OHIFCornerstonePdfViewport({ displaySets, viewportId = 'pdf-viewport' }) {
  const [url, setUrl] = useState(null);
  const viewportElementRef = useRef(null);
  const viewportRef = useViewportRef(viewportId);
  const { servicesManager } = useSystem();
  const { userAuthenticationService } = servicesManager?.services || {};

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
    let objectUrl;
    let isCancelled = false;

    const load = async () => {
      const resolvedUrl = await renderedUrl;

      if (!resolvedUrl) {
        return;
      }

      const authHeaders = userAuthenticationService?.getAuthorizationHeader?.();
      const authorizationHeader = authHeaders?.Authorization;

      if (!authorizationHeader) {
        if (!isCancelled) {
          setUrl(resolvedUrl);
        }
        return;
      }

      try {
        const response = await fetch(resolvedUrl, {
          headers: authHeaders,
        });

        if (!response.ok) {
          throw new Error(`Unable to load authenticated PDF (${response.status})`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (!isCancelled) {
          setUrl(objectUrl);
        }
      } catch (error) {
        console.warn('Failed to load PDF with authorization header, using direct URL', error);
        if (!isCancelled) {
          setUrl(resolvedUrl);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [renderedUrl, userAuthenticationService]);

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

OHIFCornerstonePdfViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
  viewportId: PropTypes.string,
};

export default OHIFCornerstonePdfViewport;
