import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap-modal';

import './DownloadDialog.styl';
import { TextInput, Select } from '@ohif/ui';
import { withTranslation } from '../../utils/LanguageProvider';

const MINIMUM_SIZE = 100;
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

const DownloadDialog = ({ activeViewport, t, isOpen, toggleDownloadDialog }) => {
  const [filename, setFilename] = useState('image');
  const [fileType, setFileType] = useState('jpg');
  const [height, setHeight] = useState(512);
  const [width, setWidth] = useState(512);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const [keepAspect, setKeepAspect] = useState(true);
  const [lastImage, setLastImage] = useState();

  const [viewportElementHeight, setViewportElementHeight] = useState(1);
  const [viewportElementWidth, setViewportElementWidth] = useState(1);
  const [downloadCanvasHeight, setDownloadCanvasHeight] = useState(1);
  const [downloadCanvasWidth, setDownloadCanvasWidth] = useState(1);

  const [viewportPreviewSrc, setViewportPreviewSrc] = useState();
  const [viewportPreviewHeight, setViewportPreviewHeight] = useState(1);
  const [viewportPreviewWidth, setViewportPreviewWidth] = useState(1);

  const [viewportElement, setViewportElement] = useState();
  const [viewportPreview, setViewportPreview] = useState();
  const [downloadCanvas, setDownloadCanvas] = useState();

  const updateViewportPreview = () => {
    viewportElement.addEventListener('cornerstoneimagerendered', function updateViewport(event) {
      console.log('cornerstoneimagerendered', event);

      const enabledElement = cornerstone.getEnabledElement(event.target).element;
      const type = 'image/' + fileType;
      const dataUrl = downloadCanvas.toDataURL(type, 1);

      setViewportPreviewSrc(dataUrl);

      let newWidth = enabledElement.offsetHeight;
      let newHeight = enabledElement.offsetWidth;

      /* Limit image preview max size to fit inside modal. */
      if (newWidth > 512 || newHeight > 512) {
        const multiplier = 512 / Math.max(newWidth, newHeight);
        newHeight *= multiplier;
        newWidth *= multiplier;
      }

      setViewportPreviewHeight(newWidth);
      setViewportPreviewWidth(newHeight);

      viewportElement.removeEventListener('cornerstoneimagerendered', updateViewport);
    });
  };

  const toggleAnnotations = toggle => {
    cornerstoneTools.store.state.tools.forEach(({ name }) => {
      if (toggle) {
        cornerstoneTools.setToolEnabledForElement(viewportElement, name);
      } else {
        cornerstoneTools.setToolDisabledForElement(viewportElement, name);
      }
    });
  };

  /* viewportElement is the element that contains the canvas to be downloaded as image. */
  useEffect(() => {
    if (viewportElement) {
      cornerstone.enable(viewportElement);
    }
  }, [viewportElement]);

  /* Run on every change. */
  useEffect(() => {
    if (activeViewport) {
      const enabledElement = cornerstone.getEnabledElement(activeViewport);

      /* Copy current viewport. */
      const viewport = Object.assign({}, enabledElement.viewport);
      delete viewport.scale;
      viewport.translation = {
        x: 0,
        y: 0
      };

      cornerstone.loadImage(enabledElement.image.imageId)
        .then(image => {
          setLastImage(image);

          cornerstone.displayImage(viewportElement, image);
          cornerstone.setViewport(viewportElement, viewport);
          cornerstone.resize(viewportElement, true);

          toggleAnnotations(showAnnotations);

          const newWidth = Math.min(width || image.width, 16384);
          const newHeight = Math.min(height || image.height, 16384);

          console.log('cornerstone.loadImage', newHeight, newWidth);

          setViewportElementHeight(newHeight);
          setViewportElementWidth(newWidth);
          setDownloadCanvasHeight(newHeight);
          setDownloadCanvasWidth(newWidth);

          cornerstone.fitToWindow(viewportElement);
          updateViewportPreview();
        });
    }
  }, [
    viewportElement,
    viewportElementHeight,
    viewportElementWidth,
    downloadCanvasHeight,
    downloadCanvasWidth,
    downloadCanvas,
    showAnnotations,
    height,
    width,
    viewportPreviewSrc,
    viewportPreviewWidth,
    viewportPreviewHeight
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

  const onClose = () => {
    toggleDownloadDialog();
    toggleAnnotations(true);
  }

  const downloadImage = () => {
    const file = `${filename}.${fileType}`;
    const mimetype = `image/${fileType}`;

    // Handles JPEG images for IE11
    if (downloadCanvas.msToBlob && fileType === 'jpeg') {
      const image = downloadCanvas.toDataURL(mimetype, 1);
      const blob = b64toBlob(image.replace('data:image/jpeg;base64,', ''), mimetype);
      return window.navigator.msSaveBlob(blob, file);
    }

    return cornerstoneTools.SaveAs(viewportElement, file, mimetype);
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
        <div>

          <div className="title">
            {t('Please specify the dimensions, filename, and desired type for the output image.')}
          </div>

          <div className="file-info-container">
            <div className="col">
              <div className="width">
                <TextInput
                  type="number"
                  min={MINIMUM_SIZE}
                  value={width}
                  label={t('Width (px)')}
                  onChange={onWidthChange}
                />
              </div>
              <div className="height">
                <TextInput
                  type="number"
                  min={MINIMUM_SIZE}
                  value={height}
                  label={t('Height (px)')}
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
                  label={t('File Name')}
                  id="file-name"
                />
              </div>
              <div className="file-type">
                <Select
                  value={fileType}
                  onChange={event => setFileType(event.target.value)}
                  options={FILE_TYPE_OPTIONS}
                  label={t('File Type')}
                />
              </div>
            </div>

            <div className="col">
              <div className="show-annotations">
                <label htmlFor="show-annotations" className="form-check-label">
                  {t('Show Annotations')}
                  <input
                    id="show-annotations"
                    type="checkbox"
                    className="form-check-input"
                    checked={showAnnotations}
                    onChange={event => {
                      setShowAnnotations(event.target.checked);
                      toggleAnnotations(event.target.checked, true);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div
            // className="hidden"
            style={{ height: viewportElementHeight, width: viewportElementWidth }}
            ref={ref => setViewportElement(ref)}
          >
            <canvas
              className="cornerstone-canvas"
              style={{ height: downloadCanvasHeight, width: downloadCanvasWidth, display: 'block' }}
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
              style={{ height: viewportPreviewHeight, width: viewportPreviewWidth }}
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
        </div>
      </Modal.Body>
    </Modal>
  );
};

/* Enabled JPEG images downloading on IE11. */
const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export default withTranslation('DownloadDialog')(DownloadDialog);
