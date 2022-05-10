import React from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import Cornerstone3DViewportService from '../services/ViewportService/Cornerstone3DViewportService';
import PropTypes from 'prop-types';

import { ViewportDownloadForm } from '@ohif/ui';

import { getEnabledElement } from '../state';

const MINIMUM_SIZE = 100;
const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;
const VIEWPORT_ID = 'cornerstone-viewport-download-form';

const CornerstoneViewportDownloadForm = ({ onClose, activeViewportIndex }) => {
  const enabledElement = getEnabledElement(activeViewportIndex);
  const activeEnabledElement = enabledElement?.element;

  const enableViewport = viewportElement => {
    if (viewportElement) {
      const renderingEngine = Cornerstone3DViewportService.getRenderingEngine();

      const viewportInput = {
        viewportId: VIEWPORT_ID,
        element: viewportElement,
        type: cornerstone.Enums.ViewportType.STACK,
      };

      renderingEngine.enableElement(viewportInput);
    }
  };

  const disableViewport = viewportElement => {
    if (viewportElement) {
      const renderingEngine = Cornerstone3DViewportService.getRenderingEngine();

      renderingEngine.disableElement(VIEWPORT_ID);
    }
  };

  const updateViewportPreview = (
    downloadViewportElement,
    internalCanvas,
    fileType
  ) =>
    new Promise(resolve => {
      const enabledElement = cornerstone.getEnabledElement(
        downloadViewportElement
      );

      const { viewport: downloadViewport, renderingEngine } = enabledElement;

      // Note: Since any trigger of dimensions will update the viewport,
      // we need to resize the offScreenCanvas to accommodate for the new
      // dimensions, this is due to the reason that we are using the GPU offScreenCanvas
      // to render the viewport for the downloadViewport.
      renderingEngine.resize();

      // Trigger the render on the viewport to update the on screen
      downloadViewport.render();

      downloadViewportElement.addEventListener(
        cornerstone.Enums.Events.IMAGE_RENDERED,
        function updateViewport(event) {
          const enabledElement = cornerstone.getEnabledElement(event.target);
          const { viewport } = enabledElement;
          const { element } = viewport;

          const downloadCanvas = cornerstone.getOrCreateCanvas(element);

          const type = 'image/' + fileType;
          const dataUrl = downloadCanvas.toDataURL(type, 1);

          let newWidth = element.offsetHeight;
          let newHeight = element.offsetWidth;

          if (newWidth > DEFAULT_SIZE || newHeight > DEFAULT_SIZE) {
            const multiplier = DEFAULT_SIZE / Math.max(newWidth, newHeight);
            newHeight *= multiplier;
            newWidth *= multiplier;
          }

          resolve({ dataUrl, width: newWidth, height: newHeight });

          downloadViewportElement.removeEventListener(
            cornerstone.Enums.Events.IMAGE_RENDERED,
            updateViewport
          );
        }
      );
    });

  const loadImage = (activeViewportElement, viewportElement, width, height) =>
    new Promise(resolve => {
      if (activeViewportElement && viewportElement) {
        const activeViewportEnabledElement = cornerstone.getEnabledElement(
          activeViewportElement
        );

        if (!activeViewportEnabledElement) {
          return;
        }

        const { viewport } = activeViewportEnabledElement;

        if (!(viewport instanceof cornerstone.StackViewport)) {
          throw new Error('Viewport is not a StackViewport');
        }

        const imageId = viewport.getCurrentImageId();

        const renderingEngine = Cornerstone3DViewportService.getRenderingEngine();
        const downloadViewport = renderingEngine.getViewport(
          VIEWPORT_ID
        ) as cornerstone.StackViewport;

        downloadViewport.setStack([imageId]).then(() => {
          const properties = viewport.getProperties();
          downloadViewport.setProperties(properties);

          const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
          const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

          resolve({ width: newWidth, height: newHeight });
        });
      }
    });

  const toggleAnnotations = (toggle, viewportElement) => {
    return;
    cornerstoneTools.store.state.tools.forEach(({ name }) => {
      if (toggle) {
        cornerstoneTools.setToolEnabledForElement(viewportElement, name);
      } else {
        cornerstoneTools.setToolDisabledForElement(viewportElement, name);
      }
    });
  };

  const downloadBlob = (
    filename,
    fileType,
    viewportElement,
    downloadCanvas
  ) => {
    const file = `${filename}.${fileType}`;
    const mimetype = `image/${fileType}`;

    viewportElement.querySelector('canvas').toBlob(blob => {
      const URLObj = window.URL || window.webkitURL;
      const a = document.createElement('a');

      a.href = URLObj.createObjectURL(blob);
      a.download = file;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <ViewportDownloadForm
      onClose={onClose}
      minimumSize={MINIMUM_SIZE}
      maximumSize={MAX_TEXTURE_SIZE}
      defaultSize={DEFAULT_SIZE}
      canvasClass={'cornerstone-canvas'}
      activeViewport={activeEnabledElement}
      enableViewport={enableViewport}
      disableViewport={disableViewport}
      updateViewportPreview={updateViewportPreview}
      loadImage={loadImage}
      toggleAnnotations={toggleAnnotations}
      downloadBlob={downloadBlob}
    />
  );
};

CornerstoneViewportDownloadForm.propTypes = {
  onClose: PropTypes.func,
  activeViewportIndex: PropTypes.number.isRequired,
};

export default CornerstoneViewportDownloadForm;
