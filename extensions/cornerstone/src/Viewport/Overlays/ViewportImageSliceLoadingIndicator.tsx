// React Compiler opt-out: this file reads and mutates external cornerstone3D
// state (the enabled element, the camera, GL actors) during render and from
// imperative event handlers. The compiler's memoization assumes referential
// purity, so compiling it silently drops updates.
'use no memo';

import React, { useEffect, useState, useRef } from 'react';
import { Enums } from '@cornerstonejs/core';
import { Replaceable } from '@ohif/ui-next';

function ViewportImageSliceLoadingIndicator(props) {
  const { viewportData, element } = props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadIndicatorRef = useRef(null);
  const imageIdToBeLoaded = useRef(null);

  const setLoadingState = evt => {
    clearTimeout(loadIndicatorRef.current);

    loadIndicatorRef.current = setTimeout(() => {
      setLoading(true);
    }, 50);
  };

  const setFinishLoadingState = evt => {
    clearTimeout(loadIndicatorRef.current);

    setLoading(false);
  };

  const setErrorState = evt => {
    clearTimeout(loadIndicatorRef.current);

    if (imageIdToBeLoaded.current === evt.detail.imageId) {
      setError(evt.detail.error);
      imageIdToBeLoaded.current = null;
    }
  };

  useEffect(() => {
    element.addEventListener(Enums.Events.STACK_VIEWPORT_SCROLL, setLoadingState);
    element.addEventListener(Enums.Events.IMAGE_LOAD_ERROR, setErrorState);
    element.addEventListener(Enums.Events.STACK_NEW_IMAGE, setFinishLoadingState);

    return () => {
      element.removeEventListener(Enums.Events.STACK_VIEWPORT_SCROLL, setLoadingState);

      element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, setFinishLoadingState);

      element.removeEventListener(Enums.Events.IMAGE_LOAD_ERROR, setErrorState);
    };
  }, [element, viewportData]);

  let content = null;
  if (error) {
    content = (
      <div className="absolute top-0 left-0 h-full w-full bg-black opacity-50">
        <div className="transparent flex h-full w-full items-center justify-center">
          <p className="text-highlight text-xl font-light">
            <h4>Error Loading Image</h4>
            <p>An error has occurred.</p>
            <p>{error}</p>
          </p>
        </div>
      </div>
    );
  } else if (loading) {
    // IMPORTANT: we need to use the pointer-events-none class to prevent the loading indicator from
    // interacting with the mouse, since scrolling should propagate to the viewport underneath
    content = (
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-black opacity-50">
        <div className="transparent flex h-full w-full items-center justify-center">
          <p className="text-highlight text-xl font-light">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Replaceable
      id="viewportLoadingIndicator"
      props={props}
      loading={loading}
      error={error}
    >
      {content}
    </Replaceable>
  );
}

export default ViewportImageSliceLoadingIndicator;
