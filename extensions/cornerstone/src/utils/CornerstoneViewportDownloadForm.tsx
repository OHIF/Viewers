import React, { useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  Enums,
  getEnabledElement,
  getOrCreateCanvas,
  StackViewport,
  BaseVolumeViewport,
} from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';
import PropTypes from 'prop-types';
import { ViewportDownloadForm } from '@ohif/ui';

import { getEnabledElement as OHIFgetEnabledElement } from '../state';

const MINIMUM_SIZE = 100;
const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;
const VIEWPORT_ID = 'cornerstone-viewport-download-form';

const CornerstoneViewportDownloadForm = ({
  onClose,
  activeViewportId: activeViewportIdProp,
  cornerstoneViewportService,
}) => {
  const enabledElement = OHIFgetEnabledElement(activeViewportIdProp);
  const activeViewportElement = enabledElement?.element;
  const activeViewportEnabledElement = getEnabledElement(activeViewportElement);

  const {
    viewportId: activeViewportId,
    renderingEngineId,
    viewport: activeViewport,
  } = activeViewportEnabledElement;

  const toolGroup = ToolGroupManager.getToolGroupForViewport(activeViewportId, renderingEngineId);

  const toolModeAndBindings = Object.keys(toolGroup.toolOptions).reduce((acc, toolName) => {
    const tool = toolGroup.toolOptions[toolName];
    const { mode, bindings } = tool;

    return {
      ...acc,
      [toolName]: {
        mode,
        bindings,
      },
    };
  }, {});

  useEffect(() => {
    return () => {
      Object.keys(toolModeAndBindings).forEach(toolName => {
        const { mode, bindings } = toolModeAndBindings[toolName];
        toolGroup.setToolMode(toolName, mode, { bindings });
      });
    };
  }, []);

  const enableViewport = viewportElement => {
    if (viewportElement) {
      const { renderingEngine, viewport } = getEnabledElement(activeViewportElement);

      const viewportInput = {
        viewportId: VIEWPORT_ID,
        element: viewportElement,
        type: viewport.type,
        defaultOptions: {
          background: viewport.defaultOptions.background,
          orientation: viewport.defaultOptions.orientation,
        },
      };

      renderingEngine.enableElement(viewportInput);
    }
  };

  const disableViewport = viewportElement => {
    if (viewportElement) {
      const { renderingEngine } = getEnabledElement(viewportElement);
      return new Promise(resolve => {
        renderingEngine.disableElement(VIEWPORT_ID);
      });
    }
  };

  const updateViewportPreview = (downloadViewportElement, internalCanvas, fileType) =>
    new Promise(resolve => {
      const enabledElement = getEnabledElement(downloadViewportElement);

      const { viewport: downloadViewport, renderingEngine } = enabledElement;

      // Note: Since any trigger of dimensions will update the viewport,
      // we need to resize the offScreenCanvas to accommodate for the new
      // dimensions, this is due to the reason that we are using the GPU offScreenCanvas
      // to render the viewport for the downloadViewport.
      renderingEngine.resize();

      // Trigger the render on the viewport to update the on screen
      // downloadViewport.resetCamera();
      downloadViewport.render();

      downloadViewportElement.addEventListener(
        Enums.Events.IMAGE_RENDERED,
        function updateViewport(event) {
          const enabledElement = getEnabledElement(event.target);
          const { viewport } = enabledElement;
          const { element } = viewport;

          const downloadCanvas = getOrCreateCanvas(element);

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

          downloadViewportElement.removeEventListener(Enums.Events.IMAGE_RENDERED, updateViewport);

          // for some reason we need a reset camera here, and I don't know why
          downloadViewport.resetCamera();
          const presentation = activeViewport.getViewPresentation();
          if (downloadViewport.setView) {
            downloadViewport.setView(activeViewport.getViewReference(), presentation);
          }
          downloadViewport.render();
        }
      );
    });

  const loadImage = (activeViewportElement, viewportElement, width, height) =>
    new Promise(resolve => {
      if (activeViewportElement && viewportElement) {
        const activeViewportEnabledElement = getEnabledElement(activeViewportElement);

        if (!activeViewportEnabledElement) {
          return;
        }

        const { viewport } = activeViewportEnabledElement;

        const renderingEngine = cornerstoneViewportService.getRenderingEngine();
        const downloadViewport = renderingEngine.getViewport(VIEWPORT_ID);

        if (downloadViewport instanceof StackViewport) {
          const imageId = viewport.getCurrentImageId();
          const properties = viewport.getProperties();

          downloadViewport.setStack([imageId]).then(() => {
            try {
              downloadViewport.setProperties(properties);
              const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
              const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

              resolve({ width: newWidth, height: newHeight });
            } catch (e) {
              // Happens on clicking the cancel button
              console.warn('Unable to set properties', e);
            }
          });
        } else if (downloadViewport instanceof BaseVolumeViewport) {
          const actors = viewport.getActors();
          // downloadViewport.setActors(actors);
          actors.forEach(actor => {
            downloadViewport.addActor(actor);
          });

          downloadViewport.render();

          const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
          const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

          resolve({ width: newWidth, height: newHeight });
        }
      }
    });

  const toggleAnnotations = (toggle, viewportElement, activeViewportElement) => {
    const activeViewportEnabledElement = getEnabledElement(activeViewportElement);

    const downloadViewportElement = getEnabledElement(viewportElement);

    const { viewportId: activeViewportId, renderingEngineId } = activeViewportEnabledElement;
    const { viewportId: downloadViewportId } = downloadViewportElement;

    if (!activeViewportEnabledElement || !downloadViewportElement) {
      return;
    }

    const toolGroup = ToolGroupManager.getToolGroupForViewport(activeViewportId, renderingEngineId);

    // add the viewport to the toolGroup
    toolGroup.addViewport(downloadViewportId, renderingEngineId);

    Object.keys(toolGroup.getToolInstances()).forEach(toolName => {
      // make all tools Enabled so that they can not be interacted with
      // in the download viewport
      if (toggle && toolName !== 'Crosshairs') {
        try {
          toolGroup.setToolEnabled(toolName);
        } catch (e) {
          console.log(e);
        }
      } else {
        toolGroup.setToolDisabled(toolName);
      }
    });
  };

  const downloadBlob = (filename, fileType) => {
    const file = `${filename}.${fileType}`;
    const divForDownloadViewport = document.querySelector(
      `div[data-viewport-uid="${VIEWPORT_ID}"]`
    );

    html2canvas(divForDownloadViewport).then(canvas => {
      const link = document.createElement('a');
      link.download = file;
      link.href = canvas.toDataURL(fileType, 1.0);
      link.click();
    });
  };

  return (
    <ViewportDownloadForm
      onClose={onClose}
      minimumSize={MINIMUM_SIZE}
      maximumSize={MAX_TEXTURE_SIZE}
      defaultSize={DEFAULT_SIZE}
      activeViewportElement={activeViewportElement}
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
  activeViewportId: PropTypes.string.isRequired,
};

export default CornerstoneViewportDownloadForm;
