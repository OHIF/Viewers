import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  Enums,
  getEnabledElement,
  getOrCreateCanvas,
  StackViewport,
  BaseVolumeViewport,
} from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';
import { ImageModal, FooterAction } from '@ohif/ui-next';
import { getEnabledElement as OHIFgetEnabledElement } from '../state';

const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;
const VIEWPORT_ID = 'cornerstone-viewport-download-form';
const DEFAULT_FILENAME = 'image';

const FILE_TYPE_OPTIONS = [
  {
    value: 'jpg',
    label: 'JPG',
  },
  {
    value: 'png',
    label: 'PNG',
  },
];

const getDownloadViewportElement = () => {
  return document.querySelector(`div[data-viewport-uid="${VIEWPORT_ID}"]`) as HTMLDivElement;
};

const CornerstoneViewportDownloadForm = ({
  hide,
  activeViewportId: activeViewportIdProp,
  cornerstoneViewportService,
}: withAppTypes) => {
  const refViewportEnabledElementOHIF = OHIFgetEnabledElement(activeViewportIdProp);
  const activeViewportElement = refViewportEnabledElementOHIF?.element;
  const {
    viewportId: activeViewportId,
    renderingEngineId,
    viewport: activeViewport,
  } = getEnabledElement(activeViewportElement);

  const renderingEngine = cornerstoneViewportService.getRenderingEngine();

  const toolGroup = ToolGroupManager.getToolGroupForViewport(activeViewportId, renderingEngineId);

  useEffect(() => {
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

    return () => {
      Object.keys(toolModeAndBindings).forEach(toolName => {
        const { mode, bindings } = toolModeAndBindings[toolName];
        toolGroup.setToolMode(toolName, mode, { bindings });
      });
    };
  }, []);

  const enableViewport = viewportElement => {
    if (!viewportElement) {
      return;
    }

    const { viewport } = getEnabledElement(activeViewportElement);

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
  };

  const disableViewport = viewportElement => {
    return new Promise(() => {
      renderingEngine.disableElement(VIEWPORT_ID);
    });
  };

  const loadImage = async (width, height) => {
    if (!activeViewportElement) {
      return;
    }

    const activeViewportEnabledElement = getEnabledElement(activeViewportElement);

    if (!activeViewportEnabledElement) {
      return;
    }

    const { viewport } = activeViewportEnabledElement;
    const downloadViewport = renderingEngine.getViewport(VIEWPORT_ID);

    if (downloadViewport instanceof StackViewport) {
      const imageId = viewport.getCurrentImageId();
      const properties = viewport.getProperties();

      try {
        await downloadViewport.setStack([imageId]);
        downloadViewport.setProperties(properties);
        const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
        const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

        return { width: newWidth, height: newHeight };
      } catch (e) {
        // Happens on clicking the cancel button
        console.warn('Unable to set properties', e);
      }
    } else if (downloadViewport instanceof BaseVolumeViewport) {
      const volumeIds = viewport.getAllVolumeIds();
      downloadViewport.setVolumes([
        {
          volumeId: volumeIds[0],
        },
      ]);

      const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
      const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

      return { width: newWidth, height: newHeight };
    }
  };

  const toggleAnnotations = toggle => {
    const activeViewportEnabledElement = getEnabledElement(activeViewportElement);

    if (!activeViewportEnabledElement) {
      return;
    }

    const downloadViewport = renderingEngine.getViewport(VIEWPORT_ID);

    if (!downloadViewport) {
      return;
    }

    const { viewportId: activeViewportId, renderingEngineId } = activeViewportEnabledElement;
    const { id: downloadViewportId } = downloadViewport;

    const toolGroup = ToolGroupManager.getToolGroupForViewport(activeViewportId, renderingEngineId);

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

  return (
    <ViewportDownloadFormNew
      onClose={hide}
      defaultSize={DEFAULT_SIZE}
      //
      enableViewport={enableViewport}
      disableViewport={disableViewport}
      loadImage={loadImage}
      toggleAnnotations={toggleAnnotations}
      fileTypeOptions={FILE_TYPE_OPTIONS}
    />
  );
};

function ViewportDownloadFormNew({
  onClose,
  defaultSize,
  loadImage,
  enableViewport,
  disableViewport,
  fileTypeOptions,
  toggleAnnotations,
}) {
  const [viewportElement, setViewportElement] = useState(null);
  const [viewportElementDimensions, setViewportElementDimensions] = useState({
    width: defaultSize,
    height: defaultSize,
  });
  const [showAnnotations, setShowAnnotations] = useState(true);

  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [fileType, setFileType] = useState('jpg');

  useEffect(() => {
    if (!viewportElement) {
      return;
    }

    console.debug('enableViewport');
    enableViewport(viewportElement);

    return () => {
      console.debug('disableViewport');
      disableViewport(viewportElement);
    };
  }, [disableViewport, enableViewport, viewportElement]);

  useEffect(() => {
    setTimeout(() => {
      const dimensions = loadImage(
        viewportElementDimensions.width,
        viewportElementDimensions.height
      );

      toggleAnnotations(showAnnotations);
    }, 100);
  }, [
    loadImage,
    toggleAnnotations,
    viewportElementDimensions.width,
    viewportElementDimensions.height,
    showAnnotations,
  ]);

  const downloadBlob = (filename, fileType) => {
    const file = `${filename}.${fileType}`;
    const divForDownloadViewport = document.querySelector(
      `div[data-viewport-uid="${VIEWPORT_ID}"]`
    );

    if (!divForDownloadViewport) {
      console.debug('No viewport found for download');
      return;
    }

    html2canvas(divForDownloadViewport as HTMLElement).then(canvas => {
      const link = document.createElement('a');
      link.download = file;
      link.href = canvas.toDataURL(fileType, 1.0);
      link.click();
    });
  };

  return (
    <ImageModal className="max-w-[850px]">
      <ImageModal.Body>
        <ImageModal.ImageVisual>
          <div
            style={{
              height: viewportElementDimensions.height,
              width: viewportElementDimensions.width,
            }}
            data-viewport-uid={VIEWPORT_ID}
            ref={setViewportElement}
          ></div>
        </ImageModal.ImageVisual>

        <ImageModal.ImageOptions>
          <div className="flex items-end space-x-2">
            <ImageModal.Filename
              value={filename}
              onChange={e => setFilename(e.target.value)}
            >
              File name
            </ImageModal.Filename>
            <ImageModal.Filetype
              selected={fileType}
              onSelect={setFileType}
              options={fileTypeOptions}
            />
          </div>

          <ImageModal.ImageSize
            width={viewportElementDimensions.width.toString()}
            height={viewportElementDimensions.height.toString()}
            onWidthChange={e => {
              setViewportElementDimensions(prev => ({
                ...prev,
                width: parseInt(e.target.value) || defaultSize,
              }));
            }}
            onHeightChange={e => {
              setViewportElementDimensions(prev => ({
                ...prev,
                height: parseInt(e.target.value) || defaultSize,
              }));
            }}
            maxWidth={MAX_TEXTURE_SIZE.toString()}
            maxHeight={MAX_TEXTURE_SIZE.toString()}
          >
            Image size <span className="text-muted-foreground">px</span>
          </ImageModal.ImageSize>

          <ImageModal.SwitchOption
            defaultChecked={showAnnotations}
            checked={showAnnotations}
            onCheckedChange={checked => {
              setShowAnnotations(checked);
              toggleAnnotations(checked);
            }}
          >
            Include annotations
          </ImageModal.SwitchOption>
          <ImageModal.SwitchOption defaultChecked>Include warning message</ImageModal.SwitchOption>
          <FooterAction className="mt-2">
            <FooterAction.Right>
              <FooterAction.Secondary onClick={() => onClose()}>Cancel</FooterAction.Secondary>
              <FooterAction.Primary
                onClick={() => {
                  downloadBlob(filename || DEFAULT_FILENAME, fileType);
                  onClose();
                }}
              >
                Save
              </FooterAction.Primary>
            </FooterAction.Right>
          </FooterAction>
        </ImageModal.ImageOptions>
      </ImageModal.Body>
    </ImageModal>
  );
}

export default CornerstoneViewportDownloadForm;
