import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  createRef,
} from 'react';
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
const REFRESH_VIEWPORT_TIMEOUT = 1000;

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
  const [t] = useTranslation('ViewportDownloadForm');

  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [fileType, setFileType] = useState('jpg');

  const [height, setHeight] = useState(defaultSize);
  const [width, setWidth] = useState(defaultSize);

  const [showAnnotations, setShowAnnotations] = useState(true);

  const [keepAspect, setKeepAspect] = useState(true);
  const [lastImage, setLastImage] = useState();

  const [viewportElement, setViewportElement] = useState();
  const [viewportElementHeight, setViewportElementHeight] = useState(
    minimumSize
  );
  const [viewportElementWidth, setViewportElementWidth] = useState(minimumSize);

  const [downloadCanvas, setDownloadCanvas] = useState({
    ref: createRef(),
    width: minimumSize,
    height: minimumSize,
  });

  const [viewportPreview, setViewportPreview] = useState({
    src: null,
    width: minimumSize,
    height: minimumSize,
  });

  const [error, setError] = useState({
    width: false,
    height: false,
    filename: false,
  });
  const hasError = Object.values(error).includes(true);

  useEffect(() => {
    enableViewport(viewportElement);

    return () => {
      disableViewport(viewportElement);

      setHeight(defaultSize);
      setWidth(defaultSize);
    };
  }, [defaultSize, disableViewport, enableViewport, viewportElement]);

  const refreshViewport = useRef(null);

  const validSize = value => (value >= minimumSize ? value : minimumSize);
  const loadAndUpdateViewports = useCallback(async () => {
    const { image, width: scaledWidth, height: scaledHeight } = await loadImage(
      activeViewport,
      viewportElement,
      width,
      height
    );
    setLastImage(image);

    toggleAnnotations(showAnnotations, viewportElement);

    setViewportElementHeight(validSize(scaledHeight));
    setViewportElementWidth(validSize(scaledWidth));

    setDownloadCanvas(state => ({
      ...state,
      height: validSize(scaledHeight),
      width: validSize(scaledWidth),
    }));

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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [
    activeViewport,
    viewportElement,
    showAnnotations,
    height,
    width,
    loadImage,
    toggleAnnotations,
    updateViewportPreview,
    fileType,
    downloadCanvas.ref,
    minimumSize,
    maximumSize,
  ]);

  useEffect(() => {
    if (refreshViewport.current !== null) {
      clearTimeout(refreshViewport.current);
    }

    refreshViewport.current = setTimeout(() => {
      refreshViewport.current = null;
      loadAndUpdateViewports();
    }, REFRESH_VIEWPORT_TIMEOUT);

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [
    activeViewport,
    viewportElement,
    showAnnotations,
    height,
    width,
    loadImage,
    toggleAnnotations,
    updateViewportPreview,
    fileType,
    downloadCanvas.ref,
    minimumSize,
    maximumSize,
  ]);

  const errorMessages = {
    width: t('minWidthError'),
    height: t('minHeightError'),
    filename: t('emptyFilenameError'),
  };

  const renderErrorHandler = errorType => {
    if (!error[errorType]) {
      return null;
    }

    return <div className="input-error">{errorMessages[errorType]}</div>;
  };

  const onHeightChange = event => {
    const newHeight = Math.min(event.target.value, maximumSize);
    setHeight(newHeight);

    setViewportElementHeight(newHeight);

    setDownloadCanvas(state => ({
      ...state,
      height: newHeight,
    }));

    if (keepAspect) {
      const multiplier = newHeight / lastImage.height;
      const newWidth = Math.round(lastImage.width * multiplier);

      setWidth(newWidth);
      setViewportElementWidth(newWidth);

      setDownloadCanvas(state => ({
        ...state,
        width: newWidth,
      }));
    }
  };

  const onWidthChange = ({ target: { value } }) => {
    const newWidth = Math.min(value, maximumSize);
    setWidth(newWidth);

    setViewportElementWidth(newWidth);

    setDownloadCanvas(state => ({
      ...state,
      width: newWidth,
    }));

    if (keepAspect) {
      const multiplier = newWidth / lastImage.width;
      const newHeight = Math.round(lastImage.height * multiplier);

      setHeight(newHeight);
      setViewportElementHeight(newHeight);

      setDownloadCanvas(state => ({
        ...state,
        height: newHeight,
      }));
    }
  };

  useEffect(() => {
    const hasError = {
      width: width < minimumSize,
      height: height < minimumSize,
      filename: !filename,
    };

    setError({ ...hasError });
  }, [width, height, filename, minimumSize]);

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
      <div className="title">{t('formTitle')}</div>

      <div className="file-info-container">
        <div className="col">
          <div className="width">
            <TextInput
              type="number"
              min={minimumSize}
              max={maximumSize}
              value={width}
              label={t('imageWidth')}
              onChange={onWidthChange}
            />
            {renderErrorHandler('width')}
          </div>
          <div className="height">
            <TextInput
              type="number"
              min={minimumSize}
              max={maximumSize}
              value={height}
              label={t('imageHeight')}
              onChange={onHeightChange}
            />
            {renderErrorHandler('height')}
          </div>
          <div className="keep-aspect">
            <label htmlFor="keep-aspect" className="form-check-label">
              <input
                id="keep-aspect"
                type="checkbox"
                className="form-check-input"
                checked={keepAspect}
                onChange={() => setKeepAspect(!keepAspect)}
              />
              {t('keepAspectRatio')}
            </label>
          </div>
        </div>

        <div className="col">
          <div className="file-name">
            <TextInput
              type="text"
              value={filename}
              onChange={event => setFilename(event.target.value)}
              label={t('filename')}
              id="file-name"
            />
            {renderErrorHandler('filename')}
          </div>
          <div className="file-type">
            <Select
              value={fileType}
              onChange={event => setFileType(event.target.value)}
              options={FILE_TYPE_OPTIONS}
              label={t('fileType')}
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
              {t('showAnnotations')}
            </label>
          </div>
        </div>
      </div>

      <div
        style={{
          height: viewportElementHeight,
          width: viewportElementWidth,
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

      {viewportPreview.src ? (
        <div className="preview">
          <h4> {t('imagePreview')}</h4>
          <img
            className="viewport-preview"
            src={viewportPreview.src}
            alt={t('imagePreview')}
          />
        </div>
      ) : (
          <div className="loading-image">{t('loadingPreview')}</div>
        )}

      <div className="actions">
        <div className="action-cancel">
          <button type="button" className="btn btn-danger" onClick={onClose}>
            {t('Buttons:Cancel')}
          </button>
        </div>
        <div className="action-save">
          <button
            disabled={hasError}
            onClick={downloadImage}
            className="btn btn-primary"
          >
            {t('Buttons:Download')}
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
  defaultSize: PropTypes.number.isRequired,
  minimumSize: PropTypes.number.isRequired,
  maximumSize: PropTypes.number.isRequired,
  canvasClass: PropTypes.string.isRequired,
};

export default ViewportDownloadForm;
