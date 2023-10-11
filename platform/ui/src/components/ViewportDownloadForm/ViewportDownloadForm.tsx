import React, { useCallback, useEffect, useState, createRef, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import Typography from '../Typography';
import Input from '../Input';
import Tooltip from '../Tooltip';
import IconButton from '../IconButton';
import Icon from '../Icon';
import Select from '../Select';
import InputLabelWrapper from '../InputLabelWrapper';
import Button, { ButtonEnums } from '../Button';

const FILE_TYPE_OPTIONS = [
  {
    value: 'jpg',
    label: 'jpg',
  },
  {
    value: 'png',
    label: 'png',
  },
];

const DEFAULT_FILENAME = 'image';

const REFRESH_VIEWPORT_TIMEOUT = 100;

const ViewportDownloadForm = ({
  activeViewportElement,
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
  const { t } = useTranslation('Modals');

  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [fileType, setFileType] = useState(['jpg']);

  const [dimensions, setDimensions] = useState({
    width: defaultSize,
    height: defaultSize,
  });

  const [showAnnotations, setShowAnnotations] = useState(true);

  const [keepAspect, setKeepAspect] = useState(true);
  const [aspectMultiplier, setAspectMultiplier] = useState({
    width: 1,
    height: 1,
  });

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

  const [error, setError] = useState({
    width: false,
    height: false,
    filename: false,
  });

  const hasError = Object.values(error).includes(true);

  const refreshViewport = useRef(null);

  const onKeepAspectToggle = () => {
    const { width, height } = dimensions;
    if (!keepAspect) {
      const aspectMultiplier = {
        width: width / height,
        height: height / width,
      };
      setAspectMultiplier(aspectMultiplier);
    }

    setKeepAspect(!keepAspect);
  };

  const downloadImage = () => {
    downloadBlob(
      filename || DEFAULT_FILENAME,
      fileType,
      viewportElement,
      downloadCanvas.ref.current
    );
  };

  /**
   * @param {object} value - Input value
   * @param {string} dimension - "height" | "width"
   */
  const onDimensionsChange = (value, dimension) => {
    const oppositeDimension = dimension === 'height' ? 'width' : 'height';
    const sanitizedTargetValue = value.replace(/\D/, '');
    const isEmpty = sanitizedTargetValue === '';
    const newDimensions = { ...dimensions };
    const updatedDimension = isEmpty ? '' : Math.min(sanitizedTargetValue, maximumSize);

    if (updatedDimension === dimensions[dimension]) {
      return;
    }

    newDimensions[dimension] = updatedDimension;

    if (keepAspect && newDimensions[oppositeDimension] !== '') {
      newDimensions[oppositeDimension] = Math.round(
        newDimensions[dimension] * aspectMultiplier[oppositeDimension]
      );
    }

    // In current code, keepAspect is always `true`
    // And we always start w/ a square width/height
    setDimensions(newDimensions);

    // Only update if value is non-empty
    if (!isEmpty) {
      setViewportElementDimensions(newDimensions);
      setDownloadCanvas(state => ({
        ...state,
        ...newDimensions,
      }));
    }
  };

  const error_messages = {
    width: 'The minimum valid width is 100px.',
    height: 'The minimum valid height is 100px.',
    filename: 'The file name cannot be empty.',
  };

  const renderErrorHandler = errorType => {
    if (!error[errorType]) {
      return null;
    }

    return (
      <Typography
        className="mt-2 pl-1"
        color="error"
      >
        {error_messages[errorType]}
      </Typography>
    );
  };

  const validSize = useCallback(
    value => (value >= minimumSize ? value : minimumSize),
    [minimumSize]
  );

  const loadAndUpdateViewports = useCallback(async () => {
    const { width: scaledWidth, height: scaledHeight } = await loadImage(
      activeViewportElement,
      viewportElement,
      dimensions.width,
      dimensions.height
    );

    toggleAnnotations(showAnnotations, viewportElement, activeViewportElement);

    const scaledDimensions = {
      height: validSize(scaledHeight),
      width: validSize(scaledWidth),
    };

    setViewportElementDimensions(scaledDimensions);
    setDownloadCanvas(state => ({
      ...state,
      ...scaledDimensions,
    }));

    const {
      dataUrl,
      width: viewportElementWidth,
      height: viewportElementHeight,
    } = await updateViewportPreview(viewportElement, downloadCanvas.ref.current, fileType);

    setViewportPreview(state => ({
      ...state,
      src: dataUrl,
      width: validSize(viewportElementWidth),
      height: validSize(viewportElementHeight),
    }));
  }, [
    loadImage,
    activeViewportElement,
    viewportElement,
    dimensions.width,
    dimensions.height,
    toggleAnnotations,
    showAnnotations,
    validSize,
    updateViewportPreview,
    downloadCanvas.ref,
    fileType,
  ]);

  useEffect(() => {
    enableViewport(viewportElement);

    return () => {
      disableViewport(viewportElement);
    };
  }, [disableViewport, enableViewport, viewportElement]);

  useEffect(() => {
    if (refreshViewport.current !== null) {
      clearTimeout(refreshViewport.current);
    }

    refreshViewport.current = setTimeout(() => {
      refreshViewport.current = null;
      loadAndUpdateViewports();
    }, REFRESH_VIEWPORT_TIMEOUT);
  }, [
    activeViewportElement,
    viewportElement,
    showAnnotations,
    dimensions,
    loadImage,
    toggleAnnotations,
    updateViewportPreview,
    fileType,
    downloadCanvas.ref,
    minimumSize,
    maximumSize,
    loadAndUpdateViewports,
  ]);

  useEffect(() => {
    const { width, height } = dimensions;
    const hasError = {
      width: width < minimumSize,
      height: height < minimumSize,
      filename: !filename,
    };

    setError({ ...hasError });
  }, [dimensions, filename, minimumSize]);

  return (
    <div>
      <Typography variant="h6">
        {t('Please specify the dimensions, filename, and desired type for the output image.')}
      </Typography>

      <div className="mt-6 flex flex-col">
        <div className="mb-4 w-full">
          <Input
            data-cy="file-name"
            value={filename}
            onChange={evt => setFilename(evt.target.value)}
            label={t('File Name')}
          />
          {renderErrorHandler('filename')}
        </div>
        <div className="flex">
          <div className="flex w-1/3">
            <div className="flex grow flex-col">
              <div className="w-full">
                <Input
                  type="number"
                  min={minimumSize}
                  max={maximumSize}
                  label={t('Image width (px)')}
                  value={dimensions.width}
                  onChange={evt => onDimensionsChange(evt.target.value, 'width')}
                  data-cy="image-width"
                />
                {renderErrorHandler('width')}
              </div>
              <div className="mt-4 w-full">
                <Input
                  type="number"
                  min={minimumSize}
                  max={maximumSize}
                  label={t('Image height (px)')}
                  value={dimensions.height}
                  onChange={evt => onDimensionsChange(evt.target.value, 'height')}
                  data-cy="image-height"
                />
                {renderErrorHandler('height')}
              </div>
            </div>

            <div className="mt-8 flex items-center">
              <Tooltip
                position="right"
                content={keepAspect ? 'Dismiss Aspect' : 'Keep Aspect'}
              >
                <IconButton
                  onClick={onKeepAspectToggle}
                  size="small"
                  rounded="full"
                >
                  <Icon name={keepAspect ? 'link' : 'unlink'} />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <div className="border-secondary-dark ml-6 w-1/4 border-l pl-6">
            <div>
              <InputLabelWrapper
                sortDirection="none"
                label={t('File Type')}
                isSortable={false}
                onLabelClick={() => {}}
              >
                <Select
                  className="mt-2 text-white"
                  isClearable={false}
                  value={fileType}
                  data-cy="file-type"
                  onChange={value => {
                    setFileType([value.value]);
                  }}
                  hideSelectedOptions={false}
                  options={FILE_TYPE_OPTIONS}
                  placeholder="File Type"
                />
              </InputLabelWrapper>
            </div>
            <div className="mt-4 ml-2">
              <label
                htmlFor="show-annotations"
                className="flex items-center"
              >
                <input
                  id="show-annotations"
                  data-cy="show-annotations"
                  type="checkbox"
                  className="mr-2"
                  checked={showAnnotations}
                  onChange={event => setShowAnnotations(event.target.checked)}
                />
                <Typography>{t('Show Annotations')}</Typography>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div
          className="bg-secondary-dark border-secondary-primary w-max-content min-w-full rounded p-4"
          data-cy="image-preview"
        >
          <Typography variant="h5">{t('Image preview')}</Typography>
          {activeViewportElement && (
            <div
              className="mx-auto my-2"
              style={{
                height: viewportElementDimensions.height,
                width: viewportElementDimensions.width,
              }}
              ref={ref => setViewportElement(ref)}
            ></div>
          )}
          {!activeViewportElement && (
            <Typography className="mt-4">{t('Active viewport has no displayed image')}</Typography>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          name="cancel"
          type={ButtonEnums.type.secondary}
          onClick={onClose}
        >
          {t('Cancel')}
        </Button>
        <Button
          className="ml-2"
          disabled={hasError}
          onClick={downloadImage}
          type={ButtonEnums.type.primary}
          name={'download'}
        >
          {t('Download')}
        </Button>
      </div>
    </div>
  );
};

export default ViewportDownloadForm;
