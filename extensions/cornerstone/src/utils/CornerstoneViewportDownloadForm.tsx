import React, { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { getEnabledElement, StackViewport, BaseVolumeViewport } from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';
import { ImageModal, FooterAction } from '@ohif/ui-next';
import { getEnabledElement as OHIFgetEnabledElement } from '../state';
import { useSystem } from '@ohif/core/src';

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

type ViewportDownloadFormProps = {
  hide: () => void;
  activeViewportId: string;
};

const CornerstoneViewportDownloadForm = ({
  hide,
  activeViewportId: activeViewportIdProp,
}: ViewportDownloadFormProps) => {
  const { servicesManager } = useSystem();
  const { customizationService, cornerstoneViewportService } = servicesManager.services;
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: DEFAULT_SIZE,
    height: DEFAULT_SIZE,
  });

  const warningState = customizationService.getCustomization('viewportDownload.warningMessage') as {
    enabled: boolean;
    value: string;
  };

  const refViewportEnabledElementOHIF = OHIFgetEnabledElement(activeViewportIdProp);
  const activeViewportElement = refViewportEnabledElementOHIF?.element;
  const { viewportId: activeViewportId, renderingEngineId } =
    getEnabledElement(activeViewportElement);

  const renderingEngine = cornerstoneViewportService.getRenderingEngine();
  const toolGroup = ToolGroupManager.getToolGroupForViewport(activeViewportId, renderingEngineId);

  useEffect(() => {
    const toolModeAndBindings = Object.keys(toolGroup.toolOptions).reduce((acc, toolName) => {
      const tool = toolGroup.toolOptions[toolName];
      const { mode, bindings } = tool;

      return {
        ...acc,
        [toolName]: { mode, bindings },
      };
    }, {});

    return () => {
      Object.keys(toolModeAndBindings).forEach(toolName => {
        const { mode, bindings } = toolModeAndBindings[toolName];
        toolGroup.setToolMode(toolName, mode, { bindings });
      });
    };
  }, []);

  const handleEnableViewport = (viewportElement: HTMLElement) => {
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

  const handleDisableViewport = async () => {
    renderingEngine.disableElement(VIEWPORT_ID);
  };

  const handleLoadImage = async (width: number, height: number) => {
    if (!activeViewportElement) {
      return;
    }

    const activeViewportEnabledElement = getEnabledElement(activeViewportElement);
    if (!activeViewportEnabledElement) {
      return;
    }

    const { viewport } = activeViewportEnabledElement;
    const downloadViewport = renderingEngine.getViewport(VIEWPORT_ID);

    try {
      if (downloadViewport instanceof StackViewport) {
        const imageId = viewport.getCurrentImageId();
        const properties = viewport.getProperties();

        await downloadViewport.setStack([imageId]);
        downloadViewport.setProperties(properties);

        return {
          width: Math.min(width || DEFAULT_SIZE, MAX_TEXTURE_SIZE),
          height: Math.min(height || DEFAULT_SIZE, MAX_TEXTURE_SIZE),
        };
      } else if (downloadViewport instanceof BaseVolumeViewport) {
        const volumeIds = viewport.getAllVolumeIds();
        downloadViewport.setVolumes([{ volumeId: volumeIds[0] }]);

        return {
          width: Math.min(width || DEFAULT_SIZE, MAX_TEXTURE_SIZE),
          height: Math.min(height || DEFAULT_SIZE, MAX_TEXTURE_SIZE),
        };
      }
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const handleToggleAnnotations = (show: boolean) => {
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
      if (show && toolName !== 'Crosshairs') {
        try {
          toolGroup.setToolEnabled(toolName);
        } catch (error) {
          console.debug('Error enabling tool:', error);
        }
      } else {
        toolGroup.setToolDisabled(toolName);
      }
    });
  };

  useEffect(() => {
    if (viewportDimensions.width && viewportDimensions.height) {
      setTimeout(() => {
        handleLoadImage(viewportDimensions.width, viewportDimensions.height);
        handleToggleAnnotations(showAnnotations);
      }, 100);
    }
  }, [viewportDimensions, showAnnotations]);

  const handleDownload = async (filename: string, fileType: string) => {
    const divForDownloadViewport = document.querySelector(
      `div[data-viewport-uid="${VIEWPORT_ID}"]`
    );

    if (!divForDownloadViewport) {
      console.debug('No viewport found for download');
      return;
    }

    const canvas = await html2canvas(divForDownloadViewport as HTMLElement);
    const link = document.createElement('a');
    link.download = `${filename}.${fileType}`;
    link.href = canvas.toDataURL(`image/${fileType}`, 1.0);
    link.click();
  };

  return (
    <ViewportDownloadFormNew
      onClose={hide}
      defaultSize={DEFAULT_SIZE}
      fileTypeOptions={FILE_TYPE_OPTIONS}
      viewportId={VIEWPORT_ID}
      showAnnotations={showAnnotations}
      onAnnotationsChange={setShowAnnotations}
      dimensions={viewportDimensions}
      onDimensionsChange={setViewportDimensions}
      onEnableViewport={handleEnableViewport}
      onDisableViewport={handleDisableViewport}
      onDownload={handleDownload}
      warningState={warningState}
    />
  );
};

