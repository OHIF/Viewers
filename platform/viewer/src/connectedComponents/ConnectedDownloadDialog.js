import { connect } from 'react-redux';
import { DownloadDialog } from '@ohif/ui';

const MINIMUM_SIZE = 100;
const DEFAULT_SIZE = 512;

const mapStateToProps = (state, ownProps) => {
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { dom: activeEnabledElement } = viewportSpecificData[activeViewportIndex] || {};

  return {
    onClose: ownProps.toggleDownloadDialog,
    minimumSize: MINIMUM_SIZE,
    defaultSize: DEFAULT_SIZE,
    activeViewport: activeEnabledElement,
    downloadBlob: (filename, fileType, viewportElement, downloadCanvas) => {
      const file = `${filename}.${fileType}`;
      const mimetype = `image/${fileType}`;

      /* Handles JPEG images for IE11 */
      if (downloadCanvas.msToBlob && fileType === 'jpeg') {
        const image = downloadCanvas.toDataURL(mimetype, 1);
        const blob = b64toBlob(image.replace('data:image/jpeg;base64,', ''), mimetype);
        return window.navigator.msSaveBlob(blob, file);
      }

      return cornerstoneTools.SaveAs(viewportElement, file, mimetype);
    },
    enableViewport: viewportElement => {
      if (viewportElement) {
        cornerstone.enable(viewportElement);
      }
    },
    disableViewport: viewportElement => {
      if (viewportElement) {
        cornerstone.disable(viewportElement);
      }
    },
    updateViewportPreview: (viewportElement, downloadCanvas, fileType) =>
      new Promise(resolve => {
        cornerstone.fitToWindow(viewportElement);

        viewportElement.addEventListener('cornerstoneimagerendered', function updateViewport(event) {
          const enabledElement = cornerstone.getEnabledElement(event.target).element;
          const type = 'image/' + fileType;
          const dataUrl = downloadCanvas.toDataURL(type, 1);

          let newWidth = enabledElement.offsetHeight;
          let newHeight = enabledElement.offsetWidth;

          if (newWidth > DEFAULT_SIZE || newHeight > DEFAULT_SIZE) {
            const multiplier = DEFAULT_SIZE / Math.max(newWidth, newHeight);
            newHeight *= multiplier;
            newWidth *= multiplier;
          }

          resolve({ dataUrl, width: newWidth, height: newHeight });

          viewportElement.removeEventListener('cornerstoneimagerendered', updateViewport);
        });
      }),
    loadImage: (activeViewport, viewportElement, width, height) =>
      new Promise(resolve => {
        if (activeViewport && viewportElement) {
          const enabledElement = cornerstone.getEnabledElement(activeViewport);
          const viewport = Object.assign({}, enabledElement.viewport);
          delete viewport.scale;
          viewport.translation = {
            x: 0,
            y: 0
          };

          cornerstone.loadImage(enabledElement.image.imageId)
            .then(image => {
              cornerstone.displayImage(viewportElement, image);
              cornerstone.setViewport(viewportElement, viewport);
              cornerstone.resize(viewportElement, true);

              const MAX_TEXTURE_SIZE = 16384;
              const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
              const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

              resolve({ image, width: newWidth, height: newHeight });
            });
        }
      }),
    toggleAnnotations: (toggle, viewportElement) => {
      cornerstoneTools.store.state.tools.forEach(({ name }) => {
        if (toggle) {
          cornerstoneTools.setToolEnabledForElement(viewportElement, name);
        } else {
          cornerstoneTools.setToolDisabledForElement(viewportElement, name);
        }
      });
    }
  }
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

const ConnectedDownloadDialog = connect(
  mapStateToProps,
  null
)(DownloadDialog);

export default ConnectedDownloadDialog;
