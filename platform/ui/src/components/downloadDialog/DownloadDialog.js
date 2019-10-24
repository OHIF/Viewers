import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap-modal';

import './DownloadDialog.styl';
import { TextInput, Select } from '@ohif/ui';
import { withTranslation } from '../../utils/LanguageProvider';

const FILE_TYPE_OPTIONS = [
  {
    key: 'jpg',
    value: 'jpg'
  },
  {
    key: 'png',
    value: 'png'
  }
];

const DownloadDialog = ({
  t,
  isOpen,
  activeViewport,
  onClose,
  updateViewportPreview,
  enableViewport,
  disableViewport,
  toggleAnnotations,
  loadImage,
  downloadBlob,
  defaultSize,
  minimumSize,
  canvasClass
}) => {
  const [filename, setFilename] = useState('image');
  const [fileType, setFileType] = useState('jpg');

  const [height, setHeight] = useState(defaultSize);
  const [width, setWidth] = useState(defaultSize);

  const [showAnnotations, setShowAnnotations] = useState(true);

  const [keepAspect, setKeepAspect] = useState(true);
  const [lastImage, setLastImage] = useState();

  const [viewportElement, setViewportElement] = useState();
  const [viewportElementHeight, setViewportElementHeight] = useState(minimumSize);
  const [viewportElementWidth, setViewportElementWidth] = useState(minimumSize);

  const [downloadCanvas, setDownloadCanvas] = useState();
  const [downloadCanvasHeight, setDownloadCanvasHeight] = useState(minimumSize);
  const [downloadCanvasWidth, setDownloadCanvasWidth] = useState(minimumSize);

  const [viewportPreview, setViewportPreview] = useState();
  const [viewportPreviewSrc, setViewportPreviewSrc] = useState();
  const [viewportPreviewHeight, setViewportPreviewHeight] = useState(minimumSize);
  const [viewportPreviewWidth, setViewportPreviewWidth] = useState(minimumSize);

  useEffect(() => {
    enableViewport(viewportElement);

    return () => {
      disableViewport(viewportElement);

      setHeight(defaultSize);
      setWidth(defaultSize);
    };
  }, [viewportElement]);

  const loadAndUpdateViewports = async () => {
    const {
      image,
      width: scaledWidth,
      height: scaledHeight
    } = await loadImage(activeViewport, viewportElement, width, height);

    setLastImage(image);

    toggleAnnotations(showAnnotations, viewportElement);

    setViewportElementHeight(scaledHeight);
    setViewportElementWidth(scaledWidth);
    setDownloadCanvasHeight(scaledHeight);
    setDownloadCanvasWidth(scaledWidth);

    const {
      dataUrl,
      width: viewportElementWidth,
      height: viewportElementHeight
    } = await updateViewportPreview(viewportElement, downloadCanvas, fileType);

    setViewportPreviewSrc(dataUrl);
    setViewportPreviewHeight(viewportElementHeight);
    setViewportPreviewWidth(viewportElementWidth);
  };

  useEffect(() => {
    loadAndUpdateViewports();
  }, [
    activeViewport,
    viewportElement,
    showAnnotations,
    height,
    width
  ]);

  const onHeightChange = () => {
    const newHeight = event.target.value;
    setHeight(newHeight);

    setViewportElementHeight(newHeight);
    setDownloadCanvasHeight(newHeight);

    if (keepAspect) {
      const multiplier = newHeight / lastImage.height;
      const newWidth = Math.round(lastImage.width * multiplier);

      setWidth(newWidth);
      setViewportElementWidth(newWidth);
      setDownloadCanvasWidth(newWidth);
    }
  };

  const onWidthChange = event => {
    const newWidth = event.target.value;
    setWidth(newWidth);

    setViewportElementWidth(newWidth);
    setDownloadCanvasWidth(newWidth);

    if (keepAspect) {
      const multiplier = newWidth / lastImage.width;
      const newHeight = Math.round(lastImage.height * multiplier);

      setHeight(newHeight);
      setViewportElementHeight(newHeight);
      setDownloadCanvasHeight(newHeight);
    }
  };

  const downloadImage = () => {
    downloadBlob(filename, fileType, viewportElement, downloadCanvas);
  };

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      aria-labelledby="ModalHeader"
      className="DownloadDialog modal fade themed in"
      backdrop={false}
      large={true}
      keyboard={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {t('Download High Quality Image')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="title">
          {t('Please specify the dimensions, filename, and desired type for the output image.')}
        </div>

        <div className="file-info-container">
          <div className="col">
            <div className="width">
              <TextInput
                type="number"
                min={minimumSize}
                value={width}
                label={t('Image width (px)')}
                onChange={onWidthChange}
              />
            </div>
            <div className="height">
              <TextInput
                type="number"
                min={minimumSize}
                value={height}
                label={t('Image height (px)')}
                onChange={onHeightChange}
              />
            </div>
          </div>

          <div className="col">
            <div className="file-name">
              <TextInput
                type="text"
                value={filename}
                onChange={event => setFilename(event.target.value)}
                label={t('File name')}
                id="file-name"
              />
            </div>
            <div className="file-type">
              <Select
                value={fileType}
                onChange={event => setFileType(event.target.value)}
                options={FILE_TYPE_OPTIONS}
                label={t('File type')}
              />
            </div>
          </div>

          <div className="col">
            <div className="show-annotations">
              <label htmlFor="show-annotations" className="form-check-label">
                <input
                  id="show-annotations"
                  type="checkbox"
                  className="form-check-input"
                  checked={showAnnotations}
                  onChange={event => setShowAnnotations(event.target.checked)}
                />
                {t('Show Annotations')}
              </label>
            </div>
          </div>
        </div>

        <div
          style={{
            height: viewportElementHeight,
            width: viewportElementWidth,
            position: 'absolute',
            left: '9999px'
          }}
          ref={ref => setViewportElement(ref)}
        >
          <canvas
            className={canvasClass}
            style={{
              height: downloadCanvasHeight,
              width: downloadCanvasWidth,
              display: 'block'
            }}
            width={downloadCanvasWidth}
            height={downloadCanvasHeight}
            ref={ref => setDownloadCanvas(ref)}
          >
          </canvas>
        </div>

        <div className="preview">
          <h4> {t('Image Preview')}</h4>
          <img
            className="viewport-preview"
            src={viewportPreviewSrc}
            style={{
              height: viewportPreviewHeight,
              width: viewportPreviewWidth
            }}
            ref={ref => setViewportPreview(ref)}
          />
        </div>

        <div className="actions">
          <div className="action-cancel">
            <button
              type="button"
              className="btn btn-danger"
              onClick={onClose}
            >
              {t('Cancel')}
            </button>
          </div>
          <div className="action-save">
            <button onClick={downloadImage} className="btn btn-primary">
              {t('Download')}
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default withTranslation('DownloadDialog')(DownloadDialog);
