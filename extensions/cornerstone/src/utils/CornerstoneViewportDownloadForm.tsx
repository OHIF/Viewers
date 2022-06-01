import React from 'react';
import domtoimage from 'dom-to-image';

import {
  Enums,
  getEnabledElement,
  getOrCreateCanvas,
  StackViewport,
} from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';
import PropTypes from 'prop-types';
import { ViewportDownloadForm } from '@ohif/ui';

import { getEnabledElement as OHIFgetEnabledElement } from '../state';

const MINIMUM_SIZE = 100;
const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;
const VIEWPORT_ID = 'cornerstone-viewport-download-form';
const TOOLGROUP_ID = 'cornerstone-viewport-download-form-toolgroup';

const CornerstoneViewportDownloadForm = ({
  onClose,
  activeViewportIndex,
  CornerstoneViewportService,
}) => {
  const enabledElement = OHIFgetEnabledElement(activeViewportIndex);
  const activeViewportElement = enabledElement?.element;

  const enableViewport = viewportElement => {
    if (viewportElement) {
      const renderingEngine = CornerstoneViewportService.getRenderingEngine();

      const viewportInput = {
        viewportId: VIEWPORT_ID,
        element: viewportElement,
        type: Enums.ViewportType.STACK,
      };

      renderingEngine.enableElement(viewportInput);
    }
  };

  const disableViewport = viewportElement => {
    if (viewportElement) {
      const renderingEngine = CornerstoneViewportService.getRenderingEngine();

      return new Promise(resolve => {
        renderingEngine.disableElement(VIEWPORT_ID);
        ToolGroupManager.destroyToolGroup(TOOLGROUP_ID);
      });
    }
  };

  const updateViewportPreview = (
    downloadViewportElement,
    internalCanvas,
    fileType
  ) =>
    new Promise(resolve => {
      const enabledElement = getEnabledElement(downloadViewportElement);

      const { viewport: downloadViewport, renderingEngine } = enabledElement;

      // Note: Since any trigger of dimensions will update the viewport,
      // we need to resize the offScreenCanvas to accommodate for the new
      // dimensions, this is due to the reason that we are using the GPU offScreenCanvas
      // to render the viewport for the downloadViewport.
      renderingEngine.resize();

      // Trigger the render on the viewport to update the on screen
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

          downloadViewportElement.removeEventListener(
            Enums.Events.IMAGE_RENDERED,
            updateViewport
          );
        }
      );
    });

  const loadImage = (activeViewportElement, viewportElement, width, height) =>
    new Promise(resolve => {
      if (activeViewportElement && viewportElement) {
        const activeViewportEnabledElement = getEnabledElement(
          activeViewportElement
        );

        if (!activeViewportEnabledElement) {
          return;
        }

        const { viewport } = activeViewportEnabledElement;

        if (!(viewport instanceof StackViewport)) {
          throw new Error('Viewport is not a StackViewport');
        }

        const imageId = viewport.getCurrentImageId();

        const renderingEngine = CornerstoneViewportService.getRenderingEngine();
        const downloadViewport = renderingEngine.getViewport(
          VIEWPORT_ID
        ) as StackViewport;

        downloadViewport.setStack([imageId]).then(() => {
          const properties = viewport.getProperties();
          downloadViewport.setProperties(properties);

          const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
          const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

          resolve({ width: newWidth, height: newHeight });
        });
      }
    });

  const toggleAnnotations = (
    toggle,
    viewportElement,
    activeViewportElement
  ) => {
    const activeViewportEnabledElement = getEnabledElement(
      activeViewportElement
    );

    const downloadViewportElement = getEnabledElement(viewportElement);

    const {
      viewportId: activeViewportId,
      renderingEngineId,
    } = activeViewportEnabledElement;
    const { viewportId: downloadViewportId } = downloadViewportElement;

    if (!activeViewportEnabledElement || !downloadViewportElement) {
      return;
    }

    const toolGroup = ToolGroupManager.getToolGroupForViewport(
      activeViewportId,
      renderingEngineId
    );

    let downloadToolGroup = ToolGroupManager.getToolGroupForViewport(
      downloadViewportId,
      renderingEngineId
    );

    if (downloadToolGroup === undefined) {
      downloadToolGroup = ToolGroupManager.createToolGroup(TOOLGROUP_ID);

      // what tools were in the active viewport?
      // make them all enabled instances so that they can not be interacted
      // with in the download viewport
      Object.values(toolGroup._toolInstances).forEach(tool => {
        downloadToolGroup.addTool(tool.getToolName());
      });

      // add the viewport to the toolGroup
      downloadToolGroup.addViewport(downloadViewportId);
    }

    Object.values(downloadToolGroup._toolInstances).forEach(tool => {
      const toolName = tool.getToolName();
      if (toggle) {
        downloadToolGroup.setToolEnabled(toolName);
      } else {
        downloadToolGroup.setToolDisabled(toolName);
      }
    });
  };

  const downloadBlob = (filename, fileType) => {
    const file = `${filename}.${fileType}`;
    const divForDownloadViewport = document.querySelector(
      `div[data-viewport-uid="${VIEWPORT_ID}"]`
    );

    domtoimage.toPng(divForDownloadViewport).then(dataUrl => {
      const link = document.createElement('a');
      link.download = file;
      link.href = dataUrl;
      link.click();
    });
  };

  return (
    <ViewportDownloadForm
      onClose={onClose}
      minimumSize={MINIMUM_SIZE}
      maximumSize={MAX_TEXTURE_SIZE}
      defaultSize={DEFAULT_SIZE}
      canvasClass={'cornerstone-canvas'}
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
  activeViewportIndex: PropTypes.number.isRequired,
};

export default CornerstoneViewportDownloadForm;