interface ViewportDownloadFormNewProps {
  onClose: () => void;
  defaultSize: number;
  fileTypeOptions: Array<{ value: string; label: string }>;
  viewportId: string;
  showAnnotations: boolean;
  onAnnotationsChange: (show: boolean) => void;
  dimensions: { width: number; height: number };
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
  onEnableViewport: (element: HTMLElement) => void;
  onDisableViewport: () => void;
  onDownload: (filename: string, fileType: string) => void;
  warningState: { enabled: boolean; value: string };
}

function ViewportDownloadFormNew({
  onClose,
  defaultSize,
  fileTypeOptions,
  viewportId,
  showAnnotations,
  onAnnotationsChange,
  dimensions,
  warningState,
  onDimensionsChange,
  onEnableViewport,
  onDisableViewport,
  onDownload,
}: ViewportDownloadFormNewProps) {
  const [viewportElement, setViewportElement] = useState<HTMLElement | null>(null);
  const [showWarningMessage, setShowWarningMessage] = useState(true);
  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [fileType, setFileType] = useState('jpg');

  useEffect(() => {
    if (!viewportElement) {
      return;
    }

    onEnableViewport(viewportElement);

    return () => {
      onDisableViewport();
    };
  }, [onDisableViewport, onEnableViewport, viewportElement]);

  return (
    <ImageModal className="max-w-[850px]">
      <ImageModal.Body>
        <ImageModal.ImageVisual>
          <div
            style={{
              height: dimensions.height,
              width: dimensions.width,
              position: 'relative',
            }}
            data-viewport-uid={viewportId}
            ref={setViewportElement}
          >
            {warningState.enabled && showWarningMessage && (
              <div
                className="text-foreground absolute left-1/2 bottom-[5px] z-[1000] -translate-x-1/2 whitespace-nowrap rounded bg-black p-3 text-xs font-bold"
                style={{
                  fontSize: '12px',
                }}
              >
                {warningState.value}
              </div>
            )}
          </div>
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
            width={dimensions.width.toString()}
            height={dimensions.height.toString()}
            onWidthChange={e => {
              onDimensionsChange({
                ...dimensions,
                width: parseInt(e.target.value) || defaultSize,
              });
            }}
            onHeightChange={e => {
              onDimensionsChange({
                ...dimensions,
                height: parseInt(e.target.value) || defaultSize,
              });
            }}
            maxWidth={MAX_TEXTURE_SIZE.toString()}
            maxHeight={MAX_TEXTURE_SIZE.toString()}
          >
            Image size <span className="text-muted-foreground">px</span>
          </ImageModal.ImageSize>

          <ImageModal.SwitchOption
            defaultChecked={showAnnotations}
            checked={showAnnotations}
            onCheckedChange={onAnnotationsChange}
          >
            Include annotations
          </ImageModal.SwitchOption>
          {warningState.enabled && (
            <ImageModal.SwitchOption
              defaultChecked={showWarningMessage}
              checked={showWarningMessage}
              onCheckedChange={setShowWarningMessage}
            >
              Include warning message
            </ImageModal.SwitchOption>
          )}
          <FooterAction className="mt-2">
            <FooterAction.Right>
              <FooterAction.Secondary onClick={onClose}>Cancel</FooterAction.Secondary>
              <FooterAction.Primary
                onClick={() => {
                  onDownload(filename || DEFAULT_FILENAME, fileType);
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
