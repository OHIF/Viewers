import React, { useState, useEffect } from 'react';
import { ImageModal, FooterAction } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
const MAX_TEXTURE_SIZE = 10000;
const DEFAULT_FILENAME = 'image';

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
  const { t } = useTranslation('CaptureViewportModal');

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
    <ImageModal>
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
              {t('File name')}
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
            {t('Image size')} <span className="text-muted-foreground">px</span>
          </ImageModal.ImageSize>

          <ImageModal.SwitchOption
            defaultChecked={showAnnotations}
            checked={showAnnotations}
            onCheckedChange={onAnnotationsChange}
          >
            {t('Include annotations')}
          </ImageModal.SwitchOption>
          {warningState.enabled && (
            <ImageModal.SwitchOption
              defaultChecked={showWarningMessage}
              checked={showWarningMessage}
              onCheckedChange={setShowWarningMessage}
            >
              {t('Include warning message')}
            </ImageModal.SwitchOption>
          )}
          <FooterAction className="mt-2">
            <FooterAction.Right>
              <FooterAction.Secondary onClick={onClose}>
                {t('Common:Cancel')}
              </FooterAction.Secondary>
              <FooterAction.Primary
                onClick={() => {
                  onDownload(filename || DEFAULT_FILENAME, fileType);
                  onClose();
                }}
              >
                {t('Common:Save')}
              </FooterAction.Primary>
            </FooterAction.Right>
          </FooterAction>
        </ImageModal.ImageOptions>
      </ImageModal.Body>
    </ImageModal>
  );
}

export default {
  'ohif.captureViewportModal': ViewportDownloadFormNew,
};
