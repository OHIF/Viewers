import React, { useEffect, useState, createRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import './ViewportDownloadForm.styl';
import { TextInput, Select } from '@ohif/ui';

const FILE_TYPE_OPTIONS = [
  {
    key: 'jpg',
    value: 'jpg',
  },
  {
    key: 'png',
    value: 'png',
  },
];

const DEFAULT_FILENAME = 'image';

const ViewportDownloadForm = ({
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
  maximumSize,
  canvasClass,
}) => {
  const [t] = useTranslation('Buttons');

  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [fileType, setFileType] = useState('jpg');

  const [dimensions, setDimensions] = useState({
    width: defaultSize,
    height: defaultSize,
  });

  const [showAnnotations, setShowAnnotations] = useState(true);

  const [viewportElement, setViewportElement] = useState();
  const [viewportElementDimensions, setViewportElementDimensions] = useState({
    width: defaultSize,
    height: defaultSize,
  });

  const [downloadCanvas, setDownloadCanvas] = useState({
    ref: createRef(),
    width: defaultSize,
    height: defaultSize,
  });

  const [viewportPreview, setViewportPreview] = useState({
    src: null,
    width: defaultSize,
    height: defaultSize,
  });

  // Cornerstone's `enable/disable`
  useEffect(() => {
    enableViewport(viewportElement);

    return () => {
      disableViewport(viewportElement);
    };
  }, [disableViewport, enableViewport, viewportElement]);

  useEffect(() => {
    const { width, height } = viewportElementDimensions;
    const validSize = value => (value >= minimumSize ? value : minimumSize);
    const loadAndUpdateViewports = async () => {
      await loadImage(activeViewport, viewportElement, width, height);
      toggleAnnotations(showAnnotations, viewportElement);

      const {
        dataUrl,
        width: viewportElementWidth,
        height: viewportElementHeight,
      } = await updateViewportPreview(
        viewportElement,
        downloadCanvas.ref.current,
        fileType
      );

      setViewportPreview(state => ({
        ...state,
        src: dataUrl,
        width: validSize(viewportElementWidth),
        height: validSize(viewportElementHeight),
      }));
    };

    loadAndUpdateViewports();
  }, [
    activeViewport,
    viewportElement,
    showAnnotations,
    loadImage,
    toggleAnnotations,
    updateViewportPreview,
    fileType,
    downloadCanvas.ref,
    minimumSize,
    maximumSize,
    viewportElementDimensions,
  ]);

  /**
   * @param {object} event - Input change event
   * @param {string} dimension - "height" | "width"
   */
  const onDimensionsChange = (event, dimension) => {
    const sanitizedTargetValue = event.target.value.replace(/\D/, '');
    const isEmpty = sanitizedTargetValue === '';
    const updatedDimension = isEmpty
      ? ''
      : Math.min(sanitizedTargetValue, maximumSize);

    if (updatedDimension === dimensions.width) {
      return;
    }

    // In current code, keepAspect is always `true`
    // And we always start w/ a square width/height
    setDimensions({
      width: updatedDimension,
      height: updatedDimension,
    });

    // Only update if value is non-empty
    if (!isEmpty) {
      setViewportElementDimensions({
        height: updatedDimension,
        width: updatedDimension,
      });
      setDownloadCanvas(state => ({
        ...state,
        height: updatedDimension,
        width: updatedDimension,
      }));
    }
  };

  const downloadImage = () => {
    downloadBlob(
      filename || DEFAULT_FILENAME,
      fileType,
      viewportElement,
      downloadCanvas.ref.current
    );
  };

  return (
    <div className="ViewportDownloadForm">
      <div className="title">
        {t(
          'Please specify the dimensions, filename, and desired type for the output image.'
        )}
      </div>

      <div className="file-info-container" data-cy="file-info-container">
        <div className="col">
          <div className="width">
            <TextInput
              data-cy="image-width"
              value={dimensions.width}
              label={t('Image width (px)')}
              onChange={evt => onDimensionsChange(evt, 'height')}
            />
          </div>
          <div className="height">
            <TextInput
              data-cy="image-height"
              value={dimensions.height}
              label={t('Image height (px)')}
              onChange={evt => onDimensionsChange(evt, 'width')}
            />
          </div>
        </div>

        <div className="col">
          <div className="file-name">
            <TextInput
              type="text"
              data-cy="file-name"
              value={filename}
              onChange={event => setFilename(event.target.value)}
              label={t('File name')}
              id="file-name"
            />
          </div>
          <div className="file-type">
            <Select
              value={fileType}
              data-cy="file-type"
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
                data-cy="show-annotations"
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
          height: viewportElementDimensions.height,
          width: viewportElementDimensions.width,
          position: 'absolute',
          left: '9999px',
        }}
        ref={ref => setViewportElement(ref)}
      >
        <canvas
          className={canvasClass}
          style={{
            height: downloadCanvas.height,
            width: downloadCanvas.width,
            display: 'block',
          }}
          width={downloadCanvas.width}
          height={downloadCanvas.height}
          ref={downloadCanvas.ref}
        ></canvas>
      </div>

      <div className="preview" data-cy="image-preview">
        <h4> {t('Image Preview')}</h4>
        <img
          className="viewport-preview"
          src={viewportPreview.src}
          alt="Viewport Preview"
          data-cy="viewport-preview-img"
        />
      </div>

      <div className="actions">
        <div className="action-cancel">
          <button
            type="button"
            data-cy="cancel-btn"
            className="btn btn-danger"
            onClick={onClose}
          >
            {t('Cancel')}
          </button>
        </div>
        <div className="action-save">
          <button
            onClick={downloadImage}
            className="btn btn-primary"
            data-cy="download-btn"
          >
            {t('Download')}
          </button>
        </div>
      </div>
    </div>
  );
};

ViewportDownloadForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  activeViewport: PropTypes.object,
  updateViewportPreview: PropTypes.func.isRequired,
  enableViewport: PropTypes.func.isRequired,
  disableViewport: PropTypes.func.isRequired,
  toggleAnnotations: PropTypes.func.isRequired,
  loadImage: PropTypes.func.isRequired,
  downloadBlob: PropTypes.func.isRequired,
  /** A default width & height, between the minimum and maximum size */
  defaultSize: PropTypes.number.isRequired,
  minimumSize: PropTypes.number.isRequired,
  maximumSize: PropTypes.number.isRequired,
  canvasClass: PropTypes.string.isRequired,
};

export default ViewportDownloadForm;
